import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../stores/auth.store';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, isLoading } = useAuthStore();
  const navigation = useNavigation<any>();
  const theme = colors.light;

  const handleRegister = async () => {
    try { await register(email, password); } catch { Alert.alert('Error', 'Registration failed'); }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text.primary }]}>Create Account</Text>
      <TextInput style={[styles.input, { borderColor: theme.border, color: theme.text.primary }]} placeholder="Email" placeholderTextColor={theme.text.tertiary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={[styles.input, { borderColor: theme.border, color: theme.text.primary }]} placeholder="Password (min 8 chars)" placeholderTextColor={theme.text.tertiary} value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleRegister} disabled={isLoading}>
        <Text style={[styles.buttonText, { color: '#fff' }]}>{isLoading ? 'Creating...' : 'Create Account'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: theme.accent, textAlign: 'center', marginTop: spacing.md }}>Already have an account? Sign in</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: spacing.xl },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15, marginBottom: spacing.md },
  button: { borderRadius: 8, padding: 14, alignItems: 'center', marginTop: spacing.sm },
  buttonText: { fontSize: 15, fontWeight: '600' },
});
