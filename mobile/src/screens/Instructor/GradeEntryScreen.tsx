import { colors, fonts, radii, spacing } from '../../theme/tokens';
import React, { useState, useEffect, useRef, memo } from 'react';
import BackButton from '../../components/BackButton';
import GlassSurface from '../../components/GlassSurface';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { useMyClassrooms } from '../../hooks/useMyClassrooms';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, patch } from '../../api/client';
import { Exam, Grade } from '../../types/api';
import { calculateExamStats } from '../../utils/calculateExamStats';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import GradientBackground from '../../components/GradientBackground';
import { getUserFullName } from '../../utils/userHelpers';

export default function GradeEntryScreen() {
  const { myClassrooms } = useMyClassrooms();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const { examId, classroomId } = route.params;

  const classroom = myClassrooms.find(c => c.id === classroomId);
  
  const { data: exams } = useQuery({
    queryKey: ['exams'],
    queryFn: () => get<Exam[]>('/api/exams/')
  });
  const classroomExams = exams?.filter(e => e.classroom === classroomId);
  const exam = classroomExams?.find(e => e.id === examId);

  const { data: grades } = useQuery({
    queryKey: ['grades'],
    queryFn: () => get<Grade[]>('/api/grades/')
  });
  const examGrades = grades?.filter(g => g.exam === examId) || [];

  const { average } = calculateExamStats(examGrades, -1); // we just need average here

  const gradesRef = useRef<Record<number, string>>({});

  useEffect(() => {
    if (examGrades) {
      examGrades.forEach(g => {
        if (g.grade !== null && g.grade !== undefined) {
          gradesRef.current[g.student] = String(g.grade);
        }
      });
    }
  }, [grades, examId]);

  const handleSaveAll = async () => {
    const promises = Object.entries(gradesRef.current).map(([studentIdStr, gradeValue]) => {
      const gradeStr = String(gradeValue);
      const num = Number(gradeStr);
      if (!isNaN(num) && gradeStr.trim() !== '') {
        const existingGrade = examGrades.find(g => g.student === Number(studentIdStr));
        if (existingGrade) {
          return patch(`/api/grades/${existingGrade.id}/`, { grade: num });
        }
      }
      return Promise.resolve();
    });
    
    await Promise.all(promises);
    queryClient.invalidateQueries({ queryKey: ['grades'] });
    navigation.goBack();
  };

  return (
    <GradientBackground>
      <View style={styles.topbar}>
        <View style={styles.headerRow}>
          <BackButton />
          <Text style={styles.title} numberOfLines={1}>{exam?.title || 'Sınav Notları'}</Text>
        </View>
        <Text style={styles.subtitle}>
          {exam ? format(new Date(exam.date), "d MMMM yyyy", { locale: tr }) : ''}
        </Text>
        <GlassSurface elevation="high" padding={12} style={styles.statsContainer}>
          <Text style={styles.statsText}>Sınıf Ortalaması: {average !== null ? average : '-'}</Text>
        </GlassSurface>
      </View>

      <FlatList
        data={classroom?.students || []}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <MemoizedStudentGradeRow 
            student={item} 
            initialValue={gradesRef.current[item.id] || ''} 
            onChange={(val) => { gradesRef.current[item.id] = val; }}
          />
        )}
      />
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.saveAllBtn} onPress={handleSaveAll}>
          <Text style={styles.saveAllBtnText}>Notları Kaydet</Text>
        </TouchableOpacity>
      </View>
    </GradientBackground>
  );
}

const MemoizedStudentGradeRow = memo(function StudentGradeRow({ student, initialValue, onChange }: { student: any, initialValue: string, onChange: (val: string) => void }) {
  const [value, setValue] = useState(initialValue);

  const handleChange = (val: string) => {
    setValue(val);
    onChange(val);
  };

  return (
    <View style={styles.card}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{getUserFullName(student)}</Text>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { outlineStyle: 'none' } as any]}
          value={value}
          onChangeText={handleChange}
          keyboardType="numeric"
          placeholder="Not"
          placeholderTextColor="rgba(245,243,250,0.65)"
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg1, overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: 9999 },
  orb1: { top: '-10%', left: '-10%', width: 500, height: 500, backgroundColor: 'rgba(79,70,229,0.2)', ...( { filter: 'blur(120px)' } as any ) },
  orb2: { bottom: '-10%', right: '-10%', width: 600, height: 600, backgroundColor: 'rgba(147,51,234,0.2)', ...( { filter: 'blur(150px)' } as any ) },
  
  topbar: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.glassBg, zIndex: 10, backgroundColor: colors.bg2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  title: { color: colors.ink, fontSize: 20, fontWeight: 'bold', flex: 8 },
  subtitle: { color: colors.accent, fontSize: 14, marginLeft: 40 },
  statsContainer: { marginTop: 12, alignItems: 'center' },
  statsText: { color: colors.ink, fontSize: 16, fontWeight: 'bold', textShadowColor: 'rgba(245,166,35,0.35)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 } },
  
  listContent: { padding: 20, paddingBottom: 200 },
  card: { backgroundColor: colors.glassBg, borderColor: colors.glassBg, borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  studentInfo: { flex: 1 },
  studentName: { color: colors.ink, fontSize: 16, fontWeight: '500' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: colors.ink, width: 60, textAlign: 'center' },
  
  bottomBar: { position: 'absolute', bottom: 60, left: 0, right: 0, padding: 20, backgroundColor: 'transparent' },
  saveAllBtn: { backgroundColor: colors.glassBg, borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)', paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: colors.submitted, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  saveAllBtnText: { color: colors.submitted, fontWeight: 'bold', fontSize: 16 }
});
