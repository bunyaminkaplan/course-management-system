import { colors, fonts, radii, spacing } from '../../theme/tokens';
import React, { useMemo } from 'react';
import GradientBackground from '../../components/GradientBackground';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { get } from '../../api/client';
import { Session, Schedule, Announcement } from '../../types/api';
import { useAuth } from '../../context/AuthContext';
import { useMyClassrooms } from '../../hooks/useMyClassrooms';
import { getSessionStatusLabel } from '../../utils/sessionStatusLabel';
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CircleUser } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function InstructorHomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { myClassrooms } = useMyClassrooms();

  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => get<Session[]>('/api/sessions/'),
  });

  const { data: schedules } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => get<Schedule[]>('/api/schedules/'),
  });

  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => get<Announcement[]>('/api/announcements/'),
  });

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const todaysSessions = useMemo(() => {
    if (!sessions || !myClassrooms) return [];
    return sessions.filter(s => 
      s.date === todayStr && 
      myClassrooms.some(c => c.id === s.classroom)
    );
  }, [sessions, myClassrooms, todayStr]);

  const recentAnnouncements = useMemo(() => {
    if (!announcements || !myClassrooms) return [];
    const filtered = announcements.filter(a => myClassrooms.some(c => c.id === a.classroom));
    // Sort descending by created_at
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return filtered.slice(0, 3);
  }, [announcements, myClassrooms]);

  return (
    <GradientBackground>
      <View style={styles.topbar}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Öğretmen Paneli</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Profile')}>
            <CircleUser size={28} color={colors.accentSoft} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Bugünkü Derslerim</Text>
        {todaysSessions.length === 0 ? (
          <Text style={styles.emptyText}>Bugün planlanmış dersiniz bulunmuyor.</Text>
        ) : (
          todaysSessions.map(session => {
            const cls = myClassrooms.find(c => c.id === session.classroom);
            const statusLabel = getSessionStatusLabel(session.status);
            return (
              <TouchableOpacity 
                key={session.id} 
                style={styles.card}
                onPress={() => navigation.navigate('AttendanceTaking', { sessionId: session.id, classroomId: session.classroom })}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{cls?.name}</Text>
                  <View style={[styles.badge, session.status === 'COMPLETED' ? styles.badgeActive : styles.badgePending]}>
                    <Text style={[styles.badgeText, session.status === 'COMPLETED' ? styles.badgeTextActive : styles.badgeTextPending]}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>
                <Text style={styles.timeText}>{session.start_time} - {session.end_time}</Text>
                {session.topic && <Text style={[styles.contentText, {marginTop: 4}]}>{session.topic}</Text>}
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 24 }} />

        <Text style={styles.sectionTitle}>Son Duyurular</Text>
        {recentAnnouncements.length === 0 ? (
          <Text style={styles.emptyText}>Henüz duyuru bulunmuyor.</Text>
        ) : (
          recentAnnouncements.map(ann => {
            const cls = myClassrooms.find(c => c.id === ann.classroom);
            return (
              <View key={ann.id} style={styles.card}>
                <View style={styles.announcementHeader}>
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>{cls?.name}</Text>
                  </View>
                  <Text style={styles.dateText}>
                    {formatDistanceToNowStrict(new Date(ann.created_at), { addSuffix: true, locale: tr })}
                  </Text>
                </View>
                <Text style={styles.cardTitle}>{ann.title}</Text>
                <Text style={styles.contentText}>{ann.content}</Text>
              </View>
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
  orb3: { top: '30%', left: '40%', width: 300, height: 300, backgroundColor: 'rgba(6,182,212,0.1)', ...( { filter: 'blur(100px)' } as any ) },
  
  topbar: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.glassBg, zIndex: 10, backgroundColor: colors.bg2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.ink, fontSize: 22, fontWeight: 'bold' },
  
  content: { padding: 20, zIndex: 10, paddingBottom: 120 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  emptyText: { color: colors.inkDim, fontSize: 14, fontStyle: 'italic', marginBottom: 16 },
  
  card: { backgroundColor: colors.glassBg, borderColor: colors.glassBg, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  timeText: { color: colors.submitted, fontSize: 14 },
  
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  badgeActive: { backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder },
  badgePending: { backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  badgeTextActive: { color: colors.submitted },
  badgeTextPending: { color: colors.accent },
  
  announcementHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pill: { backgroundColor: colors.glassBg, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { color: colors.ink, fontSize: 11, fontWeight: '600' },
  dateText: { color: colors.inkDim, fontSize: 11 },
  contentText: { color: colors.ink, fontSize: 13, marginTop: 8, lineHeight: 20 },
});
