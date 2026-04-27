import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../stores/auth.store';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface Chunk { speaker: string; text: string; timestamp: number; }

export default function LiveMeetingScreen() {
  const route = useRoute<any>();
  const { meetingId } = route.params;
  const token = useAuthStore((s) => s.token);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const theme = colors.light;

  useEffect(() => {
    const socket = io('ws://localhost:3000', { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;
    socket.emit('join-meeting', meetingId);
    socket.on('transcript-chunk', (chunk: Chunk) => setChunks((prev) => [...prev, chunk]));
    return () => { socket.emit('leave-meeting', meetingId); socket.disconnect(); };
  }, [meetingId, token]);

  const toggleRecording = () => {
    if (!isRecording) { socketRef.current?.emit('start-transcription', { meetingId }); setIsRecording(true); }
    else { socketRef.current?.emit('stop-transcription', { meetingId }); setIsRecording(false); }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList data={chunks} keyExtractor={(_, i) => String(i)} contentContainerStyle={{ padding: spacing.md }}
        renderItem={({ item }) => (
          <View style={styles.chunk}><Text style={[styles.speaker, { color: theme.accent }]}>{item.speaker.split('@')[0]}</Text><Text style={{ color: theme.text.primary }}>{item.text}</Text></View>
        )} />
      <TouchableOpacity style={[styles.recordBtn, { backgroundColor: isRecording ? theme.danger : theme.primary }]} onPress={toggleRecording}>
        <Text style={styles.recordText}>{isRecording ? 'Stop' : 'Record'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chunk: { marginBottom: spacing.sm },
  speaker: { fontWeight: '600', marginBottom: 2 },
  recordBtn: { margin: spacing.md, padding: 16, borderRadius: 12, alignItems: 'center' },
  recordText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
