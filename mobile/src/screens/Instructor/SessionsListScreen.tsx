import { colors, fonts, radii, spacing } from '../../theme/tokens';
import React, { useState, useMemo } from 'react';
import GradientBackground from '../../components/GradientBackground';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, Alert, ScrollView } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch } from '../../api/client';
import { Session, Schedule } from '../../types/api';
import { useMyClassrooms } from '../../hooks/useMyClassrooms';
import { getSessionStatusLabel } from '../../utils/sessionStatusLabel';
import { useNavigation } from '@react-navigation/native';
import { CircleUser, ChevronRight } from 'lucide-react-native';

export default function SessionsListScreen() {
  const { myClassrooms } = useMyClassrooms();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  const [startModalVisible, setStartModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => get<Session[]>('/api/sessions/'),
  });

  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => get<Schedule[]>('/api/schedules/'),
  });

  const isLoading = sessionsLoading || schedulesLoading;

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const todaysSessions = useMemo(() => {
    if (!sessions || !myClassrooms) return [];
    const allToday = sessions.filter(s => 
      s.date === todayStr && 
      myClassrooms.some(c => c.id === s.classroom)
    );
    if (activeTab === 'COMPLETED') {
      return allToday.filter(s => s.status === 'COMPLETED');
    }
    return allToday.filter(s => s.status !== 'COMPLETED');
  }, [sessions, myClassrooms, todayStr, activeTab]);

  const handleSessionPress = (session: Session) => {
    if (session.status === 'SCHEDULED' || session.status === 'READY') {
      setSelectedSession(session);
      setStartModalVisible(true);
    } else {
      navigation.navigate('AttendanceTaking', { sessionId: session.id });
    }
  };

  const handleStartAttendance = async () => {
    if (!selectedSession) return;
    try {
      await patch(`/api/sessions/${selectedSession.id}/`, { status: 'ACTIVE' });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setStartModalVisible(false);
      navigation.navigate('AttendanceTaking', { sessionId: selectedSession.id });
    } catch (e) {
      Alert.alert('Hata', 'Yoklama başlatılamadı.');
    }
  };

  return (
    <GradientBackground>
<View style={styles.topbar}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Yoklama (Bugün)</Text>
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Profile')}>
            <CircleUser size={28} color={colors.accentSoft} />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}>
          <TouchableOpacity
            style={[styles.filterButton, activeTab === 'PENDING' && styles.filterButtonActive]}
            onPress={() => setActiveTab('PENDING')}
          >
            <Text style={[styles.filterText, activeTab === 'PENDING' && styles.filterTextActive]}>Yoklama Alınmayanlar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, activeTab === 'COMPLETED' && styles.filterButtonActive]}
            onPress={() => setActiveTab('COMPLETED')}
          >
            <Text style={[styles.filterText, activeTab === 'COMPLETED' && styles.filterTextActive]}>Alınanlar</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accentSoft} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={todaysSessions}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const classroom = myClassrooms.find(c => c.id === item.classroom);
            const schedule = schedules?.find(s => s.id === item.schedule);
            let badgeStyle: any = styles.badgeActive; // amber
            let badgeTextStyle: any = styles.badgeTextActive; // amber text
            if (item.status === 'COMPLETED') {
              badgeStyle = styles.badgeCompleted;
              badgeTextStyle = styles.badgeTextCompleted;
            }

            return (
              <TouchableOpacity 
                style={styles.card}
                onPress={() => handleSessionPress(item)}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{classroom?.name || 'Sınıf'}</Text>
                    <View style={[styles.badge, badgeStyle]}>
                      <Text style={[styles.badgeText, badgeTextStyle]}>
                        {getSessionStatusLabel(item.status)}
                      </Text>
                    </View>
                  </View>
                  {schedule && (
                    <Text style={styles.timeText}>
                      {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                    </Text>
                  )}
                </View>
                <ChevronRight size={20} color={colors.inkDim} style={{ marginLeft: 16 }} />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<Text style={styles.emptyText}>Bugün için planlı ders yok.</Text>}
        />
      )}

      <Modal visible={startModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yoklamayı Başlat</Text>
            <Text style={styles.modalDesc}>Bu ders için yoklama almayı başlatmak istediğinize emin misiniz?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setStartModalVisible(false)}>
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalStartBtn} onPress={handleStartAttendance}>
                <Text style={styles.modalStartText}>Başlat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg1, overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: 9999 },
  orb1: { top: '-10%', left: '-10%', width: 500, height: 500, backgroundColor: 'rgba(79,70,229,0.2)', ...( { filter: 'blur(120px)' } as any ) },
  orb2: { bottom: '-10%', right: '-10%', width: 600, height: 600, backgroundColor: 'rgba(147,51,234,0.2)', ...( { filter: 'blur(150px)' } as any ) },
  
  topbar: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.glassBg, zIndex: 10, backgroundColor: colors.bg2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.ink, fontSize: 22, fontWeight: 'bold' },
  
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.glassBg, marginRight: 10, borderWidth: 1, borderColor: colors.glassBorder },
  filterButtonActive: { backgroundColor: 'rgba(129,140,248,0.2)', borderColor: 'rgba(129,140,248,0.4)' },
  filterText: { color: colors.submitted, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: colors.accentSoft },

  listContent: { padding: 20, paddingBottom: 120 },
  card: { backgroundColor: colors.glassBg, borderColor: colors.glassBg, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  timeText: { color: colors.submitted, fontSize: 14 },
  
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  badgeActive: { backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder },
  badgeInactive: { backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder },
  badgeCompleted: { backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  badgeTextActive: { color: colors.accent },
  badgeTextInactive: { color: colors.submitted },
  badgeTextCompleted: { color: colors.submitted },
  emptyText: { color: colors.inkDim, fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginTop: 40 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.bg1, padding: 24, paddingBottom: 40, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderTopColor: colors.glassBorder },
  modalTitle: { color: colors.ink, fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  modalDesc: { color: colors.submitted, fontSize: 14, marginBottom: 24 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.glassBg, alignItems: 'center' },
  modalCancelText: { color: colors.ink, fontWeight: 'bold', fontSize: 16 },
  modalStartBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.submitted, alignItems: 'center' },
  modalStartText: { color: colors.bg2, fontWeight: 'bold', fontSize: 16 },
});
