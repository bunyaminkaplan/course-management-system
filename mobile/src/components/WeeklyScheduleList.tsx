import { colors, fonts, radii, spacing } from '../theme/tokens';
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Schedule } from '../types/api';

const TR_DAYS = ['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];

interface Props {
  schedules: Schedule[];
  classroomNameById: Record<number, string>;
  onClassroomPress?: (classroomId: number) => void;
}

export default function WeeklyScheduleList({ schedules, classroomNameById, onClassroomPress }: Props) {
  const todayIndex = (new Date().getDay() + 6) % 7;

  const schedulesByDay = useMemo(() => {
    const grouped: Record<number, Schedule[]> = {};
    for (let i = 0; i < 7; i++) grouped[i] = [];
    
    schedules.forEach(s => {
      if (grouped[s.day_of_week]) {
        grouped[s.day_of_week].push(s);
      }
    });

    for (let i = 0; i < 7; i++) {
      grouped[i].sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    
    return grouped;
  }, [schedules]);

  return (
    <View style={styles.container}>
      {TR_DAYS.map((dayName, index) => {
        const daySchedules = schedulesByDay[index];
        if (daySchedules.length === 0) return null;
        
        const isToday = index === todayIndex;
        
        return (
          <View key={`day-${index}`} style={[styles.dayGroup, isToday && styles.dayGroupToday]}>
            <View style={styles.dayTitleRow}>
              <Text style={[styles.dayTitle, isToday && styles.dayTitleToday]}>{dayName}</Text>
              {isToday && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>BUGÜN</Text>
                </View>
              )}
            </View>
            
            {daySchedules.map(sched => {
              const content = (
                <>
                  <Text style={[styles.schedTime, isToday && {color: colors.submitted}]}>
                    {sched.start_time.substring(0, 5)} - {sched.end_time.substring(0, 5)}
                  </Text>
                  <Text style={styles.schedClass}>
                    {classroomNameById[sched.classroom] || 'Bilinmeyen Sınıf'}
                  </Text>
                </>
              );
              
              if (onClassroomPress) {
                return (
                  <TouchableOpacity 
                    key={`sched-${sched.id}`} 
                    style={styles.scheduleCard}
                    onPress={() => onClassroomPress(sched.classroom)}
                  >
                    {content}
                  </TouchableOpacity>
                );
              }

              return (
                <View key={`sched-${sched.id}`} style={styles.scheduleCard}>
                  {content}
                </View>
              );
            })}
          </View>
        );
      })}
      
      {schedules.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Henüz bir programa kayıtlı değilsiniz.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dayGroup: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.glassBg,
  },
  dayGroupToday: {
    backgroundColor: 'rgba(56,189,248,0.05)',
    borderColor: 'rgba(56,189,248,0.2)',
  },
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  dayTitleToday: {
    color: colors.submitted,
  },
  todayBadge: {
    backgroundColor: 'rgba(56,189,248,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayBadgeText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: 'bold',
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassBg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  schedTime: {
    color: colors.submitted,
    fontSize: 13,
    fontWeight: '600',
    width: 110,
  },
  schedClass: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.inkDim,
    fontSize: 14,
  }
});
