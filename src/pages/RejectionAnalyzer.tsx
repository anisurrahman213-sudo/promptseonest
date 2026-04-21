import { useState } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2, Loader2, Lightbulb, ShieldAlert, Sparkles, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Analysis {
  category: string;
  severity: 'low' | 'medium' | 'high';
  summary: string;
  suggestions: string[];
  avoid_in_future: string[];
  confidence: number;
}

const CATEGORY_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  quality_technical: { label: 'Quality / Technical', emoji: '🔍', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  trademark_ip: { label: 'Trademark / IP', emoji: '⚖️', color: 'bg-red-500/10 text-red-600 border-red-500/30' },
  similar_content: { label: 'Similar Content', emoji: '🔁', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
  model_property_release: { label: 'Model / Property Release', emoji: '📝', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  metadata_keywords: { label: 'Metadata / Keywords', emoji: '🏷️', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30' },
  content_policy: { label: 'Content Policy', emoji: '🚫', color: 'bg-rose-500/10 text-rose-600 border-rose-500/30' },
  composition: { label: 'Composition', emoji: '🖼️', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  commercial_value: { label: 'Commercial Value', emoji: '💰', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  other: { label: 'Other', emoji: '❓', color: 'bg-muted text-muted-foreground border-border' },
};

const SEVERITY_COLORS = {
  low: 'bg-green-500/10 text-green-600 border-green-500/30',
  medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  high: 'bg-red-500/10 text-red-600 border-red-500/30',
};

export default function RejectionAnalyzer() {
  const { user, loading } = useAuth();
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth" replace />;

  const handleAnalyze = async () => {
    if (text.trim().length < 10) {
      toast.error('Please paste at least 10 characters of the rejection email');
      return;
    }
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-rejection', {
        body: { rejectionText: text.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data.analysis);
      toast.success('Analysis complete!');
    } catch (e: any) {
      toast.error(e.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const copyReport = () => {
    if (!analysis) return;
    const cat = CATEGORY_LABELS[analysis.category] || CATEGORY_LABELS.other;
    const report = `Stock Rejection Analysis
Category: ${cat.label}
Severity: ${analysis.severity.toUpperCase()}
Confidence: ${analysis.confidence}%

Summary: ${analysis.summary}

✅ Suggestions:
${analysis.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

⚠️ Avoid in future:
${analysis.avoid_in_future.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    navigator.clipboard.writeText(report);
    toast.success('Report copied!');
  };

  const cat = analysis ? (CATEGORY_LABELS[analysis.category] || CATEGORY_LABELS.other) : null;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Rejection Analyzer — Adobe Stock"
        description="AI-powered Adobe Stock rejection email analyzer. Understand why your content was rejected and get actionable suggestions."
        path="/rejection-analyzer"
      />
      <Header />
      <main className="container py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Rejection Analyzer</h1>
            <p className="text-muted-foreground">Paste your Adobe Stock rejection email — get AI insights & fixes</p>
          </div>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Paste Rejection Email
            </CardTitle>
            <CardDescription>
              Copy the rejection message from Adobe Stock, Shutterstock, Freepik, or any microstock platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Example: 'Your submission was rejected due to focus or noise issues. Please ensure your image is sharp...'"
              rows={8}
              maxLength={8000}
              className="font-mono text-sm"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{text.length} / 8000 characters</span>
              <Button onClick={handleAnalyze} disabled={analyzing || text.trim().length < 10} className="gap-2">
                {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {analyzing ? 'Analyzing...' : 'Analyze Rejection'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {analysis && cat && (
          <Card className="mt-6 border-primary/30">
            <CardHeader>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{cat.emoji}</span>
                  <div>
                    <Badge className={`${cat.color} border`} variant="outline">{cat.label}</Badge>
                    <CardTitle className="text-xl mt-2">{analysis.summary}</CardTitle>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={copyReport} className="gap-2">
                  <Copy className="h-4 w-4" />Copy Report
                </Button>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Badge className={`${SEVERITY_COLORS[analysis.severity]} border`} variant="outline">
                  Severity: {analysis.severity.toUpperCase()}
                </Badge>
                <Badge variant="outline">Confidence: {analysis.confidence}%</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3 text-success">
                  <CheckCircle2 className="h-5 w-5" />
                  How to Fix This
                </h3>
                <ul className="space-y-2">
                  {analysis.suggestions.map((s, i) => (
                    <li key={i} className="flex gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
                      <Lightbulb className="h-5 w-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Avoid in Future Submissions
                </h3>
                <ul className="space-y-2">
                  {analysis.avoid_in_future.map((s, i) => (
                    <li key={i} className="flex gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <span className="text-sm">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Pro tip:</strong> Track your rejected images in the <a href="/submission-tracker" className="underline text-primary">Submission Tracker</a> to spot patterns over time.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
