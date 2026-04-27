import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <p className="text-lg mt-4">Page not found</p>
        <Link to="/dashboard"><Button className="mt-6">Go Home</Button></Link>
      </div>
    </div>
  );
}
