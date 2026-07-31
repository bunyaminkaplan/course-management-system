import { colors, fonts, radii, spacing } from '../../theme/tokens';
import React, { useMemo } from 'react';
import BackButton from '../../components/BackButton';
import GradientBackground from '../../components/GradientBackground';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { get } from '../../api/client';
import { StudentAssignment, Attendance, Session } from '../../types/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, CircleUser } from 'lucide-react-native';
import { calculateAttendanceRate } from '../../utils/calculateAttendanceRate';
import { Exam, Grade } from '../../types/api';
import { calculateExamStats } from '../../utils/calculateExamStats';
import { useMyClassrooms } from '../../hooks/useMyClassrooms';

export default function StudentDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { studentId, studentName, classroomId } = route.params;

  const { myClassrooms } = useMyClassrooms();
  const classroom = myClassrooms.find(c => c.id === classroomId);

  const { data: assignments, isLoading: loadingAssigments } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: () => get<StudentAssignment[]>('/api/student-assignments/')
  });

  const { data: attendances, isLoading: loadingAtt } = useQuery({
    queryKey: ['attendances'],
    queryFn: () => get<Attendance[]>('/api/attendances/')
  });

  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => get<Session[]>('/api/sessions/')
  });

  const { data: exams, isLoading: examsLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: () => get<Exam[]>('/api/exams/')
  });
  const classroomExams = exams?.filter(e => e.classroom === classroomId);

  const { data: allGrades, isLoading: gradesLoading } = useQuery({
    queryKey: ['grades'],
    queryFn: () => get<Grade[]>('/api/grades/')
  });

  const isLoading = loadingAssigments || loadingAtt || loadingSessions || examsLoading || gradesLoading;

  const attendanceStats = useMemo(() => {
    if (!attendances || !sessions) return null;
    
    const classSessions = sessions.filter(s => s.classroom === classroomId && s.status === 'COMPLETED');
    const classSessionIds = classSessions.map(s => s.id);
    
    const studentAtt = attendances.filter(a => a.student === studentId && classSessionIds.includes(a.session));
    if (studentAtt.length === 0) return null;

    const rate = calculateAttendanceRate(studentAtt);
    const present = studentAtt.filter(a => a.is_present).length;
    const absent = studentAtt.length - present;
    const limit = 5; 
    const remaining = Math.max(0, limit - absent);

    return { rate, present, absent, total: studentAtt.length, remaining, limit };
  }, [attendances, sessions, classroomId, studentId]);

  const studentGrades = useMemo(() => {
    if (!assignments) return [];
    return assignments.filter(a => a.student === studentId && a.assignment_details.classroom === classroomId);
  }, [assignments, studentId, classroomId]);

  return (
    <GradientBackground>
<View style={styles.topbar}>
        <View style={styles.headerRow}>
          <BackButton />
          <Text style={styles.title} numberOfLines={1}>{studentName}</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Profile')}>
            <CircleUser size={28} color={colors.accentSoft} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accentSoft} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Devamsızlık Durumu</Text>
            <View style={styles.card}>
              {attendanceStats ? (
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <Text style={styles.statLabel}>Katılım</Text>
                      <Text style={styles.statValueGreen}>{attendanceStats.present}</Text>
                    </View>
                    <View style={{ alignItems: 'center', flex: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.glassBorder }}>
                      <Text style={styles.statLabel}>Devamsızlık</Text>
                      <Text style={styles.statValueRed}>{attendanceStats.absent}</Text>
                    </View>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <Text style={styles.statLabel}>Kalan Hak</Text>
                      <Text style={[styles.statValue, attendanceStats.remaining === 0 && { color: colors.overdue }]}>
                        {attendanceStats.remaining}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.barContainer}>
                    <View style={[styles.barFill, { width: `${attendanceStats.rate}%`, backgroundColor: attendanceStats.rate > 50 ? colors.submitted : colors.overdue }]} />
                  </View>
                  <Text style={styles.barLabel}>Katılım Oranı: %{attendanceStats.rate}</Text>
                </View>
              ) : (
                <Text style={styles.emptyText}>Devamsızlık verisi yok</Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sınavlar</Text>
            {classroomExams && classroomExams.length > 0 ? (
              classroomExams.map(exam => {
                const examGradesData = allGrades?.filter(g => g.exam === exam.id) || [];
                const formattedGrades = examGradesData.map(g => ({ ...g, student_id: g.student }));
                const stats = calculateExamStats(formattedGrades, studentId);
                const myGrade = examGradesData.find(g => g.student === studentId)?.grade;

                return (
                  <View key={exam.id} style={styles.card}>
                    <Text style={styles.assignmentTitle}>{exam.title}</Text>
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
            ) : (
              <Text style={styles.emptyText}>Bu sınıfta sınav bulunmuyor.</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ödevler</Text>
            {studentGrades.length === 0 ? (
              <Text style={styles.emptyText}>Henüz ödev/not bulunmuyor.</Text>
            ) : (
              studentGrades.map(grade => (
                <View key={grade.id} style={styles.card}>
                  <Text style={styles.assignmentTitle}>{grade.assignment_details.title}</Text>
                  {grade.grade !== null ? (
                    <View style={styles.gradeBox}>
                      <Text style={styles.gradeText}>Not: {grade.grade}</Text>
                    </View>
                  ) : (
                    <Text style={styles.noGradeText}>Henüz notlandırılmadı</Text>
                  )}
                </View>
              ))
            )}
          </View>
          
        </ScrollView>
      )}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg1, overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: 9999 },
  orb1: { top: '-10%', left: '-10%', width: 500, height: 500, backgroundColor: 'rgba(79,70,229,0.2)', ...( { filter: 'blur(120px)' } as any ) },
  orb2: { bottom: '-10%', right: '-10%', width: 600, height: 600, backgroundColor: 'rgba(147,51,234,0.2)', ...( { filter: 'blur(150px)' } as any ) },
  
  topbar: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.glassBg, zIndex: 10, backgroundColor: colors.bg2 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  title: { color: colors.ink, fontSize: 20, fontWeight: 'bold', flex: 8 },
  
  content: { padding: 20, paddingBottom: 120 },
  section: { marginBottom: 24 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  card: { backgroundColor: colors.glassBg, borderColor: colors.glassBorder, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  
  statLabel: { color: colors.submitted, fontSize: 12, marginBottom: 4 },
  statValue: { color: colors.ink, fontSize: 18, fontWeight: 'bold' },
  statValueGreen: { color: colors.submitted, fontSize: 18, fontWeight: 'bold' },
  statValueRed: { color: colors.overdue, fontSize: 18, fontWeight: 'bold' },
  
  barContainer: { height: 12, backgroundColor: colors.glassBorder, borderRadius: 6, overflow: 'hidden', marginTop: 12 },
  barFill: { height: '100%', borderRadius: 6 },
  barLabel: { color: colors.submitted, fontSize: 12, textAlign: 'center', marginTop: 8 },
  
  chartContainer: { flexDirection: 'row', justifyContent: 'space-around', height: 120, marginTop: 16, borderTopWidth: 1, borderTopColor: colors.glassBg, paddingTop: 16 },
  chartBarWrapper: { alignItems: 'center', justifyContent: 'flex-end', flex: 1 },
  chartBar: { width: 30, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  chartLabel: { color: colors.submitted, fontSize: 11, marginTop: 6 },

  assignmentTitle: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  gradeBox: { marginTop: 12, padding: 10, backgroundColor: 'rgba(52,211,153,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)' },
  gradeText: { color: colors.submitted, fontWeight: 'bold', fontSize: 14 },
  noGradeText: { color: colors.submitted, fontSize: 13, marginTop: 8, fontStyle: 'italic' },
  emptyText: { color: colors.inkDim, fontSize: 14, fontStyle: 'italic' },
});
