import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

interface Props { title: string; onPress: () => void; variant?: 'primary' | 'secondary'; disabled?: boolean; style?: ViewStyle; }

export default function Button({ title, onPress, variant = 'primary', disabled, style }: Props) {
  const theme = colors.light;
  const bg = variant === 'primary' ? theme.primary : theme.surface;
  const fg = variant === 'primary' ? '#fff' : theme.text.primary;
  return (
    <TouchableOpacity style={[styles.btn, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }, style]} onPress={onPress} disabled={disabled}>
      <Text style={[styles.text, { color: fg }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { borderRadius: 8, padding: 14, alignItems: 'center' },
  text: { fontSize: 15, fontWeight: '600' },
});
