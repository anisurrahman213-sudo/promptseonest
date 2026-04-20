import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Wand2, Copy, Check, AlertTriangle, CheckCircle2, ArrowLeft, Loader2,
  XCircle, ArrowRight, Info, ClipboardCopy, ShieldCheck, Eye, Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ──

interface PromptChecks {
  subject: boolean;
  background: boolean;
  lighting: boolean;
  camera_angle: boolean;
  color_palette: boolean;
  mood: boolean;
  quality: boolean;
  restrictions: boolean;
}

interface FixResult {
  fixed_title: string;
  alt_titles: string[];
  fixed_keywords_array: string[];
  fixed_keywords_str: string;
  fixed_description: string;
  prompt_checks: PromptChecks;
  prompt_suggestions: string[];
  errors_found: number;
  errors_fixed: number;
  title_score: number;
  keyword_score: number;
  description_score: number;
  prompt_score: number;
  total_score: number;
  changes_made: string[];
}

// ── Constants ──

const SPECIAL_CHARS = /[:\-;\/\\,|[\]{}()&@#$%^*!?"'<>~`+=]/;
const COLOR_NAMES = /\b(red|blue|green|orange|yellow|pink|purple|cyan|magenta|lime|brown|grey|gray|black|white|beige|teal|violet|maroon|navy|gold|golden|silver|turquoise|crimson|ivory|coral|amber|indigo|scarlet|emerald|sapphire|ruby|bronze|copper|platinum|chartreuse|fuchsia|khaki|lavender|mauve|ochre|olive|peach|periwinkle|plum|rose|rust|salmon|sienna|slate|tan|taupe|vermillion)\b/gi;
const POWER_WORDS = ["macro", "aerial", "closeup", "detailed", "vibrant", "professional", "stunning", "isolated", "abstract"];

const PROMPT_CHECK_LABELS: Record<keyof PromptChecks, string> = {
  subject: "Subject Clearly Described",
  background: "Background Type Mentioned",
  lighting: "Lighting Type Mentioned",
  camera_angle: "Camera Angle Mentioned",
  color_palette: "Color Palette Mentioned",
  mood: "Mood/Atmosphere Mentioned",
  quality: "Technical Quality (8K/HD)",
  restrictions: "Restrictions (no people/text/watermark)",
};

// ── Live validation helpers ──

function liveTitleIssues(t: string) {
  const issues: { text: string; type: "error" | "warning" }[] = [];
  if (!t) return issues;
  if (SPECIAL_CHARS.test(t)) issues.push({ text: "Special characters detected", type: "error" });
  if (t.length > 70) issues.push({ text: `Too long (${t.length}/70)`, type: "error" });
  if (t.length > 0 && t.length < 50) issues.push({ text: `Too short (${t.length}/50 min)`, type: "warning" });
  const colors = t.match(COLOR_NAMES);
  if (colors) issues.push({ text: `Color names: ${[...new Set(colors)].join(", ")}`, type: "warning" });
  if (!/background|field|sky|studio|scene/i.test(t)) issues.push({ text: "Missing setting/background", type: "warning" });
  const lowerT = t.toLowerCase();
  if (!POWER_WORDS.some(pw => lowerT.includes(pw))) issues.push({ text: "Missing power word", type: "warning" });
  // Check first word is noun
  const firstWord = t.split(" ")[0]?.toLowerCase();
  const adjectives = ["beautiful", "stunning", "amazing", "gorgeous", "lovely", "pretty", "nice", "great", "wonderful"];
  if (adjectives.includes(firstWord)) issues.push({ text: "First word should be subject noun", type: "warning" });
  return issues;
}

function liveKeywordIssues(k: string) {
  const list = k.split(",").map(w => w.trim()).filter(Boolean);
  const multiWord = list.filter(w => w.includes(" "));
  const hyphenated = list.filter(w => w.includes("-"));
  const lowerList = list.map(w => w.toLowerCase());
  const dupes = lowerList.filter((w, i) => lowerList.indexOf(w) !== i);
  const issues: { text: string; type: "error" | "warning" }[] = [];
  if (multiWord.length) issues.push({ text: `${multiWord.length} multi-word`, type: "error" });
  if (hyphenated.length) issues.push({ text: `${hyphenated.length} hyphenated`, type: "error" });
  if (dupes.length) issues.push({ text: `${new Set(dupes).size} duplicates`, type: "warning" });
  if (list.length !== 49 && list.length > 0) issues.push({ text: `${list.length}/49 keywords`, type: list.length > 49 ? "error" : "warning" });
  return { issues, count: list.length };
}

function liveDescIssues(d: string) {
  const issues: { text: string; type: "error" | "warning" }[] = [];
  if (d.length > 0 && d.length < 200) issues.push({ text: `Too short (${d.length}/200 min)`, type: "error" });
  if (d.length > 500) issues.push({ text: `Too long (${d.length}/500 max)`, type: "error" });
  return issues;
}

// ── Component ──

export default function MetadataFixer() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<FixResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const tIssues = useMemo(() => liveTitleIssues(title), [title]);
  const kAnalysis = useMemo(() => liveKeywordIssues(keywords), [keywords]);
  const dIssues = useMemo(() => liveDescIssues(description), [description]);
  const totalLiveIssues = tIssues.length + kAnalysis.issues.length + dIssues.length;

  const handleFix = useCallback(async () => {
    if (!title && !keywords && !description && !prompt) {
      toast.error("Please fill at least one field");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("fix-metadata", {
        body: { title, keywords, description, prompt },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResult(data as FixResult);
      toast.success(`${data.errors_fixed || 0} issues fixed! Score: ${data.total_score}%`);
    } catch (err: any) {
      toast.error(err.message || "Failed to fix metadata");
    } finally {
      setLoading(false);
    }
  }, [title, keywords, description, prompt]);

  const copy = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const copyAll = useCallback(() => {
    if (!result) return;
    const text = `Title: ${result.fixed_title}\n\nKeywords: ${result.fixed_keywords_str}\n\nDescription: ${result.fixed_description}`;
    navigator.clipboard.writeText(text);
    toast.success("All fields copied!");
  }, [result]);

  const score = result?.total_score ?? null;
  const scoreLabel = score === null ? "" : score >= 100 ? "Adobe Stock Ready ✅" : score >= 80 ? "Nearly Perfect" : score >= 60 ? "Almost There" : "Needs Work";
  const scoreColor = score === null ? "" : score >= 100 ? "text-green-500" : score >= 80 ? "text-yellow-500" : score >= 60 ? "text-orange-500" : "text-destructive";
  const progressColor = score === null ? "" : score >= 100 ? "bg-green-500" : score >= 80 ? "bg-yellow-500" : score >= 60 ? "bg-orange-500" : "bg-destructive";

  const fixedKwCount = result?.fixed_keywords_array?.length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-[1440px] mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-lg font-bold truncate flex items-center gap-2">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
              <span className="truncate">Adobe Stock SEO Fixer</span>
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">100% Adobe Stock SEO guideline compliant</p>
          </div>
          {score !== null && (
            <div className="flex items-center gap-2 shrink-0">
              {score >= 100 && (
                <Badge className="bg-green-600 text-white gap-1 text-xs animate-pulse">
                  <ShieldCheck className="h-3 w-3" /> Adobe Stock Ready
                </Badge>
              )}
              <Badge variant={score >= 80 ? "default" : score >= 60 ? "secondary" : "destructive"} className="text-sm font-bold">
                {score}%
              </Badge>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 py-5">
        {/* Compliance Score Bar - TOP CENTER */}
        {score !== null && result && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <span className="text-sm font-semibold">Compliance Score</span>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:gap-4">
                <ScoreBadge label="Title" score={result.title_score} max={25} />
                <ScoreBadge label="Keywords" score={result.keyword_score} max={35} />
                <ScoreBadge label="Description" score={result.description_score} max={25} />
                <ScoreBadge label="Prompt" score={result.prompt_score} max={15} />
                <span className={`text-lg font-bold ${scoreColor} ml-auto sm:ml-0`}>{score}%</span>
              </div>
            </div>
            <div className="relative h-4 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${progressColor}`}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className={`text-xs font-medium ${scoreColor}`}>{scoreLabel}</span>
              <span className="text-xs text-muted-foreground">
                {result.errors_found} issues found → {result.errors_fixed} fixed
              </span>
            </div>
          </motion.div>
        )}

        {/* Live warning strip */}
        {totalLiveIssues > 0 && !result && (title || keywords || description) && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 rounded-lg border border-destructive/20 bg-destructive/5">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">{totalLiveIssues} Live Issues Detected</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tIssues.map((is, i) => <IssueBadge key={`t${i}`} label={`Title: ${is.text}`} type={is.type} />)}
              {kAnalysis.issues.map((is, i) => <IssueBadge key={`k${i}`} label={`Keywords: ${is.text}`} type={is.type} />)}
              {dIssues.map((is, i) => <IssueBadge key={`d${i}`} label={`Desc: ${is.text}`} type={is.type} />)}
            </div>
          </motion.div>
        )}

        {/* Split Screen Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── LEFT: Original Input ── */}
          <div className="space-y-4">
            <SectionHeader color="destructive" label="Original Metadata" icon={<XCircle className="h-4 w-4" />} />

            {/* Title */}
            <FieldBox>
              <FieldLabel label="Title" counter={`${title.length}/70`} counterOk={title.length >= 50 && title.length <= 70} />
              <Input
                placeholder="Paste your title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={tIssues.some(i => i.type === "error") ? "border-destructive/50 focus-visible:ring-destructive/30" : ""}
              />
              <InlineIssues issues={tIssues} />
            </FieldBox>

            {/* Keywords */}
            <FieldBox>
              <FieldLabel label="Keywords" counter={`${kAnalysis.count}/49`} counterOk={kAnalysis.count === 49} />
              <Textarea
                placeholder="Paste comma-separated keywords..."
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                className={`min-h-[110px] ${kAnalysis.issues.some(i => i.type === "error") ? "border-destructive/50 focus-visible:ring-destructive/30" : ""}`}
              />
              <InlineIssues issues={kAnalysis.issues} />
              <KeywordBadges keywords={keywords} />
            </FieldBox>

            {/* Description */}
            <FieldBox>
              <FieldLabel label="Description" counter={`${description.length} chars (200-500)`} counterOk={description.length >= 200 && description.length <= 500} />
              <Textarea
                placeholder="Paste description..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={`min-h-[90px] ${dIssues.some(i => i.type === "error") ? "border-destructive/50 focus-visible:ring-destructive/30" : ""}`}
              />
              <InlineIssues issues={dIssues} />
            </FieldBox>

            {/* Prompt */}
            <FieldBox>
              <FieldLabel label="AI Prompt (optional)" />
              <Textarea
                placeholder="Paste AI generation prompt for validation..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                className="min-h-[80px]"
              />
            </FieldBox>

            <Button onClick={handleFix} disabled={loading} className="w-full h-12 text-base gap-2" size="lg">
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin" />Analyzing & Fixing...</>
              ) : (
                <><Wand2 className="h-5 w-5" />Analyze & Fix All</>
              )}
            </Button>
          </div>

          {/* ── RIGHT: Fixed Output ── */}
          <div className="space-y-4">
            <SectionHeader color="green" label="Fixed Metadata" icon={<CheckCircle2 className="h-4 w-4" />} extra={result && <Badge variant="outline" className="text-green-600 border-green-600/30">{result.errors_fixed} issues fixed</Badge>} />

            {!result && !loading && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                  <ArrowRight className="h-12 w-12 text-muted-foreground/20 mb-3" />
                  <p className="text-muted-foreground font-medium">Fixed metadata appears here</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">Paste metadata on the left and click "Analyze & Fix All"</p>
                </CardContent>
              </Card>
            )}

            {loading && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-24">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
                  <p className="text-muted-foreground font-medium">AI is analyzing & fixing...</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">Applying 100% Adobe Stock SEO rules</p>
                </CardContent>
              </Card>
            )}

            <AnimatePresence>
              {result && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* Success Animation */}
                  {score !== null && score >= 100 && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center"
                    >
                      <span className="text-2xl">🎉</span>
                      <p className="text-green-600 dark:text-green-400 font-bold mt-1">Adobe Stock Ready!</p>
                      <p className="text-xs text-muted-foreground">All metadata is 100% compliant</p>
                    </motion.div>
                  )}

                  {/* Fixed Title */}
                  <FixedField
                    label="Title"
                    value={result.fixed_title}
                    counter={`${result.fixed_title.length}/70 (min 50)`}
                    counterOk={result.fixed_title.length >= 50 && result.fixed_title.length <= 70}
                    copied={copiedField === "Title"}
                    onCopy={() => copy(result.fixed_title, "Title")}
                  />

                  {/* Alt Titles */}
                  {result.alt_titles?.length > 0 && (
                    <Card className="border-border/50">
                      <CardContent className="pt-3 pb-3 space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-medium">3 Alternative Titles</Label>
                        {result.alt_titles.map((at, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 text-xs bg-muted/30 rounded p-2">
                            <span className="flex-1">{at}</span>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] shrink-0" onClick={() => copy(at, `Alt ${i + 1}`)}>
                              {copiedField === `Alt ${i + 1}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Fixed Keywords */}
                  <FixedField
                    label="Keywords"
                    value={result.fixed_keywords_str}
                    counter={`${fixedKwCount}/49`}
                    counterOk={fixedKwCount === 49}
                    copied={copiedField === "Keywords"}
                    onCopy={() => copy(result.fixed_keywords_str, "Keywords")}
                    multiline
                  />

                  {/* Fixed Keyword Badges with Position Groups */}
                  {result.fixed_keywords_array?.length > 0 && (
                    <Card className="border-border/50">
                      <CardContent className="pt-3 pb-3">
                        <div className="space-y-2">
                          <KwGroup label="Primary (1-5)" kws={result.fixed_keywords_array.slice(0, 5)} color="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30" />
                          <KwGroup label="Secondary (6-15)" kws={result.fixed_keywords_array.slice(5, 15)} color="bg-primary/10 text-primary border-primary/30" />
                          <KwGroup label="Style (16-30)" kws={result.fixed_keywords_array.slice(15, 30)} color="bg-muted/60 text-muted-foreground border-border" />
                          <KwGroup label="Concept (31-40)" kws={result.fixed_keywords_array.slice(30, 40)} color="bg-muted/40 text-muted-foreground border-border" />
                          <KwGroup label="Support (41-49)" kws={result.fixed_keywords_array.slice(40, 49)} color="bg-muted/20 text-muted-foreground/70 border-border/50" />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Fixed Description */}
                  <FixedField
                    label="Description"
                    value={result.fixed_description}
                    counter={`${result.fixed_description.length} chars (200-500)`}
                    counterOk={result.fixed_description.length >= 200 && result.fixed_description.length <= 500}
                    copied={copiedField === "Description"}
                    onCopy={() => copy(result.fixed_description, "Description")}
                    multiline
                  />

                  {/* Prompt Quality Checklist — 8 points */}
                  {result.prompt_checks && (
                    <Card>
                      <CardHeader className="pb-2 pt-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          Prompt Quality Checklist (8 Points)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {(Object.keys(PROMPT_CHECK_LABELS) as (keyof PromptChecks)[]).map(key => (
                            <PromptCheckItem key={key} label={PROMPT_CHECK_LABELS[key]} ok={result.prompt_checks[key]} />
                          ))}
                        </div>
                        {result.prompt_suggestions?.length > 0 && (
                          <div className="mt-3 p-2 rounded bg-warning/10 border border-warning/20">
                            <p className="text-xs font-medium text-warning mb-1">💡 Suggestions to improve prompt:</p>
                            <ul className="text-xs text-muted-foreground space-y-0.5">
                              {result.prompt_suggestions.map((s, i) => <li key={i}>• {s}</li>)}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Changes Made */}
                  {result.changes_made?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2 pt-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          Changes Made ({result.changes_made.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="space-y-1 max-h-[200px] overflow-y-auto">
                          {result.changes_made.map((change, i) => (
                            <div key={i} className="text-xs p-2 rounded bg-muted/40 flex items-start gap-2">
                              <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                              <span>{change}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Copy All */}
                  <Button onClick={copyAll} variant="outline" className="w-full gap-2 h-11">
                    <ClipboardCopy className="h-4 w-4" /> Copy All Fixed Metadata
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function SectionHeader({ color, label, icon, extra }: { color: string; label: string; icon?: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <div className={`${color === "green" ? "text-green-500" : "text-destructive"}`}>{icon}</div>
      <h2 className="font-semibold text-lg">{label}</h2>
      {extra && <div className="ml-auto">{extra}</div>}
    </div>
  );
}

function FieldBox({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1.5">{children}</div>;
}

function FieldLabel({ label, counter, counterOk }: { label: string; counter?: string; counterOk?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="font-medium">{label}</Label>
      {counter && <span className={`text-xs font-mono ${counterOk ? "text-green-500" : "text-destructive"}`}>{counter}</span>}
    </div>
  );
}

function InlineIssues({ issues }: { issues: { text: string; type: "error" | "warning" }[] }) {
  if (!issues.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {issues.map((is, i) => (
        <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${is.type === "error" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
          {is.type === "error" ? "❌" : "⚠️"} {is.text}
        </span>
      ))}
    </div>
  );
}

function IssueBadge({ label, type }: { label: string; type: "error" | "warning" }) {
  return (
    <Badge variant="outline" className={`text-[10px] ${type === "error" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-warning/10 text-warning border-warning/20"}`}>
      {label}
    </Badge>
  );
}

function KeywordBadges({ keywords }: { keywords: string }) {
  if (!keywords) return null;
  const list = keywords.split(",").map(w => w.trim()).filter(Boolean);
  if (list.length === 0 || list.length > 60) return null;
  const lowerList = list.map(w => w.toLowerCase());
  return (
    <div className="flex flex-wrap gap-1 mt-1 max-h-[120px] overflow-y-auto">
      {list.map((kw, i) => {
        const isMulti = kw.includes(" ");
        const isHyphen = kw.includes("-");
        const isDupe = lowerList.indexOf(kw.toLowerCase()) !== i;
        const hasIssue = isMulti || isHyphen || isDupe;
        return (
          <span
            key={i}
            className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
              hasIssue
                ? "bg-destructive/10 text-destructive border-destructive/30 font-medium"
                : "bg-muted/50 text-muted-foreground border-border"
            }`}
          >
            {kw}{isMulti && " ⚠"}{isHyphen && " ⚠"}{isDupe && " ⚠"}
          </span>
        );
      })}
    </div>
  );
}

function ScoreBadge({ label, score, max }: { label: string; score: number; max: number }) {
  const ok = score === max;
  return (
    <span className={`text-xs ${ok ? "text-green-500" : "text-muted-foreground"}`}>
      {label}: <span className="font-mono font-semibold">{score}/{max}</span>
    </span>
  );
}

function KwGroup({ label, kws, color }: { label: string; kws: string[]; color: string }) {
  if (!kws.length) return null;
  return (
    <div>
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1 mt-0.5">
        {kws.map((kw, i) => (
          <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${color}`}>{kw}</span>
        ))}
      </div>
    </div>
  );
}

function FixedField({ label, value, counter, counterOk, copied, onCopy, multiline }: {
  label: string; value: string; counter?: string; counterOk?: boolean; copied: boolean; onCopy: () => void; multiline?: boolean;
}) {
  return (
    <Card className="border-green-500/20 bg-green-500/[0.03]">
      <CardContent className="pt-3 pb-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="font-medium text-sm flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />{label}
          </Label>
          <div className="flex items-center gap-2">
            {counter && <span className={`text-xs font-mono ${counterOk ? "text-green-500" : "text-destructive"}`}>{counter}</span>}
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onCopy}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
        <div className={`text-sm bg-green-500/5 rounded p-2.5 border border-green-500/10 ${multiline ? "whitespace-pre-wrap break-words" : ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function PromptCheckItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {ok ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}
