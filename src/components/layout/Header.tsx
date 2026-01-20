import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { useTheme } from '@/hooks/useTheme';
import { useIsAdmin } from '@/hooks/usePaymentRequests';
import { Moon, Sun, LogOut, Coins, Sparkles, Menu, X, Crown, History, ShieldCheck, User } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Header() {
  const { user, signOut } = useAuth();
  const { credits } = useCredits();
  const { theme, toggleTheme } = useTheme();
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 glass">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-primary">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg sm:text-xl">PromptNest</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-3">
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

              <Link to="/profile">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-1" />
                  Profile
                </Button>
              </Link>

              <Link to="/payment-history">
                <Button variant="ghost" size="sm">
                  <History className="h-4 w-4 mr-1" />
                  History
                </Button>
              </Link>

              {isAdmin && (
                <Link to="/admin/payments">
                  <Button variant="ghost" size="sm" className="text-primary">
                    <ShieldCheck className="h-4 w-4 mr-1" />
                    Admin
                  </Button>
                </Link>
              )}

              <Link to="/pricing">
                <Button size="sm" className="bg-gradient-primary hover:opacity-90 text-white">
                  <Crown className="h-4 w-4 mr-1" />
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

        {/* Mobile Navigation */}
        <div className="flex sm:hidden items-center gap-2">
          {user && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs">
              <Coins className="h-3.5 w-3.5 text-warning" />
              <span className="font-medium">
                {credits !== null ? credits : '...'}
              </span>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full h-9 w-9"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-full h-9 w-9"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden border-t border-border/40 glass overflow-hidden"
          >
            <div className="container px-4 py-4 space-y-3">
              {user ? (
                <>
                  <Link 
                    to="/profile" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block"
                  >
                    <Button variant="ghost" className="w-full justify-center h-11">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Button>
                  </Link>
                  <Link 
                    to="/payment-history" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block"
                  >
                    <Button variant="ghost" className="w-full justify-center h-11">
                      <History className="mr-2 h-4 w-4" />
                      Payment History
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link 
                      to="/admin/payments" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="block"
                    >
                      <Button variant="ghost" className="w-full justify-center h-11 text-primary">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                  <Link 
                    to="/pricing" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block"
                  >
                    <Button className="w-full justify-center h-11 bg-gradient-primary hover:opacity-90 text-white">
                      <Crown className="mr-2 h-4 w-4" />
                      Upgrade Plan
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="w-full justify-center h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link 
                    to="/auth" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block"
                  >
                    <Button variant="outline" className="w-full justify-center h-11">
                      Login
                    </Button>
                  </Link>
                  <Link 
                    to="/auth?tab=signup" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block"
                  >
                    <Button className="w-full justify-center h-11 bg-gradient-primary hover:opacity-90">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Header;
