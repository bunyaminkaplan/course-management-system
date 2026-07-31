import { colors, fonts, radii, spacing } from '../../theme/tokens';
import React from 'react';
import GradientBackground from '../../components/GradientBackground';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useChildSwitcher } from '../../context/ChildSwitcherContext';
import { get } from '../../api/client';
import { Attendance, StudentAssignment, Exam, Grade } from '../../types/api';
import { calculateAttendanceRate } from '../../utils/calculateAttendanceRate';
import { getStatusVariant } from '../../utils/statusVariant';
import { CircleUser, CircleCheck } from 'lucide-react-native';
import GlassSurface from '../../components/GlassSurface';
import { useNavigation } from '@react-navigation/native';
import { calculateExamStats } from '../../utils/calculateExamStats';
import { getUserFullName } from '../../utils/userHelpers';

export default function ChildProgressScreen() {
  const { selectedChildId, setSelectedChildId, childrenList } = useChildSwitcher();
  const navigation = useNavigation<any>();

  const { data: allAttendances } = useQuery({
    queryKey: ['attendances'],
    queryFn: () => get<Attendance[]>('/api/attendances/')
  });
  const attendances = allAttendances?.filter(a => a.student === selectedChildId);

  const { data: allAssignments } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: () => get<StudentAssignment[]>('/api/student-assignments/')
  });
  const assignments = allAssignments?.filter(a => a.student === selectedChildId);

  const { data: allExams } = useQuery({
    queryKey: ['exams'],
    queryFn: () => get<Exam[]>('/api/exams/')
  });

  const { data: allGrades } = useQuery({
    queryKey: ['grades'],
    queryFn: () => get<Grade[]>('/api/grades/')
  });

  const attendanceRate = attendances ? calculateAttendanceRate(attendances) : 0;
  const missedCount = attendances ? attendances.filter(a => !a.is_present).length : 0;
  const totalCount = attendances ? attendances.length : 0;

  const exams = allExams?.filter(e => allGrades?.some(g => g.exam === e.id && g.student === selectedChildId)) || [];

  return (
    <GradientBackground>
<View style={styles.header}>
        <Text style={styles.headerTitle}>Gelişim</Text>
        <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Profile')}>
            <CircleUser size={28} color={colors.accent} />
        </TouchableOpacity>
      </View>

            {childrenList.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ color: colors.inkDim, fontSize: 16, textAlign: 'center', lineHeight: 24 }}>
            Hesabınıza tanımlı bir öğrenci bulunamadı.
            Lütfen dershane yönetimiyle iletişime geçin.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.chipScroll}>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {childrenList.map(child => {
            const isSelected = child.id === selectedChildId;
            return (
              <TouchableOpacity
                key={child.id}
                onPress={() => setSelectedChildId(child.id)}
                style={[styles.chip, isSelected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {getUserFullName(child.student_detail)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <GlassSurface elevation="high" padding={32} style={styles.statHeroCard}>
          <Text style={styles.statPercentage}>%{attendanceRate}</Text>
          <Text style={styles.statSubtitle}>{missedCount} gün devamsız / {totalCount} gün</Text>
        </GlassSurface>

        <Text style={styles.sectionTitle}>Notlar</Text>
        
        {assignments && assignments.length > 0 ? (
          assignments.map(grade => (
            <View key={`grade-${grade.id}`} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.assignmentTitle}>{grade.assignment_details.title}</Text>
              </View>
              {grade.grade !== null ? (
                <View style={styles.gradeBox}>
                  <Text style={styles.gradeText}>Not: {grade.grade}</Text>
                </View>
              ) : (
                <View style={[styles.badge, { 
                  backgroundColor: grade.status === 'PENDING' || grade.status === 'OVERDUE' || grade.status === 'REJECTED' ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)', 
                  borderColor: grade.status === 'PENDING' || grade.status === 'OVERDUE' || grade.status === 'REJECTED' ? 'rgba(239,68,68,0.2)' : 'rgba(52,211,153,0.2)' 
                }]}>
                  <Text style={[styles.badgeText, { 
                    color: grade.status === 'PENDING' || grade.status === 'OVERDUE' || grade.status === 'REJECTED' ? colors.coral : colors.submitted 
                  }]}>
                    {grade.status === 'PENDING' ? 'Teslim Edilmedi' : grade.status === 'SUBMITTED' ? 'Teslim Edildi (Not Bekleniyor)' : grade.status === 'APPROVED' ? 'Onaylandı' : grade.status === 'REJECTED' ? 'Reddedildi' : grade.status === 'OVERDUE' ? 'Gecikti' : grade.status}
                  </Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Henüz notlandırılmış ödev yok</Text>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Sınavlar</Text>
        {(!exams || exams.length === 0) ? (
          <Text style={styles.emptyText}>Henüz notlandırılmış sınav yok</Text>
        ) : (
          exams.map(exam => {
            const grades = allGrades?.filter(g => g.exam === exam.id) || [];
            const formattedGrades = grades.map(g => ({ ...g, student_id: g.student }));
            const stats = calculateExamStats(formattedGrades, selectedChildId);
            const myGradeObj = formattedGrades.find(g => g.student_id === selectedChildId);
            const myGrade = myGradeObj?.grade;

            return (
              <View key={`exam-${exam.id}`} style={styles.rowCard}>
                <View style={styles.cardIcon}>
                  <CircleCheck size={20} color={colors.submitted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.assignmentTitle}>{exam.title}</Text>
                  <Text style={styles.cardSubtitle}>Sınıf Ortalaması: {stats.average !== null ? stats.average : '-'}</Text>
                </View>
                <View style={styles.gradeContainer}>
                  <Text style={styles.gradeValue}>{myGrade !== null && myGrade !== undefined ? myGrade : '?'}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
            </>
      )}
</GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg1 },
  orb: { position: 'absolute', borderRadius: 9999 },
  orb1: { top: '-10%', left: '-10%', width: 500, height: 500, backgroundColor: 'rgba(79,70,229,0.15)', ...( { filter: 'blur(120px)' } as any ) },
  orb2: { bottom: '-10%', right: '-10%', width: 600, height: 600, backgroundColor: 'rgba(56,189,248,0.1)', ...( { filter: 'blur(150px)' } as any ) },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.glassBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: { color: colors.ink, fontSize: 24, fontWeight: 'bold' },
  chipScroll: {
    marginVertical: 16,
    height: 40,
  },
  chip: {
    backgroundColor: colors.glassBg,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 20,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: colors.glassBorder,
  },
  chipText: {
    color: colors.submitted,
    fontSize: 14,
    fontWeight: '600'
  },
  chipTextSelected: {
    color: colors.ink,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  statHeroCard: {
    marginBottom: 32,
    alignItems: 'center',
  },
  statPercentage: {
    color: colors.submitted,
    fontSize: 48,
    fontWeight: 'bold',
    textShadowColor: 'rgba(245,166,35,0.35)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  statSubtitle: {
    color: colors.ink,
    fontSize: 14,
    marginTop: 8,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: { 
    backgroundColor: colors.glassBg, 
    borderColor: colors.glassBg, 
    borderWidth: 1, 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12 
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  assignmentTitle: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  gradeBox: { marginTop: 4, padding: 8, backgroundColor: 'rgba(52,211,153,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)', alignSelf: 'flex-start' },
  gradeText: { color: colors.submitted, fontWeight: 'bold', fontSize: 13 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyText: {
    color: colors.inkDim,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  rowCard: { backgroundColor: colors.glassBg, borderColor: colors.glassBg, borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  cardIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.glassBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardSubtitle: { color: colors.submitted, fontSize: 13, marginTop: 4 },
  gradeContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(56,189,248,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(56,189,248,0.3)' },
  gradeValue: { color: colors.submitted, fontSize: 18, fontWeight: 'bold' },
});
