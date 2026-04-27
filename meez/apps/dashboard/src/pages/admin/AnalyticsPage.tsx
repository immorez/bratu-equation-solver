import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Total Meetings</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">--</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Active Users</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">--</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Transcription Hours</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">--</div></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Analytics Dashboard</CardTitle></CardHeader><CardContent><p className="text-muted-foreground text-sm">Detailed analytics and charts will be available here.</p></CardContent></Card>
    </div>
  );
}
