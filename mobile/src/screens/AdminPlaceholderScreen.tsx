import { colors, fonts, radii, spacing } from '../theme/tokens';
import React from 'react';
import GradientBackground from '../components/GradientBackground';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdminPlaceholderScreen() {
  const { logout } = useAuth();
  
  return (
    <GradientBackground>
<Text style={styles.text}>Admin paneli web üzerinden kullanılmalıdır.</Text>
      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg1, overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: 9999 },
  orb1: { top: '-10%', left: '-10%', width: 500, height: 500, backgroundColor: 'rgba(79,70,229,0.2)', ...( { filter: 'blur(120px)' } as any ) },
  orb2: { bottom: '-10%', right: '-10%', width: 600, height: 600, backgroundColor: 'rgba(147,51,234,0.2)', ...( { filter: 'blur(150px)' } as any ) },
  text: { color: colors.ink, fontSize: 16, marginBottom: 24, zIndex: 10 },
  button: { backgroundColor: 'rgba(139,92,246,0.2)', borderColor: 'rgba(167,139,250,0.3)', borderWidth: 1, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, zIndex: 10 },
  buttonText: { color: colors.accent, fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }
});
