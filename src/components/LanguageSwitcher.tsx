import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { languages, LanguageCode } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (code: LanguageCode) => {
    i18n.changeLanguage(code);
    
    // Update document direction for RTL languages
    const lang = languages.find(l => l.code === code);
    if (lang) {
      document.documentElement.dir = lang.dir;
      document.documentElement.lang = code;
    }
    
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 h-9 px-2.5">
          <span className="text-base">{currentLanguage.flag}</span>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 max-h-80 overflow-y-auto bg-popover border border-border shadow-lg z-50"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{lang.flag}</span>
              <span>{lang.name}</span>
            </div>
            {i18n.language === lang.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSwitcher;
