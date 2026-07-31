import { colors, fonts, radii, spacing } from '../../theme/tokens';
import React, { useMemo } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import SkeletonCard from '../../components/SkeletonCard';
import GradientBackground from '../../components/GradientBackground';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { get } from '../../api/client';
import { Assignment } from '../../types/api';
import { useMyClassrooms } from '../../hooks/useMyClassrooms';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CircleUser, Plus, ChevronRight } from 'lucide-react-native';

export default function AssignmentsListScreen() {
  const { myClassrooms } = useMyClassrooms();
  const navigation = useNavigation<any>();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => get<Assignment[]>('/api/assignments/'),
  });

  const filteredAssignments = useMemo(() => {
    if (!assignments || !myClassrooms) return [];
    return assignments.filter(a => myClassrooms.some(c => c.id === a.classroom))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [assignments, myClassrooms]);

  return (
    <GradientBackground>
<View style={styles.topbar}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Ödevler</Text>
          <View style={styles.rightActions}>
            <TouchableOpacity onPress={() => navigation.navigate('CreateAssignment')} style={styles.iconButton}>
              <Plus size={24} color={colors.accentSoft} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Profile')} style={styles.iconButton}>
              <CircleUser size={28} color={colors.accentSoft} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {isLoading ? (
        <View style={{ padding: 13, gap: 8 }}>{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</View>
      ) : (
        <FlatList
          data={filteredAssignments}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (<Animated.View entering={FadeInDown.duration(280).delay(Math.min(index,20)*30)}><TouchableOpacity 
              style={styles.card}
              onPress={() => navigation.navigate('AssignmentSubmissions', { assignmentId: item.id })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSub}>{item.classroom_name}</Text>
                <Text style={styles.dateText}>Son tarih: {format(new Date(item.deadline), "d MMMM HH:mm", { locale: tr })}</Text>
              </View>
              <ChevronRight size={20} color={colors.inkDim} style={{ marginLeft: 12 }} />
            </TouchableOpacity></Animated.View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Henüz ödev bulunmuyor.</Text>}
        />
      )}
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
  rightActions: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { marginLeft: 16 },
  
  listContent: { padding: 20, paddingBottom: 120 },
  card: { backgroundColor: colors.glassBg, borderColor: colors.glassBg, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '600', marginBottom: 4 },
  cardSub: { color: colors.submitted, fontSize: 13, marginBottom: 8 },
  dateText: { color: colors.accentSoft, fontSize: 12, fontWeight: '500' },
  emptyText: { color: colors.inkDim, fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginTop: 40 },
});
