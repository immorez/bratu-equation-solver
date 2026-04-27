import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { format, isToday, isTomorrow } from 'date-fns';
import { apiClient } from '../../services/api';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const theme = colors.light;

  const fetchUpcoming = async () => {
    try { const { data } = await apiClient.get('/meetings?status=PLANNED&limit=10'); setMeetings(data.data.meetings); } catch {}
  };
  useEffect(() => { fetchUpcoming(); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchUpcoming(); setRefreshing(false); };
  const formatDate = (d: string) => { const date = new Date(d); if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`; if (isTomorrow(date)) return `Tomorrow, ${format(date, 'h:mm a')}`; return format(date, 'MMM d, h:mm a'); };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[typography.heading1, { color: theme.text.primary }]}>Home</Text>
        <Text style={[typography.bodySmall, { color: theme.text.secondary, marginTop: spacing.xs }]}>{format(new Date(), 'EEEE, MMMM d')}</Text>
      </View>
      <Text style={[typography.heading3, styles.section, { color: theme.text.primary }]}>Upcoming Meetings</Text>
      <FlatList data={meetings} keyExtractor={(item) => item.id} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xxl }}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => navigation.navigate('LiveMeeting', { meetingId: item.id, title: item.title })} activeOpacity={0.7}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: theme.text.primary, fontWeight: '500' }]}>{item.title}</Text>
              <Text style={[typography.bodySmall, { color: theme.text.secondary, marginTop: 4 }]}>{formatDate(item.startTime)}</Text>
            </View>
            <View style={[styles.dot, { backgroundColor: item.status === 'IN_PROGRESS' ? theme.success : theme.accent }]} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={styles.empty}><Text style={[typography.body, { color: theme.text.tertiary }]}>No upcoming meetings</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.xxl, paddingBottom: spacing.md },
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  card: { borderRadius: 12, borderWidth: 1, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  empty: { alignItems: 'center', paddingTop: spacing.xxl },
});
