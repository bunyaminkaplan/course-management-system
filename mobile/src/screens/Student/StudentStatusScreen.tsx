import { colors, fonts, radii, spacing } from '../../theme/tokens';
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useMyClassrooms } from '../../hooks/useMyClassrooms';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, FileText, CircleUser } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { get } from '../../api/client';
import { Attendance, Session, StudentAssignment } from '../../types/api';
import { calculateAttendanceRate } from '../../utils/calculateAttendanceRate';
import { Exam, Grade } from '../../types/api';
import { calculateExamStats } from '../../utils/calculateExamStats';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import GlassTopBar from '../../components/GlassTopBar';
import GlassSurface from '../../components/GlassSurface';

import GradientBackground from '../../components/GradientBackground';

export default function StudentStatusScreen() {
  const [selectedClassroomId, setSelectedClassroomId] = useState<number | null>(null);

  const { user } = useAuth();
  const { myClassrooms, isLoading: classroomsLoading } = useMyClassrooms();
  const navigation = useNavigation<any>();

      const activeClassroomId = selectedClassroomId || (myClassrooms.length > 0 ? myClassrooms[0].id : null);
  const classroom = myClassrooms.find(c => c.id === activeClassroomId);

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => get<Session[]>('/api/sessions/')
  });
  
  const { data: attendances, isLoading: attendancesLoading } = useQuery({
    queryKey: ['attendances'],
    queryFn: () => get<Attendance[]>('/api/attendances/')
  });

  const { data: studentAssignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: () => get<StudentAssignment[]>('/api/student-assignments/')
  });

  const { data: allExams } = useQuery({
    queryKey: ['exams'],
    queryFn: () => get<Exam[]>('/api/exams/')
  });
  const exams = allExams?.filter(e => e.classroom === activeClassroomId) || [];

  const { data: allGrades } = useQuery({
    queryKey: ['grades'],
    queryFn: () => get<Grade[]>('/api/grades/')
  });

  const isLoading = classroomsLoading || sessionsLoading || attendancesLoading || assignmentsLoading;

  const classroomSessions = sessions?.filter(s => s.classroom === activeClassroomId && s.status === 'COMPLETED') || [];
  const sessionIds = classroomSessions.map(s => s.id);
  const myAttendances = attendances?.filter(a => sessionIds.includes(a.session) && a.student === user?.id) || [];
  const attendanceRate = myAttendances.length > 0 ? calculateAttendanceRate(myAttendances) : 0;
  const presentCount = myAttendances.filter(a => a.is_present).length;
  const absentCount = myAttendances.length - presentCount;
  const limit = 5;
  const remaining = Math.max(0, limit - absentCount);

  const myCourseAssignments = studentAssignments?.filter(sa => sa.student === user?.id && sa.assignment_details.classroom === activeClassroomId) || [];

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.submitted} />
      </View>
    );
  }

  return (
    <GradientBackground>
      <GlassTopBar 
        title="Durum" 
        rightElement={
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Profile') || navigation.navigate('Profile')}>
            <CircleUser size={24} color={colors.accentSoft} />
          </TouchableOpacity>
        }
      />

      <View style={{ height: 60 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, alignItems: 'center' }}>
          {myClassrooms.map(c => {
            const isActive = c.id === activeClassroomId;
            return (
              <TouchableOpacity 
                key={c.id} 
                onPress={() => setSelectedClassroomId(c.id)}
                style={[styles.classChip, isActive && styles.classChipActive]}
              >
                <Text style={[styles.classChipText, isActive && styles.classChipTextActive]}>{c.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeClassroomId && classroom ? (
          <>
            <Text style={styles.sectionTitle}>Devamsızlık Durumu</Text>
            <GlassSurface elevation="high" padding={16} style={{ marginBottom: 12 }}>
              {myAttendances.length > 0 ? (
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <Text style={styles.statLabel}>Katılım</Text>
                      <Text style={styles.statValueGreen}>{presentCount}</Text>
                    </View>
                    <View style={{ alignItems: 'center', flex: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.glassBorder }}>
                      <Text style={styles.statLabel}>Devamsızlık</Text>
                      <Text style={styles.statValueRed}>{absentCount}</Text>
                    </View>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <Text style={styles.statLabel}>Kalan Hak</Text>
                      <Text style={[styles.statValue, remaining === 0 && { color: colors.overdue }]}>
                        {remaining}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.barContainer}>
                    <View style={[styles.barFill, { width: `${attendanceRate}%`, backgroundColor: attendanceRate > 50 ? colors.submitted : colors.overdue }]} />
                  </View>
                  <Text style={styles.barLabel}>Katılım Oranı: %{attendanceRate}</Text>
                </View>
              ) : (
                <Text style={styles.emptyText}>Devamsızlık verisi yok</Text>
              )}
            </GlassSurface>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Sınavlar</Text>
            {(!exams || exams.length === 0) ? (
              <Text style={styles.emptyText}>Bu derse ait sınav bulunmuyor.</Text>
            ) : (
              exams.map(exam => {
                const grades = allGrades?.filter(g => g.exam === exam.id) || [];
                const formattedGrades = grades.map(g => ({ ...g, student_id: g.student }));
                const stats = calculateExamStats(formattedGrades, user?.id || -1);
                const myGradeObj = formattedGrades.find(g => g.student_id === user?.id);
                const myGrade = myGradeObj?.grade;
                
                return (
                  <View key={`exam-${exam.id}`} style={styles.cardBlock}>
                    <Text style={styles.cardTitle}>{exam.title}</Text>
                    {myGrade !== undefined && myGrade !== null ? (
                      <View style={{ marginTop: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text style={styles.statLabel}>Notu: <Text style={{ color: colors.ink, fontWeight: 'bold' }}>{myGrade}</Text></Text>
                          <Text style={styles.statLabel}>Ort: <Text style={{ color: colors.ink, fontWeight: 'bold' }}>{stats.average}</Text></Text>
                          <Text style={styles.statLabel}>Sıra: <Text style={{ color: colors.ink, fontWeight: 'bold' }}>{stats.rank}/{stats.gradedCount}</Text></Text>
                        </View>
                        <View style={styles.chartContainer}>
                          <View style={styles.chartBarWrapper}>
                            <View style={[styles.chartBar, { height: `${myGrade}%`, backgroundColor: colors.submitted }]} />
                            <Text style={styles.chartLabel}>Öğrenci</Text>
                          </View>
                          <View style={styles.chartBarWrapper}>
                            <View style={[styles.chartBar, { height: `${stats.average || 0}%`, backgroundColor: colors.accentSoft }]} />
                            <Text style={styles.chartLabel}>Sınıf Ort.</Text>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.noGradeText}>Henüz not girilmedi</Text>
                    )}
                  </View>
                );
              })
            )}

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Ödevler</Text>
            {myCourseAssignments.length === 0 ? (
              <Text style={styles.emptyText}>Bu derse ait ödev bulunmuyor.</Text>
            ) : (
              myCourseAssignments.map(sa => (
                <View key={`assignment-${sa.id}`} style={styles.rowCard}>
                  <View style={styles.rowIcon}>
                    <FileText size={20} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{sa.assignment_details.title}</Text>
                    <Text style={styles.rowSubtitle}>
                      {format(new Date(sa.assignment_details.deadline), "d MMMM HH:mm", { locale: tr })}
                    </Text>
                  </View>
                  <View style={styles.badgeContainer}>
                    <Text style={[styles.badgeText, 
                      sa.status === 'SUBMITTED' || sa.status === 'APPROVED' || sa.status === 'GRADED' ? { color: colors.submitted } : 
                      sa.status === 'OVERDUE' || sa.status === 'REJECTED' ? { color: colors.coral } : { color: colors.accent }
                    ]}>
                      {sa.status === 'PENDING' ? 'Bekliyor' : sa.status === 'SUBMITTED' ? 'Teslim Edildi' : sa.status === 'APPROVED' ? 'Onaylandı' : sa.status === 'REJECTED' ? 'Reddedildi' : sa.status === 'OVERDUE' ? 'Gecikti' : sa.status}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          <Text style={styles.emptyText}>Henüz kayıtlı olduğunuz bir ders bulunmuyor.</Text>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg1, overflow: 'hidden' },
  centerContainer: { flex: 1, backgroundColor: colors.bg1, justifyContent: 'center', alignItems: 'center' },
  orb: { position: 'absolute', borderRadius: 9999 },
  orb1: { top: '-10%', left: '-10%', width: 500, height: 500, backgroundColor: 'rgba(79,70,229,0.2)', ...( { filter: 'blur(120px)' } as any ) },
  orb2: { bottom: '-10%', right: '-10%', width: 600, height: 600, backgroundColor: 'rgba(147,51,234,0.2)', ...( { filter: 'blur(150px)' } as any ) },
  
  header: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, borderBottomWidth: 1, borderBottomColor: colors.glassBg, backgroundColor: colors.bg2 },
  headerTitle: { color: colors.ink, fontSize: 22, fontWeight: 'bold' },
  
  classSelector: { marginTop: 16, marginBottom: 8, height: 40 },
  classChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder, marginRight: 12, justifyContent: 'center' },
  classChipActive: { backgroundColor: colors.glassBorder, borderColor: colors.glassBorder },
  classChipText: { color: colors.inkDim, fontSize: 13, fontWeight: '500' },
  classChipTextActive: { color: colors.ink, fontWeight: 'bold' },

  scrollContent: { padding: 20, paddingBottom: 120 },
  
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  emptyText: { color: colors.inkDim, fontSize: 14, fontStyle: 'italic', marginBottom: 16, textAlign: 'center' },
  
  cardBlock: { backgroundColor: colors.glassBg, borderColor: colors.glassBorder, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '600', marginBottom: 8 },
  
  statLabel: { color: colors.submitted, fontSize: 12, marginBottom: 4 },
  statValue: { color: colors.ink, fontSize: 18, fontWeight: 'bold', textShadowColor: 'rgba(245,166,35,0.35)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 } },
  statValueGreen: { color: colors.submitted, fontSize: 18, fontWeight: 'bold', textShadowColor: 'rgba(245,166,35,0.35)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 } },
  statValueRed: { color: colors.overdue, fontSize: 18, fontWeight: 'bold', textShadowColor: 'rgba(245,166,35,0.35)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 } },
  
  barContainer: { height: 12, backgroundColor: colors.glassBorder, borderRadius: 6, overflow: 'hidden', marginTop: 12 },
  barFill: { height: '100%', borderRadius: 6 },
  barLabel: { color: colors.submitted, fontSize: 12, textAlign: 'center', marginTop: 8 },
  
  chartContainer: { flexDirection: 'row', justifyContent: 'space-around', height: 120, marginTop: 16, borderTopWidth: 1, borderTopColor: colors.glassBg, paddingTop: 16 },
  chartBarWrapper: { alignItems: 'center', justifyContent: 'flex-end', flex: 1 },
  chartBar: { width: 30, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  chartLabel: { color: colors.submitted, fontSize: 11, marginTop: 6 },
  noGradeText: { color: colors.submitted, fontSize: 13, marginTop: 8, fontStyle: 'italic' },
  rowCard: { backgroundColor: colors.glassBg, borderColor: colors.glassBg, borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  rowIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.glassBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowTitle: { color: colors.ink, fontSize: 16, fontWeight: '600', marginBottom: 4 },
  rowSubtitle: { color: colors.submitted, fontSize: 13, marginBottom: 2 },
  
  badgeContainer: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.glassBorder, borderWidth: 1, borderColor: colors.glassBorder },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
});
