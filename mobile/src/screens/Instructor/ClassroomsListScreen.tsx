import { colors, fonts, radii, spacing } from '../../theme/tokens';
import React from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import GradientBackground from '../../components/GradientBackground';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useMyClassrooms } from '../../hooks/useMyClassrooms';
import { useNavigation } from '@react-navigation/native';
import { CircleUser, ChevronRight } from 'lucide-react-native';

export default function ClassroomsListScreen() {
  const { myClassrooms, isLoading } = useMyClassrooms();
  const navigation = useNavigation<any>();

  return (
    <GradientBackground>
<View style={styles.topbar}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Sınıflarım</Text>
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Profile')}>
            <CircleUser size={28} color={colors.accentSoft} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accentSoft} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={myClassrooms}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (<Animated.View entering={FadeInDown.duration(280).delay(Math.min(index,20)*30)}><TouchableOpacity 
              style={styles.card}
              onPress={() => navigation.navigate('ClassroomDetail', { classroomId: item.id })}
            >
              <View>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSub}>{item.students.length} öğrenci</Text>
              </View>
              <ChevronRight size={20} color={colors.inkDim} />
            </TouchableOpacity></Animated.View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Sınıf bulunamadı.</Text>}
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
  
  listContent: { padding: 20, paddingBottom: 120 },
  card: { backgroundColor: colors.glassBg, borderColor: colors.glassBg, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '600', marginBottom: 4 },
  cardSub: { color: colors.submitted, fontSize: 13 },
  emptyText: { color: colors.inkDim, fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginTop: 40 },
});
