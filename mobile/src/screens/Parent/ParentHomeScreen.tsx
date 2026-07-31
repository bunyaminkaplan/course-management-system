import { colors, fonts, radii, spacing } from '../../theme/tokens';
import React from 'react';
import GradientBackground from '../../components/GradientBackground';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useChildSwitcher } from '../../context/ChildSwitcherContext';
import { get } from '../../api/client';
import { FeedItem } from '../../types/api';
import FeedCard from '../../components/FeedCard';
import { CircleUser } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { getUserFullName } from '../../utils/userHelpers';

export default function ParentHomeScreen() {
  const { selectedChildId, setSelectedChildId, childrenList } = useChildSwitcher();
  const navigation = useNavigation<any>();

  const { data: feedData } = useQuery({
    queryKey: ['feed'],
    queryFn: () => get<FeedItem[]>('/api/feed/')
  });

  // Filter feed by selected child's classrooms
  // Assuming child obj has some info, but feed API returns all children's feeds.
  // For MVP, we show all feeds or try to filter if we fetch child's classrooms.
  // Here we'll just display the aggregated feed as returned by backend.
  const feed = feedData || [];

  return (
    <GradientBackground>
<View style={styles.header}>
        <Text style={styles.headerTitle}>Ana Sayfa</Text>
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <Text style={styles.heroText}>Aktif Eğitime Devam Ediyor</Text>
        </View>

        <Text style={styles.sectionTitle}>Son Akış</Text>
        
        {feed && feed.length > 0 ? (
          feed.map(item => (
            <View style={{ marginBottom: 8 }} key={`feed-${item.type}-${item.id}`}>
               <FeedCard item={item} />
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Henüz içerik yok</Text>
        )}
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
  heroCard: {
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  heroText: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyText: {
    color: colors.inkDim,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  }
});
