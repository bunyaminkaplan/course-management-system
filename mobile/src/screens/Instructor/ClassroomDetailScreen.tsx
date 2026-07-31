import { colors, fonts, radii, spacing } from '../../theme/tokens';
import React, { useState } from 'react';
import BackButton from '../../components/BackButton';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useMyClassrooms } from '../../hooks/useMyClassrooms';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, CircleUser, ChevronRight, FileText, Search } from 'lucide-react-native';
import GlassTopBar from '../../components/GlassTopBar';
import GradientBackground from '../../components/GradientBackground';
import { getUserFullName, getUserInitials } from '../../utils/userHelpers';




export default function ClassroomDetailScreen() {
  const { myClassrooms } = useMyClassrooms();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { classroomId } = route.params;

  const classroom = myClassrooms.find(c => c.id === classroomId);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredStudents = (classroom?.students || []).filter(student => getUserFullName(student).toLowerCase().includes(searchQuery.toLowerCase()));


  return (
    <GradientBackground>
      <View style={styles.topbar}>
        <View style={styles.headerRow}>
          <BackButton />
          <Text style={styles.title} numberOfLines={1}>{classroom?.name || 'Sınıf Detayı'}</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Profile')}>
            <CircleUser size={28} color={colors.accentSoft} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { outlineStyle: 'none' } as any]}
          placeholder="Öğrenci Ara..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <FlatList
        data={filteredStudents}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Öğrenciler ({filteredStudents.length})</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('StudentDetail', { 
              studentId: item.id, 
              studentName: getUserFullName(item),
              classroomId 
            })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getUserInitials(item)}</Text>
            </View>
            <Text style={styles.studentName}>{getUserFullName(item)}</Text>
            <View style={{ flex: 1 }} />
            <ChevronRight size={20} color={colors.inkDim} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Bu sınıfta öğrenci yok.</Text>}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg1, overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: 9999 },
  orb1: { top: '-10%', left: '-10%', width: 500, height: 500, backgroundColor: 'rgba(79,70,229,0.2)', ...( { filter: 'blur(120px)' } as any ) },
  orb2: { bottom: '-10%', right: '-10%', width: 600, height: 600, backgroundColor: 'rgba(147,51,234,0.2)', ...( { filter: 'blur(150px)' } as any ) },
  
  topbar: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.glassBg, zIndex: 10, backgroundColor: colors.bg2 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  title: { color: colors.ink, fontSize: 20, fontWeight: 'bold', flex: 8 },
  
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.glassBg, borderRadius: 12, marginHorizontal: 20, marginTop: 16, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.glassBorder },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: colors.ink, fontSize: 15, paddingVertical: 12 },
  listContent: { padding: 20, paddingBottom: 120 },
  card: { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: colors.glassBg, borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(129,140,248,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: colors.accentSoft, fontWeight: 'bold', fontSize: 14 },
  studentName: { color: colors.ink, fontSize: 16, fontWeight: '500' },
  emptyText: { color: colors.inkDim, fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginTop: 40 },
  
  examsSection: { marginBottom: 16 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  examIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(167,139,250,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  examTitle: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  examDate: { color: colors.submitted, fontSize: 12, marginTop: 2 },
  examGradeCount: { color: colors.accentSoft, fontSize: 13, fontWeight: '500' },
});
