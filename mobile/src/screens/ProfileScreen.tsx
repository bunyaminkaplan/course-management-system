import { colors, fonts, radii, spacing } from '../theme/tokens';
import React from 'react';
import GradientBackground from '../components/GradientBackground';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, LogOut, Users, BookOpen, SquareCheck, FilePenLine, MessageSquare, GraduationCap } from 'lucide-react-native';
import { useMyClassrooms } from '../hooks/useMyClassrooms';
import { getUserFullName, getUserInitials } from '../utils/userHelpers';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const { myClassrooms } = useMyClassrooms();
  
  const roleText = user?.role === 'STUDENT' ? 'Öğrenci' : user?.role === 'INSTRUCTOR' ? 'Öğretmen' : user?.role === 'PARENT' ? 'Veli' : 'Admin';
  const totalStudents = myClassrooms.reduce((acc, c) => acc + c.students.length, 0);

  const handleNavigateToTab = (tabName: string) => {
    navigation.navigate('InstructorTabs', { screen: tabName });
  };

  return (
    <GradientBackground>
<View style={styles.topbar}>
        <TouchableOpacity onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate(user?.role === 'INSTRUCTOR' ? 'InstructorTabs' : 'StudentTabs');
          }
        }} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.ink} />
          <Text style={styles.backText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{getUserInitials(user)}</Text>
          </View>
          <Text style={styles.name}>{getUserFullName(user)}</Text>
          <View style={styles.roleContainer}>
            <Text style={styles.role}>{roleText.toUpperCase()}</Text>
          </View>
          <Text style={styles.email}>{user?.email}</Text>
          
          <TouchableOpacity style={styles.button} onPress={logout}>
            <LogOut size={16} color={colors.overdue} style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>ÇIKIŞ YAP</Text>
          </TouchableOpacity>
        </View>

        {user?.role === 'INSTRUCTOR' && (
          <View style={styles.academicSection}>
            <Text style={styles.sectionTitle}>Eğitmen Paneli</Text>
            
            <View style={styles.statsRow}>
              <TouchableOpacity style={styles.statCard} onPress={() => handleNavigateToTab('Sınıflarım')}>
                <BookOpen size={24} color={colors.accent} style={{ marginBottom: 12 }} />
                <Text style={styles.statLabel}>Sınıflarım</Text>
                <Text style={styles.statValue}>{myClassrooms.length}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statCard} onPress={() => handleNavigateToTab('Sınıflarım')}>
                <Users size={24} color={colors.submitted} style={{ marginBottom: 12 }} />
                <Text style={styles.statLabel}>Öğrenciler</Text>
                <Text style={styles.statValue}>{totalStudents}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
            <View style={styles.quickAccessGrid}>
               <TouchableOpacity style={styles.quickAccessBtn} onPress={() => handleNavigateToTab('Ana Sayfa')}>
                 <BookOpen size={20} color={colors.accentSoft} />
                 <Text style={styles.quickAccessText}>Ana Sayfa</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.quickAccessBtn} onPress={() => handleNavigateToTab('Yoklama')}>
                 <SquareCheck size={20} color={colors.submitted} />
                 <Text style={styles.quickAccessText}>Yoklama</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.quickAccessBtn} onPress={() => handleNavigateToTab('Ödevler')}>
                 <FilePenLine size={20} color={colors.accent} />
                 <Text style={styles.quickAccessText}>Ödevler</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.quickAccessBtn} onPress={() => handleNavigateToTab('Forum')}>
                 <MessageSquare size={20} color={colors.overdue} />
                 <Text style={styles.quickAccessText}>Forum</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.quickAccessBtn} onPress={() => handleNavigateToTab('Sınavlar')}>
                 <GraduationCap size={20} color={colors.accent} />
                 <Text style={styles.quickAccessText}>Sınavlar</Text>
               </TouchableOpacity>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.cardTitle}>Sınıf Listesi</Text>
              {myClassrooms.length === 0 ? (
                <Text style={styles.empty}>Henüz atandığınız bir sınıf yok.</Text>
              ) : (
                myClassrooms.map(c => (
                  <TouchableOpacity 
                    key={`class-${c.id}`} 
                    style={styles.gradeRow}
                    onPress={() => {
                       navigation.navigate('InstructorTabs', { screen: 'Sınıflarım' });
                    }}
                  >
                    <View style={styles.gradeInfo}>
                      <Text style={styles.gradeTitle}>{c.name}</Text>
                    </View>
                    <View style={[styles.gradeScore, { backgroundColor: 'rgba(56,189,248,0.1)', borderColor: 'rgba(56,189,248,0.3)' }]}>
                      <Text style={[styles.gradeScoreText, { color: colors.submitted }]}>{c.students.length}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg1, overflow: 'hidden' },
  topbar: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', zIndex: 50 },
  backButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.glassBg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.glassBorder },
  backText: { color: colors.ink, fontWeight: 'bold', fontSize: 14, marginLeft: 4 },
  scrollContent: { padding: 20, paddingBottom: 60, alignItems: 'center' },
  orb: { position: 'absolute', borderRadius: 9999 },
  orb1: { top: '-10%', left: '-10%', width: 500, height: 500, backgroundColor: 'rgba(79,70,229,0.2)', ...( { filter: 'blur(120px)' } as any ) },
  orb2: { bottom: '-10%', right: '-10%', width: 600, height: 600, backgroundColor: 'rgba(147,51,234,0.2)', ...( { filter: 'blur(150px)' } as any ) },
  orb3: { top: '30%', left: '40%', width: 300, height: 300, backgroundColor: 'rgba(6,182,212,0.1)', ...( { filter: 'blur(100px)' } as any ) },
  
  card: {
    backgroundColor: 'rgba(30,27,75,0.4)',
    borderColor: 'rgba(49,46,129,0.5)',
    borderWidth: 6,
    borderRadius: 40,
    padding: 32,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    zIndex: 10,
    marginBottom: 24,
  },
  avatarLarge: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(139,92,246,0.2)', borderColor: 'rgba(167,139,250,0.3)', borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 16
  },
  avatarLargeText: { fontSize: 24, color: colors.accent, fontWeight: 'bold' },
  name: { color: colors.ink, fontSize: 24, fontWeight: '600' },
  roleContainer: {
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderColor: 'rgba(139,92,246,0.2)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  role: { color: colors.accent, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },
  email: { color: colors.submitted, fontSize: 12, marginTop: 12, marginBottom: 32 },
  button: { 
    backgroundColor: 'rgba(239,68,68,0.1)', 
    borderColor: 'rgba(239,68,68,0.2)', 
    paddingVertical: 14, 
    paddingHorizontal: 24, 
    borderRadius: 16, 
    borderWidth: 1, 
    width: '100%', 
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center' 
  },
  buttonText: { color: colors.overdue, fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  
  academicSection: { width: '100%', maxWidth: 340, zIndex: 10 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: colors.glassBg, borderColor: colors.glassBorder, borderWidth: 1, borderRadius: 24, padding: 20, alignItems: 'center' },
  statLabel: { color: colors.submitted, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12 },
  statValue: { color: colors.accent, fontSize: 18, fontWeight: 'bold' },
  
  quickAccessGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  quickAccessBtn: { flex: 1, minWidth: '45%', backgroundColor: colors.glassBg, borderColor: colors.glassBg, borderWidth: 1, borderRadius: 16, padding: 16, alignItems: 'center', flexDirection: 'row', gap: 12 },
  quickAccessText: { color: colors.ink, fontSize: 14, fontWeight: '500' },

  chartCard: { backgroundColor: colors.glassBg, borderColor: colors.glassBorder, borderWidth: 1, borderRadius: 24, padding: 20, marginBottom: 16 },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  empty: { color: colors.submitted, fontStyle: 'italic', fontSize: 12, textAlign: 'center' },
  gradeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.glassBg },
  gradeInfo: { flex: 1 },
  gradeTitle: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  gradeScore: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', borderWidth: 1, borderRadius: 12, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  gradeScoreText: { color: colors.submitted, fontSize: 14, fontWeight: 'bold' }
});
