import { colors, fonts, radii, spacing } from '../theme/tokens';
import React, { useState } from 'react';
import GradientBackground from '../components/GradientBackground';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.roleTag}>SYSTEM</Text>
            <View style={styles.avatar}><Text style={styles.avatarText}>AI</Text></View>
          </View>
          <Text style={styles.title}>Giriş Yap</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Kullanıcı Adı</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Kullanıcı adı"
              placeholderTextColor="rgba(255,255,255,0.4)"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Şifre</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Şifre"
              placeholderTextColor="rgba(255,255,255,0.4)"
              secureTextEntry
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={colors.bg3} /> : <Text style={styles.buttonText}>Giriş Yap</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  orb: { position: 'absolute', borderRadius: 9999 },
  orb1: { top: '-10%', left: '-10%', width: 500, height: 500, backgroundColor: 'rgba(79,70,229,0.2)', ...( { filter: 'blur(120px)' } as any ) },
  orb2: { bottom: '-10%', right: '-10%', width: 600, height: 600, backgroundColor: 'rgba(147,51,234,0.2)', ...( { filter: 'blur(150px)' } as any ) },
  orb3: { top: '30%', left: '40%', width: 300, height: 300, backgroundColor: 'rgba(6,182,212,0.1)', ...( { filter: 'blur(100px)' } as any ) },
  card: {
    width: '100%',
    maxWidth: 320,
    padding: 32,
    borderRadius: 40,
    backgroundColor: 'rgba(30,27,75,0.4)',
    borderColor: 'rgba(49,46,129,0.5)',
    borderWidth: 6,
    zIndex: 10,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  roleTag: { fontSize: 10, textTransform: 'uppercase', color: colors.accent, fontWeight: 'bold', letterSpacing: 2 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(139,92,246,0.2)', borderColor: 'rgba(167,139,250,0.3)', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 10, color: colors.accent, fontWeight: 'bold' },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: colors.submitted,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  input: {
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 16,
    padding: 12,
    color: colors.ink,
    fontSize: 14,
  },
  button: {
    backgroundColor: 'rgba(139,92,246,0.2)',
    borderColor: 'rgba(167,139,250,0.3)',
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: colors.accent,
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  error: {
    color: colors.overdue,
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 12,
  },
  hint: {
    color: colors.glassBorder,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 24,
  }
});
