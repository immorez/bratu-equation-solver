import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing } from '../../theme/spacing';

export default function JoinMeetingScreen() {
  return (
    <View style={styles.container}><Text style={styles.text}>Join Meeting</Text></View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.md },
  text: { fontSize: 18, fontWeight: '600' },
});
