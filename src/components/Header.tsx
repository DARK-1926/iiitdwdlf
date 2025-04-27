import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { LogIn, MessageSquare, Plus, Search } from 'lucide-react';
import { ItemStatus } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "./ThemeToggle";
import NotificationBadge from './NotificationBadge';
import MobileNavigation from './navigation/MobileNavigation';
import UserMenu from './navigation/UserMenu';

const Header = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setIsScrolled(offset > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const navItems = [
    { title: 'Lost Items', path: '/items/lost', status: 'lost' as ItemStatus },
    { title: 'Found Items', path: '/items/found', status: 'found' as ItemStatus },
    { title: 'How It Works', path: '/how-it-works' },
  ];
  
  return (
    <header className="w-full py-4 px-6 flex items-center justify-between bg-white/90 dark:bg-gray-900/90 shadow-md animate-fadein">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          {isMobile && <MobileNavigation user={user} navItems={navItems} onSignOut={signOut} />}
          
          <Link to="/" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 relative py-2 min-w-0">
            <img src="/iiit-logo.jpg" alt="IIIT Dharwad Logo" className="w-8 h-8 sm:w-12 sm:h-12 rounded-full shadow-lg border-2 border-blue-400 dark:border-magenta-400 flex-shrink-0" />
            <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight font-heading animate-fadein dark:text-neon-magenta dark:text-stroke-white text-center sm:text-left min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">Lost & Found</h1>
            <div className="absolute inset-0 -z-10 animate-gradient-bg" />
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="font-body text-lg font-semibold text-gray-700 dark:text-gray-200 transition-colors duration-200 hover:text-blue-600 dark:hover:text-blue-400 animate-fadein"
            >
              {item.title}
            </Link>
          ))}
        </nav>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {user ? (
            <>
              <NotificationBadge />
              
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:inline-flex"
                onClick={() => navigate('/search')}
              >
                <Search className="h-5 w-5" />
              </Button>

              <Button
                variant="outline"
                className="hidden md:inline-flex"
                onClick={() => navigate('/report')}
              >
                <Plus className="mr-2 h-4 w-4" /> Report an Item
              </Button>
              
              <UserMenu user={user} onSignOut={signOut} />
            </>
          ) : (
            <Button onClick={() => navigate('/auth')}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
