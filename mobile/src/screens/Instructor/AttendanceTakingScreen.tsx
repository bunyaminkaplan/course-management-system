import { colors, fonts, radii, spacing } from '../../theme/tokens';
import React, { useState, useEffect, useMemo } from 'react';
import BackButton from '../../components/BackButton';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch, post, put } from '../../api/client';
import { Session, Attendance, User } from '../../types/api';
import { useMyClassrooms } from '../../hooks/useMyClassrooms';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, CircleUser, Check, X, Search } from 'lucide-react-native';
import GlassInput from '../../components/GlassInput';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { getUserFullName } from '../../utils/userHelpers';

import GradientBackground from '../../components/GradientBackground';

export default function AttendanceTakingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { sessionId } = route.params;
  const queryClient = useQueryClient();
  const { myClassrooms } = useMyClassrooms();

  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<Session['status'] | null>(null);
  const [attendanceState, setAttendanceState] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => get<Session[]>('/api/sessions/'),
  });

  const { data: attendances, isLoading: attendancesLoading } = useQuery({
    queryKey: ['attendances', sessionId],
    queryFn: () => get<Attendance[]>('/api/attendances/'),
  });

  const session = sessions?.find(s => s.id === sessionId);
  const classroom = myClassrooms.find(c => c.id === session?.classroom);
  const students = classroom?.students || [];

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    return students.filter(st => {
      const fullName = getUserFullName(st).toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });
  }, [students, searchQuery]);

  const currentStatus = localStatus || session?.status;
  const isReadOnly = currentStatus === 'COMPLETED' || currentStatus === 'MISSED';
  const isActive = !isReadOnly;

  useEffect(() => {
    if (attendances && students.length > 0) {
      const sessionAtt = attendances.filter(a => a.session === sessionId);
      const newState: Record<number, boolean> = {};
      students.forEach(st => {
        const existing = sessionAtt.find(a => a.student === st.id);
        newState[st.id] = existing ? existing.is_present : true; // Default true if no record
      });
      setAttendanceState(newState);
    }
  }, [attendances, students, sessionId]);

  const handleToggle = React.useCallback((studentId: number, val: boolean) => {
    if (isReadOnly) return;
    setAttendanceState(prev => ({ ...prev, [studentId]: val }));
  }, [isReadOnly]);

  const handleSaveAndFinish = async () => {
    if (!attendances) return;
    setErrorMsg(null);
    setSavingStatus(`Kaydediliyor 0/${students.length}...`);
    
    const sessionAtt = attendances.filter(a => a.session === sessionId);
    
    for (let i = 0; i < students.length; i++) {
      const st = students[i];
      const isPresent = attendanceState[st.id];
      const existing = sessionAtt.find(a => a.student === st.id);
      
      try {
        if (existing) {
          await put(`/api/attendances/${existing.id}/`, { session: sessionId, student: st.id, is_present: isPresent });
        } else {
          await post('/api/attendances/', { session: sessionId, student: st.id, is_present: isPresent });
        }
        setSavingStatus(`Kaydediliyor ${i + 1}/${students.length}...`);
      } catch (e) {
        setErrorMsg(`${getUserFullName(st)} için hata oluştu. Devam edilemiyor.`);
        setSavingStatus(null);
        return; 
      }
    }

    try {
      await patch(`/api/sessions/${sessionId}/`, { status: 'COMPLETED' });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['attendances', sessionId] });
      navigation.goBack();
    } catch (e) {
      setErrorMsg('Oturum durumu Tamamlandı yapılamadı.');
      setSavingStatus(null);
    }
  };

  if (sessionsLoading || attendancesLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.accentSoft} style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <GradientBackground>
      <View style={styles.topbar}>
        <View style={styles.headerRow}>
          <BackButton />
          <Text style={styles.title} numberOfLines={1}>Yoklama: {classroom?.name}</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Profile')}>
            <CircleUser size={28} color={colors.accentSoft} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
        {savingStatus && <Text style={styles.savingText}>{savingStatus}</Text>}
        
        <View style={{ flex: 1 }}>
          {isActive && !savingStatus && (
              <View style={{ marginBottom: 12 }}>
                <GlassInput 
                  placeholder="Öğrenci ara..." 
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                  <TouchableOpacity 
                    onPress={() => {
                      const allSelected = filteredStudents.length > 0 && filteredStudents.every(st => attendanceState[st.id] !== false);
                      const newState = { ...attendanceState };
                      filteredStudents.forEach(st => newState[st.id] = !allSelected);
                      setAttendanceState(newState);
                    }}
                    style={{ 
                      backgroundColor: (filteredStudents.length > 0 && filteredStudents.every(st => attendanceState[st.id] !== false)) ? 'rgba(255,107,107,0.2)' : 'rgba(52,211,153,0.2)', 
                      paddingHorizontal: 12, 
                      paddingVertical: 6, 
                      borderRadius: 8, 
                      borderWidth: 1, 
                      borderColor: (filteredStudents.length > 0 && filteredStudents.every(st => attendanceState[st.id] !== false)) ? 'rgba(255,107,107,0.4)' : 'rgba(52,211,153,0.4)' 
                    }}
                  >
                    <Text style={{ 
                      color: (filteredStudents.length > 0 && filteredStudents.every(st => attendanceState[st.id] !== false)) ? colors.overdue : colors.submitted, 
                      fontSize: 12, 
                      fontWeight: 'bold' 
                    }}>
                      {filteredStudents.length > 0 && filteredStudents.every(st => attendanceState[st.id] !== false) ? 'Görünenleri Bırak' : 'Görünenleri Seç'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <FlatList
              data={filteredStudents}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <MemoizedStudentRow 
                  item={item} 
                  isPresent={attendanceState[item.id] !== false} 
                  onToggle={handleToggle} 
                  disabled={isReadOnly || !!savingStatus} 
                />
              )}
              ListEmptyComponent={<Text style={{ color: colors.inkDim, fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginTop: 40 }}>Bu sınıfta öğrenci bulunmuyor.</Text>}
              ListFooterComponent={() => (
                isActive && !savingStatus ? (
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveAndFinish}>
                    <Text style={styles.saveButtonText}>Kaydet ve Bitir</Text>
                  </TouchableOpacity>
                ) : null
              )}
            />
          </View>
      </View>
    </GradientBackground>
  );
}


const MemoizedStudentRow = React.memo(({ item, isPresent, onToggle, disabled }: { item: User, isPresent: boolean, onToggle: (id: number, val: boolean) => void, disabled: boolean }) => {
  const translateX = useSharedValue(isPresent ? 22 : 2);

  useEffect(() => {
    translateX.value = withSpring(isPresent ? 22 : 2, { damping: 15, stiffness: 150 });
  }, [isPresent]);

  const knobStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }]
    };
  });

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        isPresent ? styles.cardActive : styles.cardInactive
      ]}
      onPress={() => onToggle(item.id, !isPresent)}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.studentName, isPresent ? {color: colors.ink} : {color: colors.overdue}]}>{getUserFullName(item)}</Text>
      
      <View style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: isPresent ? colors.glassBorder : colors.glassBorder,
        justifyContent: 'center',
      }}>
        <Animated.View style={[{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: isPresent ? colors.submitted : colors.overdue,
          position: 'absolute',
        }, knobStyle]} />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg1, overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: 9999 },
  orb1: { top: '-10%', left: '-10%', width: 500, height: 500, backgroundColor: 'rgba(79,70,229,0.2)', ...( { filter: 'blur(120px)' } as any ) },
  orb2: { bottom: '-10%', right: '-10%', width: 600, height: 600, backgroundColor: 'rgba(147,51,234,0.2)', ...( { filter: 'blur(150px)' } as any ) },
  
  topbar: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.glassBg, zIndex: 10, backgroundColor: colors.bg2 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  title: { color: colors.ink, fontSize: 20, fontWeight: 'bold', flex: 8 },
  
  content: { flex: 1, padding: 20, paddingBottom: 0 },
  listContent: { paddingBottom: 120 },
  
  card: { backgroundColor: colors.glassBg, borderColor: colors.glassBg, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardActive: { backgroundColor: 'rgba(52,211,153,0.08)', borderColor: 'rgba(52,211,153,0.2)' },
  cardInactive: { backgroundColor: 'rgba(255,107,107,0.08)', borderColor: 'rgba(255,107,107,0.2)' },
  studentName: { color: colors.ink, fontSize: 16, fontWeight: '500' },
  
  checkbox: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.submitted, borderColor: colors.submitted },
  checkboxInactive: { backgroundColor: 'transparent', borderColor: 'rgba(255,107,107,0.5)' },
  
  saveButton: { backgroundColor: colors.submitted, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: colors.ink, fontSize: 16, fontWeight: 'bold' },
  
  startButton: { backgroundColor: 'rgba(245,166,35,0.8)', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, alignItems: 'center' },
  startButtonText: { color: colors.ink, fontSize: 16, fontWeight: 'bold' },
  
  errorText: { color: colors.overdue, marginBottom: 12, textAlign: 'center', fontWeight: 'bold' },
  savingText: { color: colors.accentSoft, marginBottom: 12, textAlign: 'center', fontWeight: 'bold' },
});
