import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeetingStore } from '@/stores/meeting.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Users, FileText, Calendar } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentMeeting, isLoading, fetchMeeting } = useMeetingStore();

  useEffect(() => { if (id) fetchMeeting(id); }, [id]);

  if (isLoading || !currentMeeting) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/meetings')}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{currentMeeting.title}</h1>
          <p className="text-muted-foreground">{new Date(currentMeeting.startTime).toLocaleString()}</p>
        </div>
        <Badge variant="secondary">{currentMeeting.status}</Badge>
        {currentMeeting.status === 'PLANNED' && (
          <Button onClick={() => navigate(`/meetings/${id}/live`)}><Play className="w-4 h-4 mr-2" /> Start Meeting</Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><span className="text-sm text-muted-foreground">Organizer:</span> <span className="text-sm">{currentMeeting.organizer.email}</span></div>
            {currentMeeting.description && <div><span className="text-sm text-muted-foreground">Description:</span> <p className="text-sm mt-1">{currentMeeting.description}</p></div>}
            {currentMeeting.endTime && <div><span className="text-sm text-muted-foreground">End:</span> <span className="text-sm">{new Date(currentMeeting.endTime).toLocaleString()}</span></div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-4 h-4" /> Participants ({currentMeeting.participants?.length || 0})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentMeeting.participants?.map((p: any) => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs">{(p.user?.email || '?')[0].toUpperCase()}</div>
                  <span>{p.user?.email || 'Unknown'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      {currentMeeting.transcript && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-4 h-4" /> Transcript</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Transcript available. View insights in the meeting.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
