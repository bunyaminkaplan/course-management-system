import { colors, fonts, radii, spacing } from '../../theme/tokens';
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { get } from '../../api/client';
import { Schedule, ClassRoom, Session } from '../../types/api';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Clock, Calendar as CalendarIcon, Video, CircleUser } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import WeeklyScheduleList from '../../components/WeeklyScheduleList';
import GlassTopBar from '../../components/GlassTopBar';
import GradientBackground from '../../components/GradientBackground';

export default function ScheduleScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const { data: classrooms, isLoading: classroomsLoading } = useQuery({
    queryKey: ['classrooms'],
    queryFn: () => get<ClassRoom[]>('/api/classrooms/')
  });

  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => get<Schedule[]>('/api/schedules/')
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => get<Session[]>('/api/sessions/')
  });

  const isLoading = classroomsLoading || schedulesLoading || sessionsLoading;

  const myClassroomIds = useMemo(() => {
    if (!classrooms || !user) return [];
    return classrooms
      .filter(c => c.students.some(s => s.id === user.id))
      .map(c => c.id);
  }, [classrooms, user]);

  const mySchedules = useMemo(() => {
    if (!schedules || myClassroomIds.length === 0) return [];
    return schedules.filter(s => myClassroomIds.includes(s.classroom));
  }, [schedules, myClassroomIds]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const todaysSessions = useMemo(() => {
    if (!sessions || myClassroomIds.length === 0) return [];
    return sessions.filter(s => s.date === todayStr && myClassroomIds.includes(s.classroom));
  }, [sessions, myClassroomIds, todayStr]);

  const classroomNameById = useMemo(() => {
    const map: Record<number, string> = {};
    if (classrooms) {
      classrooms.forEach(c => {
        map[c.id] = c.name;
      });
    }
    return map;
  }, [classrooms]);
  
  const getClassroomName = (id: number) => {
    return classroomNameById[id] || 'Bilinmeyen Sınıf';
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.submitted} />
      </View>
    );
  }

  const todayIndex = (new Date().getDay() + 6) % 7;

  return (
    <GradientBackground>
      <GlassTopBar 
        title="Programım" 
        rightElement={
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Profile') || navigation.navigate('Profile')}>
            <CircleUser size={24} color={colors.accentSoft} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {todaysSessions.length > 0 && (
          <View style={styles.todaySection}>
            <View style={styles.sectionHeaderRow}>
               <CalendarIcon size={18} color={colors.submitted} />
               <Text style={styles.sectionTitle}>Bugünkü Dersler</Text>
            </View>
            {todaysSessions.map(session => {
              const sched = schedules?.find(s => s.id === session.schedule);
              return (
                <View key={`session-${session.id}`} style={styles.todayCard}>
                  <View style={styles.todayCardContent}>
                    <View style={styles.todayIconContainer}>
                        <Video size={20} color={colors.accent} />
                    </View>
                    <View style={styles.todayTextContainer}>
                        <Text style={styles.todayClassName}>{getClassroomName(session.classroom)}</Text>
                        {sched && (
                          <View style={styles.timeRow}>
                            <Clock size={12} color={colors.submitted} />
                            <Text style={styles.todayTimeText}>{sched.start_time.substring(0, 5)} - {sched.end_time.substring(0, 5)}</Text>
                          </View>
                        )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={[styles.sectionHeaderRow, { marginTop: 16 }]}>
           <CalendarIcon size={18} color={colors.submitted} />
           <Text style={[styles.sectionTitle, { color: colors.submitted }]}>Haftalık Program</Text>
        </View>
        
        <WeeklyScheduleList 
          schedules={mySchedules} 
          classroomNameById={classroomNameById} 
        />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg1,
  },
  orb: { position: 'absolute', borderRadius: 9999 },
  orb1: { top: '-10%', left: '-10%', width: 500, height: 500, backgroundColor: 'rgba(79,70,229,0.15)', ...( { filter: 'blur(120px)' } as any ) },
  orb2: { bottom: '-10%', right: '-10%', width: 600, height: 600, backgroundColor: 'rgba(56,189,248,0.1)', ...( { filter: 'blur(150px)' } as any ) },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.glassBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBg,
  },
  headerTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  todaySection: {
    marginBottom: 8,
  },
  todayCard: {
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  todayCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(192,132,252,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  todayTextContainer: {
    flex: 1,
  },
  todayClassName: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  todayTimeText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '500',
  },
});
