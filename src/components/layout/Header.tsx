import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { useTheme } from '@/hooks/useTheme';
import { useIsAdmin } from '@/hooks/usePaymentRequests';
import { usePlansActive } from '@/hooks/usePlansActive';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Moon, Sun, LogOut, Coins, Sparkles, Menu, X, Crown, History, ShieldCheck, User, HelpCircle, Chrome, Wrench, ArrowLeft, Activity } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { credits } = useCredits();
  const { theme, toggleTheme } = useTheme();
  const { data: isAdmin } = useIsAdmin();
  const { data: hasActivePlans } = usePlansActive();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const showBackButton = location.pathname !== '/';

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const handleNavigate = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 glass" role="banner">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="rounded-full h-9 w-9 sm:h-10 sm:w-10 shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0"
          >
            <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-primary shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-base sm:text-xl truncate">Prompt SEO Nest</span>
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center gap-3" aria-label="Main navigation">
          <LanguageSwitcher />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {user ? (
            <>
              {hasActivePlans && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
                  <Coins className="h-4 w-4 text-warning" />
                  <span className="font-medium text-sm">
                    {credits !== null ? credits : '...'} {t('common.credits')}
                  </span>
                </div>
              )}

              <Button variant="ghost" size="sm" onClick={() => handleNavigate('/profile')}>
                <User className="h-4 w-4 mr-1" />
                {t('header.profile')}
              </Button>

              <Button variant="ghost" size="sm" onClick={() => handleNavigate('/payment-history')}>
                <History className="h-4 w-4 mr-1" />
                {t('header.history')}
              </Button>

              <Button variant="ghost" size="sm" onClick={() => handleNavigate('/metadata-fixer')}>
                <Wrench className="h-4 w-4 mr-1" />
                Metadata Fixer
              </Button>

              <Button variant="ghost" size="sm" onClick={() => handleNavigate('/extension')}>
                <Chrome className="h-4 w-4 mr-1" />
                Extension
              </Button>

              <Button variant="ghost" size="sm" onClick={() => handleNavigate('/tutorials')}>
                <HelpCircle className="h-4 w-4 mr-1" />
                {t('header.tutorials')}
              </Button>

              {isAdmin && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary"
                    onClick={() => handleNavigate('/admin/payments')}
                  >
                    <ShieldCheck className="h-4 w-4 mr-1" />
                    {t('header.admin')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-primary"
                    onClick={() => handleNavigate('/admin/health')}
                    aria-label="Health Check"
                    title="Health Check"
                  >
                    <Activity className="h-5 w-5" />
                  </Button>
                </>
              )}


              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="rounded-full"
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => handleNavigate('/metadata-fixer')}>
                <Wrench className="h-4 w-4 mr-1" />
                Metadata Fixer
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleNavigate('/extension')}>
                <Chrome className="h-4 w-4 mr-1" />
                Extension
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleNavigate('/tutorials')}>
                <HelpCircle className="h-4 w-4 mr-1" />
                {t('header.tutorials')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleNavigate('/auth')}>
                {t('header.login')}
              </Button>
              <Button 
                size="sm" 
                className="bg-gradient-primary hover:opacity-90"
                onClick={() => handleNavigate('/auth?tab=signup')}
              >
                {t('header.getStarted')}
              </Button>
            </>
          )}
        </nav>

        {/* Mobile Navigation */}
        <div className="flex sm:hidden items-center gap-1.5">
          {user && hasActivePlans && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs">
              <Coins className="h-3.5 w-3.5 text-warning" />
              <span className="font-medium">
                {credits !== null ? credits : '...'}
              </span>
            </div>
          )}
          
          <LanguageSwitcher />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full h-9 w-9"
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
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
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
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
                  <Button 
                    variant="ghost" 
                    className="w-full justify-center h-11"
                    onClick={() => handleNavigate('/profile')}
                  >
                    <User className="mr-2 h-4 w-4" />
                    {t('header.profile')}
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-center h-11"
                    onClick={() => handleNavigate('/payment-history')}
                  >
                    <History className="mr-2 h-4 w-4" />
                    {t('header.paymentHistory')}
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-center h-11"
                    onClick={() => handleNavigate('/metadata-fixer')}
                  >
                    <Wrench className="mr-2 h-4 w-4" />
                    Metadata Fixer
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-center h-11"
                    onClick={() => handleNavigate('/extension')}
                  >
                    <Chrome className="mr-2 h-4 w-4" />
                    Extension
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-center h-11"
                    onClick={() => handleNavigate('/tutorials')}
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    {t('header.tutorials')}
                  </Button>
                  {isAdmin && (
                    <>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-center h-11 text-primary"
                        onClick={() => handleNavigate('/admin/payments')}
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        {t('header.adminPanel')}
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-center h-11 text-primary"
                        onClick={() => handleNavigate('/admin/health')}
                      >
                        <Activity className="mr-2 h-4 w-4" />
                        Health Check
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="w-full justify-center h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('header.signOut')}
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-center h-11"
                    onClick={() => handleNavigate('/metadata-fixer')}
                  >
                    <Wrench className="mr-2 h-4 w-4" />
                    Metadata Fixer
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-center h-11"
                    onClick={() => handleNavigate('/extension')}
                  >
                    <Chrome className="mr-2 h-4 w-4" />
                    Extension
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-center h-11"
                    onClick={() => handleNavigate('/tutorials')}
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    {t('header.tutorials')}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-center h-11"
                    onClick={() => handleNavigate('/auth')}
                  >
                    {t('header.login')}
                  </Button>
                  <Button 
                    className="w-full justify-center h-11 bg-gradient-primary hover:opacity-90"
                    onClick={() => handleNavigate('/auth?tab=signup')}
                  >
                    {t('header.getStarted')}
                  </Button>
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
