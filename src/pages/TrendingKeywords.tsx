import { useState } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Sparkles, Calendar, Flame, AlertOctagon, Copy, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Trends {
  trending_themes: Array<{ title: string; description: string; demand_score: number; best_keywords: string[]; reason: string }>;
  upcoming_events: Array<{ event: string; date: string; keywords: string[] }>;
  evergreen_topics: string[];
  avoid_oversaturated: string[];
}

export default function TrendingKeywords() {
  const { user, loading } = useAuth();
  const [niche, setNiche] = useState('');
  const [busy, setBusy] = useState(false);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth" replace />;

  const generate = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('trending-keywords', {
        body: { niche: niche.trim() || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setTrends(data.trends);
      setGeneratedAt(data.generated_at);
      toast.success('Trending themes ready!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to fetch trends');
    } finally {
      setBusy(false);
    }
  };

  const copyKeywords = (keywords: string[]) => {
    navigator.clipboard.writeText(keywords.join(', '));
    toast.success('Keywords copied!');
  };

  const demandColor = (score: number) => {
    if (score >= 80) return 'bg-red-500/15 text-red-600 border-red-500/30';
    if (score >= 60) return 'bg-orange-500/15 text-orange-600 border-orange-500/30';
    if (score >= 40) return 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30';
    return 'bg-blue-500/15 text-blue-600 border-blue-500/30';
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Trending Keywords — Stock Market Demand"
        description="AI-powered trending stock photography themes & keywords. Discover what stock buyers are searching for right now."
        path="/trending-keywords"
      />
      <Header />
      <main className="container py-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Trending Keywords</h1>
            <p className="text-muted-foreground">AI-powered market demand insights for stock contributors</p>
          </div>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Get Today's Trends
            </CardTitle>
            <CardDescription>Optionally narrow by niche (e.g. "business", "lifestyle", "AI tech", "Bangladesh culture")</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Input
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g. business, lifestyle, AI tech (optional)"
                className="flex-1 min-w-[200px]"
                maxLength={80}
              />
              <Button onClick={generate} disabled={busy} className="gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : trends ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                {busy ? 'Analyzing market...' : trends ? 'Refresh' : 'Generate Trends'}
              </Button>
            </div>
            {generatedAt && (
              <p className="text-xs text-muted-foreground mt-3">Generated {new Date(generatedAt).toLocaleString()}</p>
            )}
          </CardContent>
        </Card>

        {trends && (
          <div className="space-y-6 mt-6">
            {/* Trending themes */}
            <div>
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Hot Themes — High Demand Now
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {trends.trending_themes.sort((a, b) => b.demand_score - a.demand_score).map((t, i) => (
                  <Card key={i} className="hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{t.title}</CardTitle>
                        <Badge className={`${demandColor(t.demand_score)} border shrink-0`} variant="outline">
                          {t.demand_score}/100
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">{t.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {t.best_keywords.map((k, j) => (
                          <Badge key={j} variant="secondary" className="text-xs">{k}</Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground italic">💡 {t.reason}</p>
                      <Button size="sm" variant="ghost" className="w-full gap-2" onClick={() => copyKeywords(t.best_keywords)}>
                        <Copy className="h-3 w-3" />Copy keywords
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Upcoming events */}
            <div>
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Upcoming Events & Holidays (next 60 days)
              </h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {trends.upcoming_events.map((e, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{e.event}</CardTitle>
                      <CardDescription className="text-xs">{e.date}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-1">
                        {e.keywords.map((k, j) => (
                          <Badge key={j} variant="outline" className="text-xs">{k}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Evergreen */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-success">
                    <TrendingUp className="h-4 w-4" />Evergreen Topics
                  </CardTitle>
                  <CardDescription>Always in demand</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {trends.evergreen_topics.map((t, i) => (
                      <Badge key={i} className="bg-success/10 text-success border-success/30" variant="outline">{t}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-destructive">
                    <AlertOctagon className="h-4 w-4" />Avoid (Oversaturated)
                  </CardTitle>
                  <CardDescription>Hard to rank — skip these</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {trends.avoid_oversaturated.map((t, i) => (
                      <Badge key={i} className="bg-destructive/10 text-destructive border-destructive/30" variant="outline">{t}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
