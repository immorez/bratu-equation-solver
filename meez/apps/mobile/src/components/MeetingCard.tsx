import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface Props { title: string; date: string; status: string; onPress: () => void; }

export default function MeetingCard({ title, date, status, onPress }: Props) {
  const theme = colors.light;
  return (
    <TouchableOpacity style={[styles.card, { borderColor: theme.border }]} onPress={onPress} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '500', color: theme.text.primary }}>{title}</Text>
        <Text style={{ color: theme.text.secondary, fontSize: 13, marginTop: 4 }}>{date}</Text>
      </View>
      <Text style={{ color: theme.text.tertiary, fontSize: 12 }}>{status}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center' },
});
