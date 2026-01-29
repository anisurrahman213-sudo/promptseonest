import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type SortOption = 'newest' | 'oldest' | 'name';

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function SearchFilter({ 
  searchQuery, 
  onSearchChange, 
  sortBy, 
  onSortChange 
}: SearchFilterProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('dashboard.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 sm:pl-10 h-10 sm:h-10 text-sm bg-muted/50 border-0 focus-visible:ring-primary/50"
        />
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="shrink-0 h-10 w-10 touch-manipulation active:scale-95 transition-transform"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
            <DropdownMenuRadioItem value="newest" className="py-3">{t('dashboard.newestFirst')}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="oldest" className="py-3">{t('dashboard.oldestFirst')}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="name" className="py-3">{t('dashboard.byName')}</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
