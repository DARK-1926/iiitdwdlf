
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthUser } from "@/types";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, LogOut, Menu, User } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";

interface NavItem {
  title: string;
  path: string;
}

interface MobileNavigationProps {
  user: AuthUser | null;
  navItems: NavItem[];
  onSignOut: () => Promise<void>;
}

const MobileNavigation = ({ user, navItems, onSignOut }: MobileNavigationProps) => {
  const navigate = useNavigate();
  
  const getUserDisplayName = () => {
    if (!user) return '';
    return user.user_metadata?.name || 
           user.user_metadata?.full_name || 
           user.email?.split('@')[0] || 
           'User';
  };
  
  const getUserAvatar = () => {
    if (!user) return '';
    return user.user_metadata?.avatar_url || '';
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <div className="flex flex-col h-full">
          <div className="py-4">
            <h3 className="font-heading text-lg font-bold mb-4">Found & Lost</h3>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="block py-2 px-3 rounded-md hover:bg-accent"
                >
                  {item.title}
                </Link>
              ))}
              
              <Link
                to="/report"
                className="block py-2 px-3 rounded-md hover:bg-accent"
              >
                Report an Item
              </Link>
            </nav>
          </div>
          
          <div className="mt-auto border-t pt-4">
            {user ? (
              <>
                <div className="flex items-center mb-4 px-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={getUserAvatar()} alt={getUserDisplayName()} />
                    <AvatarFallback>{getUserDisplayName().charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="ml-2">
                    <p className="text-sm font-medium">{getUserDisplayName()}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => navigate('/profile')}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start mt-2" 
                  onClick={onSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate('/auth')} className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            )}
            <div className="mt-4 flex items-center justify-between px-2">
              <p className="text-xs text-muted-foreground">Theme</p>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavigation;
