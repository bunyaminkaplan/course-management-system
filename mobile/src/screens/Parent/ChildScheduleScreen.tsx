import { colors, fonts, radii, spacing } from '../../theme/tokens';
import React, { useMemo } from 'react';
import GradientBackground from '../../components/GradientBackground';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { get } from '../../api/client';
import { Schedule } from '../../types/api';
import { useQuery } from '@tanstack/react-query';
import { useChildSwitcher } from '../../context/ChildSwitcherContext';
import WeeklyScheduleList from '../../components/WeeklyScheduleList';
import { CircleUser } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { getUserFullName } from '../../utils/userHelpers';

export default function ChildScheduleScreen() {
  const { selectedChildId, setSelectedChildId, childrenList } = useChildSwitcher();
  const navigation = useNavigation<any>();

  const { data: allSchedules } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => get<Schedule[]>('/api/schedules/')
  });
  const schedules = allSchedules || [];

  const classroomNameById = useMemo(() => {
    return {};
  }, [selectedChildId, childrenList]);

  return (
    <GradientBackground>
<View style={styles.header}>
        <Text style={styles.headerTitle}>Program</Text>
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <WeeklyScheduleList schedules={schedules} classroomNameById={classroomNameById} />
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
});
