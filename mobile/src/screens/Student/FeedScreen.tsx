import { colors, fonts, radii, spacing } from '../../theme/tokens';
import React, { useState, useMemo } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { get } from '../../api/client';
import GradientBackground from '../../components/GradientBackground';
import GlassTopBar from '../../components/GlassTopBar';
import { FeedItem, Session, Schedule, ClassRoom } from '../../types/api';
import SkeletonCard from '../../components/SkeletonCard';
import FeedCard from '../../components/FeedCard';
import { CircleUser } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getUserFullName } from '../../utils/userHelpers';

export default function FeedScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  
  const [hiddenAnnouncements, setHiddenAnnouncements] = useState<number[]>([]);

  const { data: feedData, isLoading: feedLoading, isError: feedError, refetch: refetchFeed, isRefetching: feedRefetching } = useQuery({
    queryKey: ['feed'],
    queryFn: () => get<FeedItem[]>('/api/feed/')
  });

  const { data: sessions, isLoading: sessionsLoading, isError: sessionsError, refetch: refetchSessions, isRefetching: sessionsRefetching } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => get<Session[]>('/api/sessions/')
  });

  const { data: schedules, isLoading: schedulesLoading, isError: schedulesError, refetch: refetchSchedules, isRefetching: schedulesRefetching } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => get<Schedule[]>('/api/schedules/')
  });

  const { data: classrooms, isLoading: classroomsLoading, isError: classroomsError, refetch: refetchClassrooms, isRefetching: classroomsRefetching } = useQuery({
    queryKey: ['classrooms'],
    queryFn: () => get<ClassRoom[]>('/api/classrooms/')
  });

  const isLoading = feedLoading || sessionsLoading || schedulesLoading || classroomsLoading;
  const isError = feedError || sessionsError || schedulesError || classroomsError;
  const isRefetching = feedRefetching || sessionsRefetching || schedulesRefetching || classroomsRefetching;

  const refetch = () => {
    refetchFeed();
    refetchSessions();
    refetchSchedules();
    refetchClassrooms();
  };

  const { announcements, closestItem, restItems } = useMemo(() => {
    const combinedData: FeedItem[] = [...(feedData || [])];

    if (sessions && schedules && classrooms) {
      sessions.forEach(session => {
        const schedule = schedules.find(s => s.id === session.schedule);
        const classroom = classrooms.find(c => c.id === session.classroom);
        
        if (schedule && classroom) {
          const startTimeIso = `${session.date}T${schedule.start_time}+03:00`;
          const endTimeIso = `${session.date}T${schedule.end_time}+03:00`;

          combinedData.push({
            id: -session.id,
            type: 'SESSION',
            title: 'Canlı Ders',
            content: 'Ders Saati',
            classroom_id: classroom.id,
            classroom_name: classroom.name,
            created_at: startTimeIso,
            deadline: endTimeIso,
            status: session.status
          });
        }
      });
    }

    const nowTime = Date.now();

    // Filtreleme
    const filteredData = combinedData.filter(item => {
      // Veli toplantılarını öğrenciden gizle
      if (user?.role === 'STUDENT' && item.title.toLowerCase().includes('veli')) {
        return false;
      }
      // Gizlenmiş duyuruları filtrele
      if (item.type === 'ANNOUNCEMENT' && hiddenAnnouncements.includes(item.id)) {
        return false;
      }
      
      // Bitenleri filtrele (Tamamlanmış veya süresi geçmiş)
      if (item.status === 'SUBMITTED' || item.status === 'COMPLETED') return false;
      if (item.type === 'SESSION' && item.status === 'COMPLETED') return false;
      if (item.deadline && new Date(item.deadline).getTime() < nowTime) return false;
      
      return true;
    });

    // Duyuruları ayır
    const currentAnnouncements = filteredData.filter(item => item.type === 'ANNOUNCEMENT');
    
    // Geri kalan etkinlikler
    const events = filteredData.filter(item => item.type !== 'ANNOUNCEMENT');
    
    // Etkinlikleri sırala (Yaklaşanlar önce)
    events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const closest = events.length > 0 ? events[0] : null;
    const remaining = events.slice(closest ? 1 : 0);

    return {
      announcements: currentAnnouncements,
      closestItem: closest,
      restItems: remaining
    };
  }, [feedData, sessions, schedules, classrooms, user, hiddenAnnouncements]);

  const handleDismiss = (id: number) => {
    setHiddenAnnouncements(prev => [...prev, id]);
  };

  return (
    <GradientBackground>
      <GlassTopBar 
        title={`Merhaba, ${getUserFullName(user)}`}
        rightElement={
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Profile') || navigation.navigate('Profile')}>
            <CircleUser size={24} color={colors.accentSoft} />
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.submitted} />
        </View>
      ) : isError ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Bir şeyler ters gitti</Text>
        </View>
      ) : (announcements.length === 0 && !restItems.length && !closestItem) ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>Henüz içerik yok</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          data={restItems}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View style={{ marginBottom: 8 }}>
              {announcements.map(announcement => (
                <FeedCard key={`announcement-${announcement.id}`} item={announcement} onDismiss={handleDismiss} />
              ))}
              
              {closestItem && (
                <View style={{ marginTop: announcements.length > 0 ? 8 : 0 }}>
                  <FeedCard item={closestItem} highlighted />
                </View>
              )}
            </View>
          )}
          renderItem={({ item, index }) => (<Animated.View entering={FadeInDown.duration(280).delay(Math.min(index,20)*30)}><FeedCard item={item} compact /></Animated.View>)}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.submitted} />
          }
        />
      )}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg1,
    overflow: 'hidden',
  },
  orb: { position: 'absolute', borderRadius: 9999 },
  orb1: { top: '-10%', left: '-10%', width: 500, height: 500, backgroundColor: 'rgba(79,70,229,0.15)', ...( { filter: 'blur(120px)' } as any ) },
  orb2: { bottom: '-10%', right: '-10%', width: 600, height: 600, backgroundColor: 'rgba(147,51,234,0.15)', ...( { filter: 'blur(150px)' } as any ) },
  orb3: { top: '30%', left: '40%', width: 300, height: 300, backgroundColor: 'rgba(56,189,248,0.1)', ...( { filter: 'blur(100px)' } as any ) },
  glassTopBar: {
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
  greetingText: {
    color: colors.submitted,
    fontSize: 15,
  },
  nameText: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: 'bold',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.overdue,
    marginBottom: 16,
  },
  emptyText: {
    color: colors.submitted,
  },
});
