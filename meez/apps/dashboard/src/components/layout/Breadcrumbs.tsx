import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumbs() {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      {paths.map((path, index) => {
        const to = '/' + paths.slice(0, index + 1).join('/');
        const isLast = index === paths.length - 1;
        return (
          <span key={to} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="w-3 h-3" />}
            {isLast ? (
              <span className="text-foreground font-medium capitalize">{path}</span>
            ) : (
              <Link to={to} className="hover:text-foreground capitalize">{path}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
