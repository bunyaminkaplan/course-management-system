import { colors, fonts, radii, spacing } from '../../theme/tokens';
import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import GradientBackground from '../../components/GradientBackground';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useMyClassrooms } from '../../hooks/useMyClassrooms';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Plus, ChevronRight, CircleUser } from 'lucide-react-native';
import { Exam, Grade } from '../../types/api';
import { get } from '../../api/client';

export default function InstructorExamsListScreen() {
  const { myClassrooms, isLoading: classroomsLoading } = useMyClassrooms();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'PENDING' | 'GRADED'>('PENDING');

  const { data: allExams, isLoading: examsLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: () => get<Exam[]>('/api/exams/')
  });
  
  const { data: allGrades, isLoading: gradesLoading } = useQuery({
    queryKey: ['grades'],
    queryFn: () => get<Grade[]>('/api/grades/')
  });

  const exams = useMemo(() => {
    if (!allExams) return [];
    return allExams.filter(e => myClassrooms.some(c => c.id === e.classroom));
  }, [allExams, myClassrooms]);

  const isExamGraded = (examId: number) => {
    const grades = allGrades?.filter(g => g.exam === examId) || [];
    return grades.length > 0 && grades.every(g => g.grade !== null);
  };

  const isLoading = classroomsLoading || examsLoading || gradesLoading;

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accentSoft} />
      </View>
    );
  }

  const pendingExams = exams.filter(e => !isExamGraded(e.id));
  const gradedExams = exams.filter(e => isExamGraded(e.id));
  const displayExams = activeTab === 'PENDING' ? pendingExams : gradedExams;

  return (
    <GradientBackground>
<View style={styles.topbar}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>Sınavlar</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => navigation.navigate('CreateExam')} style={[styles.addButton, { marginRight: 16 }]}>
            <Plus size={20} color={colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Profile')}>
            <CircleUser size={28} color={colors.accentSoft} />
          </TouchableOpacity>
        </View>
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'PENDING' && styles.tabActive]}
            onPress={() => setActiveTab('PENDING')}
          >
            <Text style={[styles.tabText, activeTab === 'PENDING' && styles.tabTextActive]}>Not Girilmeyenler ({pendingExams.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'GRADED' && styles.tabActive]}
            onPress={() => setActiveTab('GRADED')}
          >
            <Text style={[styles.tabText, activeTab === 'GRADED' && styles.tabTextActive]}>Not Girilenler ({gradedExams.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {displayExams.length === 0 ? (
          <Text style={{ color: colors.submitted, textAlign: 'center', marginTop: 40 }}>Henüz sınav bulunmuyor.</Text>
        ) : (
          displayExams.map(exam => {
            const classroom = myClassrooms.find(c => c.id === exam.classroom);
            return (
              <TouchableOpacity
                key={exam.id}
                style={styles.card}
                onPress={() => navigation.navigate('GradeEntry', { examId: exam.id, classroomId: exam.classroom })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.examTitle}>{exam.title}</Text>
                  <Text style={styles.examSub}>{classroom?.name} • {exam.date}</Text>
                </View>
                <ChevronRight size={20} color={colors.submitted} />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
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
  title: { color: colors.ink, fontSize: 24, fontWeight: 'bold', flex: 8 },
  addButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(79,70,229,0.8)', justifyContent: 'center', alignItems: 'center' },
  tabsContainer: { flexDirection: 'row', marginTop: 16, backgroundColor: colors.glassBg, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: colors.glassBorder },
  tabText: { color: colors.submitted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: colors.ink },

  content: { padding: 20, paddingBottom: 120 },
  card: { backgroundColor: colors.glassBg, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.glassBorder, flexDirection: 'row', alignItems: 'center' },
  examTitle: { color: colors.ink, fontSize: 16, fontWeight: '600', marginBottom: 4 },
  examSub: { color: colors.submitted, fontSize: 13 },
});
