import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../../stores/auth.store';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const theme = colors.light;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text.primary }]}>Profile</Text>
      <View style={[styles.card, { borderColor: theme.border }]}>
        <Text style={{ color: theme.text.primary, fontSize: 16 }}>{user?.email || 'Unknown'}</Text>
        <Text style={{ color: theme.text.secondary, marginTop: 4 }}>Role: {user?.role || 'USER'}</Text>
      </View>
      <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: theme.danger }]} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, paddingTop: spacing.xxl },
  title: { fontSize: 28, fontWeight: '700', marginBottom: spacing.lg },
  card: { borderWidth: 1, borderRadius: 12, padding: spacing.md, marginBottom: spacing.lg },
  logoutBtn: { borderRadius: 8, padding: 14, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '600' },
});
