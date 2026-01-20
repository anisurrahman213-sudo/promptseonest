import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { useTheme } from '@/hooks/useTheme';
import { Moon, Sun, LogOut, Coins, Sparkles } from 'lucide-react';

export function Header() {
  const { user, signOut } = useAuth();
  const { credits } = useCredits();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 glass">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-primary">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl">PromptNest</span>
        </Link>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {user ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
                <Coins className="h-4 w-4 text-warning" />
                <span className="font-medium text-sm">
                  {credits !== null ? credits : '...'} credits
                </span>
              </div>

              <Link to="/pricing">
                <Button variant="outline" size="sm">
                  Upgrade
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="rounded-full"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/auth?tab=signup">
                <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
