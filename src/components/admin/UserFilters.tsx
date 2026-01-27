import { useState } from 'react';
import { Search, Filter, X, Calendar, CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface UserFilters {
  search: string;
  minCredits: number | null;
  maxCredits: number | null;
  startDate: Date | null;
  endDate: Date | null;
}

interface UserFiltersProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
}

export function UserFiltersComponent({ filters, onFiltersChange }: UserFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount = [
    filters.minCredits !== null || filters.maxCredits !== null,
    filters.startDate !== null || filters.endDate !== null,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      minCredits: null,
      maxCredits: null,
      startDate: null,
      endDate: null,
    });
  };

  const clearDateFilter = () => {
    onFiltersChange({
      ...filters,
      startDate: null,
      endDate: null,
    });
  };

  const clearCreditsFilter = () => {
    onFiltersChange({
      ...filters,
      minCredits: null,
      maxCredits: null,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => onFiltersChange({ ...filters, search: '' })}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filter Button */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    Clear all
                  </Button>
                )}
              </div>

              {/* Credits Range */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Credits Range</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minCredits ?? ''}
                    onChange={(e) => onFiltersChange({
                      ...filters,
                      minCredits: e.target.value ? parseInt(e.target.value) : null,
                    })}
                    className="h-9"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxCredits ?? ''}
                    onChange={(e) => onFiltersChange({
                      ...filters,
                      maxCredits: e.target.value ? parseInt(e.target.value) : null,
                    })}
                    className="h-9"
                  />
                </div>
                {/* Quick filters */}
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onFiltersChange({ ...filters, minCredits: 0, maxCredits: 10 })}
                  >
                    0-10
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onFiltersChange({ ...filters, minCredits: 11, maxCredits: 100 })}
                  >
                    11-100
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onFiltersChange({ ...filters, minCredits: 101, maxCredits: 1000 })}
                  >
                    101-1000
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onFiltersChange({ ...filters, minCredits: 1001, maxCredits: null })}
                  >
                    1000+
                  </Button>
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Signup Date</Label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-9 justify-start text-left font-normal text-xs",
                          !filters.startDate && "text-muted-foreground"
                        )}
                      >
                        {filters.startDate ? format(filters.startDate, "PP") : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.startDate ?? undefined}
                        onSelect={(date) => onFiltersChange({ ...filters, startDate: date ?? null })}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-9 justify-start text-left font-normal text-xs",
                          !filters.endDate && "text-muted-foreground"
                        )}
                      >
                        {filters.endDate ? format(filters.endDate, "PP") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.endDate ?? undefined}
                        onSelect={(date) => onFiltersChange({ ...filters, endDate: date ?? null })}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Quick date filters */}
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      const today = new Date();
                      const weekAgo = new Date(today);
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      onFiltersChange({ ...filters, startDate: weekAgo, endDate: today });
                    }}
                  >
                    Last 7 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      const today = new Date();
                      const monthAgo = new Date(today);
                      monthAgo.setMonth(monthAgo.getMonth() - 1);
                      onFiltersChange({ ...filters, startDate: monthAgo, endDate: today });
                    }}
                  >
                    Last 30 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      const today = new Date();
                      const threeMonthsAgo = new Date(today);
                      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                      onFiltersChange({ ...filters, startDate: threeMonthsAgo, endDate: today });
                    }}
                  >
                    Last 3 months
                  </Button>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                Apply Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {(filters.minCredits !== null || filters.maxCredits !== null) && (
            <Badge variant="secondary" className="gap-1">
              Credits: {filters.minCredits ?? '0'} - {filters.maxCredits ?? '∞'}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={clearCreditsFilter}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {(filters.startDate || filters.endDate) && (
            <Badge variant="secondary" className="gap-1">
              Date: {filters.startDate ? format(filters.startDate, "MMM d") : 'Any'} - {filters.endDate ? format(filters.endDate, "MMM d") : 'Now'}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={clearDateFilter}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

export function filterUsers(users: any[], filters: UserFilters) {
  return users.filter((user) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesName = user.full_name?.toLowerCase().includes(searchLower);
      const matchesEmail = user.email?.toLowerCase().includes(searchLower);
      if (!matchesName && !matchesEmail) return false;
    }

    // Credits filter
    if (filters.minCredits !== null && user.credits < filters.minCredits) return false;
    if (filters.maxCredits !== null && user.credits > filters.maxCredits) return false;

    // Date filter
    if (filters.startDate || filters.endDate) {
      const userDate = user.created_at ? new Date(user.created_at) : null;
      if (!userDate) return false;
      if (filters.startDate && userDate < filters.startDate) return false;
      if (filters.endDate) {
        const endOfDay = new Date(filters.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (userDate > endOfDay) return false;
      }
    }

    return true;
  });
}
