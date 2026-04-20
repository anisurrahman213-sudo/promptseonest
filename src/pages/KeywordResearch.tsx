import { useState, useCallback, useMemo } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Sparkles, Copy, Download, Save, Trash2, Loader2,
  X, Plus, GripVertical, CheckCircle, AlertTriangle, XCircle, FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type Platform = 'adobe_stock' | 'shutterstock' | 'freepik';
type SubjectType = 'animal' | 'nature' | 'food' | 'architecture' | 'technology' | 'people' | 'abstract' | 'landscape' | 'other';

const SUBJECT_TYPES: { value: SubjectType; label: string; icon: string }[] = [
  { value: 'animal', label: 'Animal / Insect', icon: '🐛' },
  { value: 'nature', label: 'Nature / Plant', icon: '🌿' },
  { value: 'food', label: 'Food / Beverage', icon: '🍎' },
  { value: 'architecture', label: 'Architecture / City', icon: '🏙️' },
  { value: 'technology', label: 'Technology / Industry', icon: '⚡' },
  { value: 'people', label: 'People / Portrait', icon: '👤' },
  { value: 'abstract', label: 'Abstract / Pattern', icon: '🎨' },
  { value: 'landscape', label: 'Landscape / Travel', icon: '🌍' },
  { value: 'other', label: 'Other', icon: '📦' },
];

const PLATFORM_LIMITS: Record<Platform, number> = {
  adobe_stock: 49,
  shutterstock: 50,
  freepik: 30,
};

interface KeywordResult {
  primary: string[];
  secondary: string[];
  supporting: string[];
  total: number;
  platform: string;
}

// Sortable keyword tag
function SortableKeywordTag({ keyword, category, onRemove }: {
  keyword: string; category: 'primary' | 'secondary' | 'supporting'; onRemove: (kw: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: keyword });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const isValid = /^[a-z]+$/i.test(keyword) && !keyword.includes(' ') && !keyword.includes('-');
  const colorClass = !isValid
    ? 'bg-destructive/15 text-destructive border-destructive/30'
    : category === 'primary'
    ? 'bg-red-500/15 text-red-400 border-red-500/30'
    : category === 'secondary'
    ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-sm font-medium cursor-grab active:cursor-grabbing ${colorClass}`}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-3 w-3 opacity-40" />
      {keyword}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(keyword); }}
        className="ml-0.5 hover:opacity-80"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

export default function KeywordResearch() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [subject, setSubject] = useState('');
  const [subjectType, setSubjectType] = useState<SubjectType>('animal');
  const [platform, setPlatform] = useState<Platform>('adobe_stock');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<KeywordResult | null>(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Editable keyword arrays
  const [primaryKw, setPrimaryKw] = useState<string[]>([]);
  const [secondaryKw, setSecondaryKw] = useState<string[]>([]);
  const [supportingKw, setSupportingKw] = useState<string[]>([]);

  const allKeywords = useMemo(() => [...primaryKw, ...secondaryKw, ...supportingKw], [primaryKw, secondaryKw, supportingKw]);
  const totalCount = allKeywords.length;
  const maxCount = PLATFORM_LIMITS[platform];
  const duplicates = useMemo(() => {
    const seen = new Set<string>();
    const dups = new Set<string>();
    allKeywords.forEach(k => { if (seen.has(k)) dups.add(k); seen.add(k); });
    return dups;
  }, [allKeywords]);

  // DnD
  const sensors = useSensors(
    // Mouse: small distance threshold for desktop drag
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    // Touch: long-press (250ms) before drag activates so vertical scroll keeps working on mobile
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Saved keyword sets
  const { data: savedSets, isLoading: setsLoading } = useQuery({
    queryKey: ['keyword-sets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('keyword_sets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Generate keywords
  const handleGenerate = useCallback(async () => {
    if (!subject.trim()) { toast.error('Please enter a subject'); return; }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('keyword-research', {
        body: { subject: subject.trim(), subject_type: subjectType, platform },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data);
      setPrimaryKw(data.primary || []);
      setSecondaryKw(data.secondary || []);
      setSupportingKw(data.supporting || []);
      setSaveName(`${subject.trim()} — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);
      toast.success(`Generated ${data.total} keywords successfully`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to generate keywords');
    } finally {
      setIsGenerating(false);
    }
  }, [subject, subjectType, platform]);

  // Remove keyword
  const removeKeyword = useCallback((kw: string) => {
    setPrimaryKw(p => p.filter(k => k !== kw));
    setSecondaryKw(p => p.filter(k => k !== kw));
    setSupportingKw(p => p.filter(k => k !== kw));
  }, []);

  // Add keyword
  const addKeyword = useCallback(() => {
    const cleaned = newKeyword.toLowerCase().trim();
    if (!cleaned) return;

    // Multi-word check
    if (cleaned.includes(' ')) {
      const words = cleaned.split(/\s+/).filter(Boolean);
      toast.info(`"${cleaned}" split into ${words.length} words`, { duration: 3000 });
      const existing = new Set(allKeywords);
      const toAdd = words.filter(w => !existing.has(w));
      setSupportingKw(p => [...p, ...toAdd]);
      setNewKeyword('');
      return;
    }

    // Hyphen check
    const noHyphen = cleaned.replace(/-/g, '');
    if (cleaned.includes('-')) {
      toast.info(`Converted "${cleaned}" to "${noHyphen}"`, { duration: 3000 });
    }

    if (allKeywords.includes(noHyphen)) {
      toast.warning(`"${noHyphen}" is already in the list`);
      setNewKeyword('');
      return;
    }

    setSupportingKw(p => [...p, noHyphen]);
    setNewKeyword('');
  }, [newKeyword, allKeywords]);

  // DnD handler (within same category only for simplicity)
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const moveInArray = (arr: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
      const oldIdx = arr.indexOf(active.id as string);
      const newIdx = arr.indexOf(over.id as string);
      if (oldIdx !== -1 && newIdx !== -1) {
        setter(arrayMove(arr, oldIdx, newIdx));
      }
    };

    moveInArray(primaryKw, setPrimaryKw);
    moveInArray(secondaryKw, setSecondaryKw);
    moveInArray(supportingKw, setSupportingKw);
  }, [primaryKw, secondaryKw, supportingKw]);

  // Copy functions
  const copyAll = () => {
    navigator.clipboard.writeText(allKeywords.join(', '));
    toast.success(`Copied ${totalCount} keywords to clipboard`);
  };

  const copyForPlatform = (p: Platform) => {
    const limit = PLATFORM_LIMITS[p];
    const kws = allKeywords.slice(0, limit);
    navigator.clipboard.writeText(kws.join(', '));
    toast.success(`Copied ${kws.length} keywords for ${p.replace('_', ' ')}`);
  };

  // Save to database
  const handleSave = async () => {
    if (!user) { toast.error('Please sign in to save'); return; }
    if (!saveName.trim()) { toast.error('Please enter a name for this set'); return; }
    setIsSaving(true);
    try {
      const { error } = await supabase.from('keyword_sets').insert({
        user_id: user.id,
        name: saveName.trim(),
        subject: subject.trim(),
        subject_type: subjectType,
        platform,
        primary_keywords: primaryKw,
        secondary_keywords: secondaryKw,
        supporting_keywords: supportingKw,
        total_count: totalCount,
      });
      if (error) throw error;
      toast.success('Keyword set saved successfully');
      queryClient.invalidateQueries({ queryKey: ['keyword-sets'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // Load saved set
  const loadSet = (set: any) => {
    setPrimaryKw(set.primary_keywords || []);
    setSecondaryKw(set.secondary_keywords || []);
    setSupportingKw(set.supporting_keywords || []);
    setSubject(set.subject);
    setSubjectType(set.subject_type);
    setPlatform(set.platform);
    setSaveName(set.name);
    setResult({ primary: set.primary_keywords, secondary: set.secondary_keywords, supporting: set.supporting_keywords, total: set.total_count, platform: set.platform });
    toast.success(`Loaded "${set.name}"`);
  };

  // Delete saved set
  const deleteSet = async (id: string) => {
    const { error } = await supabase.from('keyword_sets').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Deleted');
    queryClient.invalidateQueries({ queryKey: ['keyword-sets'] });
  };

  if (authLoading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth" replace />;

  const complianceScore = (() => {
    let score = 0;
    if (totalCount === maxCount) score += 40;
    else if (totalCount > 0) score += Math.round((totalCount / maxCount) * 30);
    if (duplicates.size === 0) score += 30;
    const invalidCount = allKeywords.filter(k => !/^[a-z]+$/i.test(k)).length;
    if (invalidCount === 0) score += 30;
    else score += Math.max(0, 30 - invalidCount * 5);
    return score;
  })();

  return (
    <>
      <SEOHead title="Keyword Research — PromptSEONest" description="Generate optimised keywords for stock photography platforms" path="/keyword-research" />
      <Header />
      <main className="container py-8 max-w-5xl space-y-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl md:text-4xl font-bold">
            <Search className="inline-block h-8 w-8 mr-2 text-primary" />
            Keyword Research
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Generate the optimal keywords for any subject, precisely ranked by search relevance for major stock platforms
          </p>
        </div>

        {/* SECTION 1: Input */}
        <Card className="border-primary/20">
          <CardContent className="pt-6 space-y-4">
            <Input
              placeholder="Enter subject (e.g. caterpillar, solar panel, broccoli, cityscape...)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-lg h-12"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <Select value={subjectType} onValueChange={(v) => setSubjectType(v as SubjectType)}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECT_TYPES.map(st => (
                    <SelectItem key={st.value} value={st.value}>
                      {st.icon} {st.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Tabs value={platform} onValueChange={(v) => setPlatform(v as Platform)} className="w-full sm:flex-1 sm:w-auto min-w-0">
                <TabsList className="w-full grid grid-cols-3 h-auto">
                  <TabsTrigger value="adobe_stock" className="text-xs sm:text-sm px-1 sm:px-3 py-2 truncate">Adobe Stock</TabsTrigger>
                  <TabsTrigger value="shutterstock" className="text-xs sm:text-sm px-1 sm:px-3 py-2 truncate">Shutterstock</TabsTrigger>
                  <TabsTrigger value="freepik" className="text-xs sm:text-sm px-1 sm:px-3 py-2 truncate">Freepik</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !subject.trim()}
              className="w-full h-12 text-base gap-2 bg-gradient-primary hover:opacity-90"
              size="lg"
            >
              {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {isGenerating ? 'Analysing & Generating...' : 'Analyse & Generate Keywords'}
            </Button>
          </CardContent>
        </Card>

        {/* Loading skeleton */}
        {isGenerating && (
          <div className="grid gap-4 md:grid-cols-3">
            {[1,2,3].map(i => (
              <Card key={i}>
                <CardContent className="pt-6 space-y-3">
                  <Skeleton className="h-5 w-40" />
                  <div className="flex flex-wrap gap-2">
                    {Array.from({length: i === 1 ? 7 : i === 2 ? 12 : 8}).map((_,j) => (
                      <Skeleton key={j} className="h-7 w-20 rounded-lg" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* SECTION 2+3: Results */}
        {result && !isGenerating && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="space-y-4">
              {/* Live counter */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border">
                <div className="flex items-center gap-2">
                  {totalCount === maxCount ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : totalCount > maxCount ? (
                    <XCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                  <span className="font-medium">
                    {totalCount}/{maxCount} keywords
                    {totalCount === maxCount && ' ✅ Platform Ready'}
                    {totalCount > maxCount && ` ❌ ${totalCount - maxCount} over limit`}
                    {totalCount < maxCount && ` — ${maxCount - totalCount} more needed`}
                  </span>
                </div>
                <Badge variant={complianceScore >= 90 ? 'default' : complianceScore >= 60 ? 'secondary' : 'destructive'}>
                  Score: {complianceScore}/100
                </Badge>
              </div>

              {/* 3 panels */}
              <div className="grid gap-4 md:grid-cols-3">
                <KeywordPanel
                  title="Primary — Highest Priority"
                  icon="🔴"
                  description="These words rank highest in search"
                  keywords={primaryKw}
                  category="primary"
                  onRemove={removeKeyword}
                  duplicates={duplicates}
                />
                <KeywordPanel
                  title="Secondary — Medium Priority"
                  icon="🟡"
                  description="Descriptive and technical words"
                  keywords={secondaryKw}
                  category="secondary"
                  onRemove={removeKeyword}
                  duplicates={duplicates}
                />
                <KeywordPanel
                  title="Supporting — Lower Priority"
                  icon="🟢"
                  description="Concept and use-case words"
                  keywords={supportingKw}
                  category="supporting"
                  onRemove={removeKeyword}
                  duplicates={duplicates}
                />
              </div>

              {/* SECTION 4: Keyword Editor */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Add Custom Keyword</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type keyword here..."
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                      className="flex-1"
                    />
                    <Button onClick={addKeyword} disabled={!newKeyword.trim()} className="gap-1.5">
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                  {duplicates.size > 0 && (
                    <p className="text-xs text-destructive mt-2">
                      ⚠️ {duplicates.size} duplicate{duplicates.size > 1 ? 's' : ''} detected: {[...duplicates].join(', ')}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* SECTION 6: Export */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Export Keywords</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={copyAll} className="gap-1.5">
                      <Copy className="h-4 w-4" /> Copy All {totalCount} Keywords
                    </Button>
                    <Button variant="outline" onClick={() => copyForPlatform('adobe_stock')} className="gap-1.5">
                      <Download className="h-4 w-4" /> Adobe Stock ({Math.min(totalCount, 49)})
                    </Button>
                    <Button variant="outline" onClick={() => copyForPlatform('shutterstock')} className="gap-1.5">
                      <Download className="h-4 w-4" /> Shutterstock ({Math.min(totalCount, 50)})
                    </Button>
                    <Button variant="outline" onClick={() => copyForPlatform('freepik')} className="gap-1.5">
                      <Download className="h-4 w-4" /> Freepik ({Math.min(totalCount, 30)})
                    </Button>
                  </div>

                  {/* Save */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Input
                      placeholder="Keyword set name..."
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleSave} disabled={isSaving || !saveName.trim()} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DndContext>
        )}

        {/* SECTION 7: Saved Sets */}
        {savedSets && savedSets.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              Your Saved Keyword Sets
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {savedSets.map((set: any) => (
                <Card key={set.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{set.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {set.total_count} keywords • {set.platform.replace('_', ' ')} • {new Date(set.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => loadSet(set)} className="gap-1">
                        <FolderOpen className="h-3 w-3" /> Load
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        const all = [...(set.primary_keywords || []), ...(set.secondary_keywords || []), ...(set.supporting_keywords || [])];
                        navigator.clipboard.writeText(all.join(', '));
                        toast.success('Copied');
                      }} className="gap-1">
                        <Copy className="h-3 w-3" /> Copy
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteSet(set.id)} className="gap-1 text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

// Keyword panel component
function KeywordPanel({ title, icon, description, keywords, category, onRemove, duplicates }: {
  title: string; icon: string; description: string; keywords: string[];
  category: 'primary' | 'secondary' | 'supporting';
  onRemove: (kw: string) => void; duplicates: Set<string>;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <span>{icon}</span> {title}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <SortableContext items={keywords} strategy={horizontalListSortingStrategy}>
          <div className="flex flex-wrap gap-1.5">
            <AnimatePresence>
              {keywords.map(kw => (
                <SortableKeywordTag
                  key={kw}
                  keyword={kw}
                  category={duplicates.has(kw) ? 'primary' : category}
                  onRemove={onRemove}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
        <p className="text-xs text-muted-foreground mt-2">{keywords.length} keywords</p>
      </CardContent>
    </Card>
  );
}
