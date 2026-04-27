import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeetingStore } from '@/stores/meeting.store';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Users, FileText } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { meetings, total, fetchMeetings } = useMeetingStore();

  useEffect(() => { fetchMeetings(); }, []);

  const planned = meetings.filter((m) => m.status === 'PLANNED').length;
  const inProgress = meetings.filter((m) => m.status === 'IN_PROGRESS').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
        <Button onClick={() => navigate('/meetings/new')}>
          <Plus className="w-4 h-4 mr-2" /> New Meeting
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{planned}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{inProgress}</div></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          {meetings.length === 0 ? (
            <p className="text-muted-foreground text-sm">No meetings yet. Create one to get started.</p>
          ) : (
            <div className="space-y-2">
              {meetings.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-md hover:bg-accent cursor-pointer" onClick={() => navigate(`/meetings/${m.id}`)}>
                  <div>
                    <p className="font-medium text-sm">{m.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(m.startTime).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-secondary">{m.status}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
