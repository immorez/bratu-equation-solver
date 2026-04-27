import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getSocket } from '@/lib/socket-client';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Square, Download } from 'lucide-react';

interface TranscriptChunk { speaker: string; text: string; timestamp: number; confidence: number; }
interface Insights { notes: string[]; tasks: { description: string; assignee?: string }[]; topics: string[]; sentiment: number; }

export default function LiveMeetingPage() {
  const { id: meetingId } = useParams<{ id: string }>();
  const [chunks, setChunks] = useState<TranscriptChunk[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [meeting, setMeeting] = useState<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef(getSocket());

  useEffect(() => { apiClient.get(`/meetings/${meetingId}`).then(({ data }) => setMeeting(data.data)); }, [meetingId]);

  useEffect(() => {
    const socket = socketRef.current;
    socket.emit('join-meeting', meetingId);
    socket.on('transcript-chunk', (chunk: TranscriptChunk) => setChunks((prev) => [...prev, chunk]));
    socket.on('transcription-stopped', ({ insights: i }: any) => { setInsights(i); setIsRecording(false); });
    return () => { socket.emit('leave-meeting', meetingId); socket.off('transcript-chunk'); socket.off('transcription-stopped'); };
  }, [meetingId]);

  useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chunks]);

  const startRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
    mediaRecorderRef.current = mr;
    socketRef.current.emit('start-transcription', { meetingId });
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) {
        const reader = new FileReader();
        reader.onloadend = () => { const b64 = (reader.result as string).split(',')[1]; socketRef.current.emit('audio-chunk', { meetingId, chunk: b64 }); };
        reader.readAsDataURL(e.data);
      }
    };
    mr.start(250);
    setIsRecording(true);
  }, [meetingId]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    socketRef.current.emit('stop-transcription', { meetingId });
  }, [meetingId]);

  return (
    <div className="grid grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      <div className="col-span-2 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <div><CardTitle>{meeting?.title || 'Live Meeting'}</CardTitle><p className="text-sm text-muted-foreground mt-1">{chunks.length} segments</p></div>
            <div className="flex gap-2">
              {!isRecording ? <Button onClick={startRecording} size="sm"><Mic className="w-4 h-4 mr-2" /> Record</Button> : <Button onClick={stopRecording} variant="destructive" size="sm"><Square className="w-4 h-4 mr-2" /> Stop</Button>}
              <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export</Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-3">
              {chunks.map((chunk, i) => (
                <div key={i} className="flex gap-3">
                  <Badge variant="outline" className="h-fit mt-1 whitespace-nowrap text-xs">{chunk.speaker.split('@')[0]}</Badge>
                  <p className="text-sm leading-relaxed">{chunk.text}</p>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">AI Insights</CardTitle></CardHeader>
          <CardContent>
            {insights ? (
              <div className="space-y-4">
                <div><h4 className="text-sm font-semibold mb-2">Key Notes</h4><ul className="space-y-1">{insights.notes.map((n, i) => <li key={i} className="text-sm text-muted-foreground">{n}</li>)}</ul></div>
                <div><h4 className="text-sm font-semibold mb-2">Tasks</h4><ul className="space-y-2">{insights.tasks.map((t, i) => <li key={i} className="text-sm p-2 bg-secondary rounded-md">{t.description}</li>)}</ul></div>
                <div><h4 className="text-sm font-semibold mb-2">Topics</h4><div className="flex flex-wrap gap-1">{insights.topics.map((t, i) => <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>)}</div></div>
              </div>
            ) : <p className="text-sm text-muted-foreground">{isRecording ? 'Insights appear after recording stops...' : 'Start recording to generate insights.'}</p>}
          </CardContent>
        </Card>
        {isRecording && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="flex items-center gap-3 py-4"><div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /><span className="text-sm font-medium text-red-700 dark:text-red-400">Recording in progress</span></CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
