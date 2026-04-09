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
  XCircle, ArrowRight, Info, ClipboardCopy, ShieldCheck, Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface PromptChecks {
  white_background: boolean;
  lighting: boolean;
  camera_angle: boolean;
  color_palette: boolean;
  mood: boolean;
}

interface FixError {
  field: string;
  type: "error" | "warning";
  original: string;
  fixed: string;
  reason: string;
}

interface FixResult {
  title: string;
  alt_titles?: string[];
  keywords: string;
  description: string;
  prompt_checks?: PromptChecks;
  errors?: FixError[];
  compliance_score?: number;
}

// ── Local live analysis ──

const SPECIAL_CHARS = /[:\-;\/\\,|[\]{}()&@#$%^*!?"'<>~`+=]/;
const COLOR_NAMES = /\b(red|blue|green|orange|yellow|pink|purple|cyan|magenta|lime|brown|grey|gray|black|white|beige|teal|violet|maroon|navy|gold|silver|turquoise|crimson|ivory|coral|amber|indigo|scarlet|emerald|sapphire|ruby|bronze|copper|platinum|chartreuse|fuchsia|khaki|lavender|mauve|ochre|olive|peach|periwinkle|plum|rose|rust|salmon|sienna|slate|tan|taupe|vermillion)\b/gi;

function liveTitleIssues(t: string) {
  const issues: { text: string; type: "error" | "warning" }[] = [];
  if (!t) return issues;
  if (SPECIAL_CHARS.test(t)) issues.push({ text: "Special characters detected", type: "error" });
  if (t.length > 70) issues.push({ text: `Too long (${t.length}/70)`, type: "error" });
  const colors = t.match(COLOR_NAMES);
  if (colors) issues.push({ text: `Color names: ${[...new Set(colors)].join(", ")}`, type: "warning" });
  if (!/background/i.test(t)) issues.push({ text: "Missing background type", type: "warning" });
  return issues;
}

function liveKeywordIssues(k: string) {
  const list = k.split(",").map((w) => w.trim()).filter(Boolean);
  const multiWord = list.filter((w) => w.includes(" "));
  const hyphenated = list.filter((w) => w.includes("-"));
  const lowerList = list.map((w) => w.toLowerCase());
  const dupes = lowerList.filter((w, i) => lowerList.indexOf(w) !== i);
  const issues: { text: string; type: "error" | "warning"; words?: string[] }[] = [];
  if (multiWord.length) issues.push({ text: `${multiWord.length} multi-word`, type: "error", words: multiWord });
  if (hyphenated.length) issues.push({ text: `${hyphenated.length} hyphenated`, type: "error", words: hyphenated });
  if (dupes.length) issues.push({ text: `${new Set(dupes).size} duplicates`, type: "warning", words: [...new Set(dupes)] });
  if (list.length !== 49) issues.push({ text: `${list.length}/49 keywords`, type: list.length > 49 ? "error" : "warning" });
  return { issues, count: list.length, multiWord, hyphenated, dupes: [...new Set(dupes)] };
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
  const [errors, setErrors] = useState<FixError[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [promptChecks, setPromptChecks] = useState<PromptChecks | null>(null);
  const [altTitles, setAltTitles] = useState<string[]>([]);
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
    setErrors([]);
    setScore(null);
    setPromptChecks(null);
    setAltTitles([]);
    try {
      const { data, error } = await supabase.functions.invoke("fix-metadata", {
        body: { title, keywords, description, prompt },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResult({ title: data.title, keywords: data.keywords, description: data.description });
      setErrors(data.errors || []);
      setScore(data.compliance_score ?? null);
      setPromptChecks(data.prompt_checks ?? null);
      setAltTitles(data.alt_titles || []);
      toast.success(`${data.errors?.length || 0} issues fixed! Score: ${data.compliance_score}%`);
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
    const text = `Title: ${result.title}\n\nKeywords: ${result.keywords}\n\nDescription: ${result.description}`;
    navigator.clipboard.writeText(text);
    toast.success("All fields copied!");
  }, [result]);

  const fixedKwCount = result ? result.keywords.split(",").map((w) => w.trim()).filter(Boolean).length : 0;

  const errorCount = errors.filter((e) => e.type === "error").length;
  const warningCount = errors.filter((e) => e.type === "warning").length;

  // Highlight problematic keywords in input
  const renderKeywordBadges = () => {
    if (!keywords) return null;
    const list = keywords.split(",").map((w) => w.trim()).filter(Boolean);
    const lowerList = list.map((w) => w.toLowerCase());
    return (
      <div className="flex flex-wrap gap-1 mt-1.5 max-h-[120px] overflow-y-auto">
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
              {kw}
              {isMulti && " ⚠ multi"}
              {isHyphen && " ⚠ hyphen"}
              {isDupe && " ⚠ dupe"}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">Adobe Stock Metadata Validator & Fixer</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Fix titles, keywords, descriptions — Adobe Stock compliant</p>
          </div>
          {score !== null && (
            <div className="flex items-center gap-2 shrink-0">
              {score === 100 && (
                <Badge className="bg-green-600 text-white gap-1 text-xs">
                  <ShieldCheck className="h-3 w-3" /> Adobe Stock Ready
                </Badge>
              )}
              <Badge variant={score >= 80 ? "default" : score >= 50 ? "secondary" : "destructive"} className="text-sm font-bold">
                {score}%
              </Badge>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-5">
        {/* Compliance Score Bar */}
        {score !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium">Compliance Score</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-destructive flex items-center gap-1"><XCircle className="h-3 w-3" />{errorCount} errors</span>
                <span className="text-xs text-warning flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{warningCount} warnings</span>
                <span className={`text-sm font-bold ${score >= 80 ? "text-green-500" : score >= 50 ? "text-warning" : "text-destructive"}`}>{score}%</span>
              </div>
            </div>
            <Progress value={score} className="h-3" />
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── LEFT: Original ── */}
          <div className="space-y-4">
            <SectionHeader color="destructive" label="Original Metadata" />

            {/* Title */}
            <FieldBox>
              <FieldLabel label="Title" counter={`${title.length}/70`} counterOk={title.length > 0 && title.length <= 70} />
              <Input
                placeholder="Paste your title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={tIssues.some((i) => i.type === "error") ? "border-destructive/50 focus-visible:ring-destructive/30" : ""}
              />
              <InlineIssues issues={tIssues} />
            </FieldBox>

            {/* Keywords */}
            <FieldBox>
              <FieldLabel label="Keywords" counter={`${kAnalysis.count}/49`} counterOk={kAnalysis.count === 49} />
              <Textarea
                placeholder="Paste comma-separated keywords..."
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className={`min-h-[100px] ${kAnalysis.issues.some((i) => i.type === "error") ? "border-destructive/50 focus-visible:ring-destructive/30" : ""}`}
              />
              <InlineIssues issues={kAnalysis.issues} />
              {renderKeywordBadges()}
            </FieldBox>

            {/* Description */}
            <FieldBox>
              <FieldLabel label="Description" counter={`${description.length}/200-500`} counterOk={description.length >= 200 && description.length <= 500} />
              <Textarea
                placeholder="Paste description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`min-h-[80px] ${dIssues.some((i) => i.type === "error") ? "border-destructive/50 focus-visible:ring-destructive/30" : ""}`}
              />
              <InlineIssues issues={dIssues} />
            </FieldBox>

            {/* Prompt */}
            <FieldBox>
              <FieldLabel label="Prompt" />
              <Textarea
                placeholder="Paste AI generation prompt..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[80px]"
              />
              {/\bgre[ya]\s*(background|bg)\b/i.test(prompt) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning inline-block mt-1">
                  ⚠ Grey background → suggest white
                </span>
              )}
            </FieldBox>

            <Button onClick={handleFix} disabled={loading} className="w-full h-12 text-base gap-2" size="lg">
              {loading ? <><Loader2 className="h-5 w-5 animate-spin" />Analyzing & Fixing...</> : <><Wand2 className="h-5 w-5" />Analyze & Fix</>}
            </Button>
          </div>

          {/* ── RIGHT: Fixed ── */}
          <div className="space-y-4">
            <SectionHeader color="green" label="Fixed Metadata" extra={result && <Badge variant="outline">{errors.length} issues fixed</Badge>} />

            {!result && !loading && (
              <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <ArrowRight className="h-10 w-10 text-muted-foreground/20 mb-3" />
                <p className="text-muted-foreground font-medium">Fixed metadata appears here</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Paste metadata on the left and click "Analyze & Fix"</p>
              </CardContent></Card>
            )}

            {loading && (
              <Card><CardContent className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <p className="text-muted-foreground">AI is analyzing & fixing...</p>
              </CardContent></Card>
            )}

            <AnimatePresence>
              {result && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* Fixed Title */}
                  <FixedField label="Title" value={result.title} counter={`${result.title.length}/70`} counterOk={result.title.length <= 70} copied={copiedField === "Title"} onCopy={() => copy(result.title, "Title")} />

                  {/* Alt Titles */}
                  {altTitles.length > 0 && (
                    <Card className="border-border/50">
                      <CardContent className="pt-3 pb-3 space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-medium">Alternative Titles</Label>
                        {altTitles.map((at, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 text-xs bg-muted/30 rounded p-2">
                            <span className="flex-1 truncate">{at}</span>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] shrink-0" onClick={() => copy(at, `Alt ${i + 1}`)}>
                              {copiedField === `Alt ${i + 1}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Fixed Keywords */}
                  <FixedField label="Keywords" value={result.keywords} counter={`${fixedKwCount}/49`} counterOk={fixedKwCount === 49} copied={copiedField === "Keywords"} onCopy={() => copy(result.keywords, "Keywords")} multiline />

                  {/* Fixed Description */}
                  <FixedField label="Description" value={result.description} counter={`${result.description.length} chars`} counterOk={result.description.length >= 200 && result.description.length <= 500} copied={copiedField === "Description"} onCopy={() => copy(result.description, "Description")} multiline />

                  {/* Prompt Checklist */}
                  {promptChecks && (
                    <Card>
                      <CardHeader className="pb-2 pt-3"><CardTitle className="text-sm">Prompt Quality Checklist</CardTitle></CardHeader>
                      <CardContent className="pb-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          <PromptCheckItem label="White/Transparent Background" ok={promptChecks.white_background} />
                          <PromptCheckItem label="Lighting Described" ok={promptChecks.lighting} />
                          <PromptCheckItem label="Camera Angle" ok={promptChecks.camera_angle} />
                          <PromptCheckItem label="Color Palette" ok={promptChecks.color_palette} />
                          <PromptCheckItem label="Mood / Atmosphere" ok={promptChecks.mood} />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Errors List */}
                  {errors.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2 pt-3"><CardTitle className="text-sm flex items-center gap-2"><Info className="h-4 w-4" />Changes Made ({errors.length})</CardTitle></CardHeader>
                      <CardContent className="pb-3">
                        <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                          {errors.map((err, i) => (
                            <div key={i} className="text-xs p-2 rounded bg-muted/40 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                {err.type === "error" ? <XCircle className="h-3 w-3 text-destructive shrink-0" /> : <AlertTriangle className="h-3 w-3 text-warning shrink-0" />}
                                <Badge variant="outline" className="text-[9px] uppercase">{err.field}</Badge>
                                <span className="text-muted-foreground">{err.reason}</span>
                              </div>
                              {err.original && (
                                <div className="flex items-center gap-2 pl-4 flex-wrap">
                                  <span className="line-through text-destructive/70 break-all">{err.original}</span>
                                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <span className="text-green-600 dark:text-green-400 break-all">{err.fixed}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Copy All */}
                  <Button onClick={copyAll} variant="outline" className="w-full gap-2">
                    <ClipboardCopy className="h-4 w-4" /> Copy All Fixed Metadata
                  </Button>

                  {/* Guidelines Sidebar (inline on mobile, always visible) */}
                  <Card className="bg-muted/20">
                    <CardHeader className="pb-2 pt-3"><CardTitle className="text-sm">Adobe Stock Guidelines</CardTitle></CardHeader>
                    <CardContent className="pb-3">
                      <div className="space-y-1">
                        <GuidelineItem label="Title max 70 characters" ok={result ? result.title.length <= 70 : null} />
                        <GuidelineItem label="No special characters in title" ok={result ? !SPECIAL_CHARS.test(result.title) : null} />
                        <GuidelineItem label="Keywords: single words only" ok={result ? !result.keywords.split(",").some((w) => w.trim().includes(" ")) : null} />
                        <GuidelineItem label="Exactly 49 keywords" ok={fixedKwCount === 49} />
                        <GuidelineItem label="No duplicate keywords" ok={result ? new Set(result.keywords.split(",").map((w) => w.trim().toLowerCase())).size === fixedKwCount : null} />
                        <GuidelineItem label="Description 200-500 characters" ok={result ? result.description.length >= 200 && result.description.length <= 500 : null} />
                        <GuidelineItem label="Background type in title" ok={result ? /background/i.test(result.title) : null} />
                        <GuidelineItem label="AI Generated label" ok={null} />
                        <GuidelineItem label="Minimum 4MP resolution" ok={null} />
                      </div>
                    </CardContent>
                  </Card>
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

function SectionHeader({ color, label, extra }: { color: string; label: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <div className={`h-3 w-3 rounded-full ${color === "green" ? "bg-green-500" : "bg-destructive"}`} />
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
          ❌ {is.text}
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

function FixedField({ label, value, counter, counterOk, copied, onCopy, multiline }: {
  label: string; value: string; counter?: string; counterOk?: boolean; copied: boolean; onCopy: () => void; multiline?: boolean;
}) {
  return (
    <Card className="border-green-500/20 bg-green-500/[0.02]">
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
        <div className={`text-sm bg-muted/30 rounded p-2.5 ${multiline ? "whitespace-pre-wrap break-words" : "truncate"}`}>{value}</div>
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

function GuidelineItem({ label, ok }: { label: string; ok: boolean | null }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {ok === null ? (
        <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
      ) : ok ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
      ) : (
        <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
      )}
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
