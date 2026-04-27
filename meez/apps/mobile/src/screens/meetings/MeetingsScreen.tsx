import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMeetingStore } from '../../stores/meeting.store';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function MeetingsScreen() {
  const navigation = useNavigation<any>();
  const { meetings, isLoading, fetchMeetings } = useMeetingStore();
  const theme = colors.light;

  useEffect(() => { fetchMeetings(); }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}><Text style={[typography.heading1, { color: theme.text.primary }]}>Meetings</Text></View>
      <FlatList data={meetings} keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.md }}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, { borderColor: theme.border }]} onPress={() => navigation.navigate('LiveMeeting', { meetingId: item.id, title: item.title })}>
            <Text style={[typography.body, { color: theme.text.primary, fontWeight: '500' }]}>{item.title}</Text>
            <Text style={[typography.bodySmall, { color: theme.text.secondary }]}>{new Date(item.startTime).toLocaleDateString()} - {item.status}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.xxl, paddingBottom: spacing.md },
  card: { borderWidth: 1, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm },
});
