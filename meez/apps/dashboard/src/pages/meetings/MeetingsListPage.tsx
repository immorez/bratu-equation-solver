import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeetingStore } from '@/stores/meeting.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Calendar, Clock, Users } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  ARCHIVED: 'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function MeetingsListPage() {
  const navigate = useNavigate();
  const { meetings, isLoading, filters, total, fetchMeetings, setFilters } = useMeetingStore();

  useEffect(() => { fetchMeetings(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Meetings</h1>
          <p className="text-muted-foreground">{total} meetings total</p>
        </div>
        <Button onClick={() => navigate('/meetings/new')}>
          <Plus className="w-4 h-4 mr-2" /> New Meeting
        </Button>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search meetings..." className="pl-10" value={filters.search || ''} onChange={(e) => setFilters({ search: e.target.value, page: 1 })} />
        </div>
        <select
          className="h-9 rounded-md border border-border bg-transparent px-3 text-sm"
          value={filters.status || 'all'}
          onChange={(e) => setFilters({ status: e.target.value === 'all' ? undefined : e.target.value, page: 1 })}
        >
          <option value="all">All Statuses</option>
          <option value="PLANNED">Planned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>
      {isLoading ? <LoadingSpinner /> : (
        <div className="grid gap-3">
          {meetings.map((meeting) => (
            <Card key={meeting.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/meetings/${meeting.id}`)}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <h3 className="font-medium">{meeting.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(meeting.startTime).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{meeting.participants?.length || 0}</span>
                  </div>
                </div>
                <Badge className={STATUS_COLORS[meeting.status] || ''} variant="secondary">{meeting.status.replace('_', ' ')}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
