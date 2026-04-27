import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeetingStore } from '@/stores/meeting.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';

export default function CreateMeetingPage() {
  const navigate = useNavigate();
  const { createMeeting } = useMeetingStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const meeting = await createMeeting({ title, description: description || undefined, startTime: new Date(startTime).toISOString(), endTime: endTime ? new Date(endTime).toISOString() : undefined });
      navigate(`/meetings/${meeting.id}`);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/meetings')}><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="text-2xl font-semibold">New Meeting</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Meeting Details</CardTitle></CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Sprint Planning" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" placeholder="Meeting agenda..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input id="startTime" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time (optional)</Label>
                <Input id="endTime" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Meeting'}</Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
