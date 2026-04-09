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
  Wand2,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  XCircle,
  ArrowRight,
  Info,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface Issue {
  field: string;
  type: "error" | "warning";
  original: string;
  fixed: string;
  reason: string;
}

interface FixResult {
  fixed: {
    title: string;
    keywords: string;
    description: string;
    prompt: string;
  };
  issues: Issue[];
  score: number;
  summary: string;
}

// --- Local analysis helpers (instant, no AI) ---

function analyzeTitle(title: string) {
  const issues: { text: string; type: "error" | "warning" }[] = [];
  if (/[:\-\/|\\[\]{}()&@#$%^*!?<>]/.test(title)) issues.push({ text: "Special characters found", type: "error" });
  if (title.length > 70) issues.push({ text: `Too long (${title.length}/70)`, type: "error" });
  if (/\b(red|blue|green|orange|yellow|pink|purple|cyan|magenta|lime|brown|grey|gray|black|beige|teal|violet|maroon|navy|gold|silver|turquoise)\b/i.test(title))
    issues.push({ text: "Color details in title", type: "warning" });
  if (/\bgre[ya]\b/i.test(title)) issues.push({ text: "Grey background → should be white", type: "warning" });
  if (title.length === 0) issues.push({ text: "Title is empty", type: "error" });
  return issues;
}

function analyzeKeywords(keywords: string) {
  const issues: { text: string; type: "error" | "warning"; words?: string[] }[] = [];
  const list = keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const multiWord = list.filter((k) => k.includes(" "));
  const hyphenated = list.filter((k) => k.includes("-"));
  const dupes = list.filter((k, i) => list.indexOf(k.toLowerCase()) !== i);
  if (multiWord.length > 0) issues.push({ text: `${multiWord.length} multi-word keywords`, type: "error", words: multiWord });
  if (hyphenated.length > 0) issues.push({ text: `${hyphenated.length} hyphenated keywords`, type: "error", words: hyphenated });
  if (dupes.length > 0) issues.push({ text: `${dupes.length} duplicate keywords`, type: "warning", words: dupes });
  if (list.length !== 49) issues.push({ text: `${list.length}/49 keywords (need exactly 49)`, type: list.length > 49 ? "error" : "warning" });
  return { issues, count: list.length };
}

export default function MetadataFixer() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<FixResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Live analysis
  const titleIssues = useMemo(() => analyzeTitle(title), [title]);
  const keywordAnalysis = useMemo(() => analyzeKeywords(keywords), [keywords]);

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
      setResult(data);
      toast.success(`${data.issues?.length || 0} issues fixed! Score: ${data.score}%`);
    } catch (err: any) {
      toast.error(err.message || "Failed to fix metadata");
    } finally {
      setLoading(false);
    }
  }, [title, keywords, description, prompt]);

  const copyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const fixedKeywordCount = result
    ? result.fixed.keywords.split(",").map((k) => k.trim()).filter(Boolean).length
    : 0;

  const errorCount = result?.issues?.filter((i) => i.type === "error").length || 0;
  const warningCount = result?.issues?.filter((i) => i.type === "warning").length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Metadata Fixer & Optimizer</h1>
            <p className="text-xs text-muted-foreground">Fix Adobe Stock metadata issues instantly</p>
          </div>
          {result && (
            <div className="flex items-center gap-2">
              <Badge variant={result.score >= 80 ? "default" : result.score >= 50 ? "secondary" : "destructive"} className="text-sm">
                Score: {result.score}%
              </Badge>
              <Badge variant="outline" className="text-sm">
                {result.issues.length} fixes
              </Badge>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Live warnings bar */}
        {(titleIssues.length > 0 || keywordAnalysis.issues.length > 0) && !result && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 rounded-lg border border-warning/30 bg-warning/5 flex flex-wrap gap-2 items-center">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
            <span className="text-sm font-medium text-warning">Live Issues:</span>
            {titleIssues.map((issue, i) => (
              <Badge key={`t-${i}`} variant="outline" className={`text-xs ${issue.type === "error" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-warning/10 text-warning border-warning/20"}`}>
                Title: {issue.text}
              </Badge>
            ))}
            {keywordAnalysis.issues.map((issue, i) => (
              <Badge key={`k-${i}`} variant="outline" className={`text-xs ${issue.type === "error" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-warning/10 text-warning border-warning/20"}`}>
                Keywords: {issue.text}
              </Badge>
            ))}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Original Input */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-3 w-3 rounded-full bg-destructive" />
              <h2 className="font-semibold text-lg">Original Metadata</h2>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="title" className="font-medium">Title</Label>
                <span className={`text-xs font-mono ${title.length > 70 ? "text-destructive" : "text-muted-foreground"}`}>
                  {title.length}/70
                </span>
              </div>
              <Input
                id="title"
                placeholder="Paste your title here..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={titleIssues.some((i) => i.type === "error") ? "border-destructive/50" : ""}
              />
              {titleIssues.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {titleIssues.map((issue, i) => (
                    <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${issue.type === "error" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                      {issue.text}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Keywords */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="keywords" className="font-medium">Keywords</Label>
                <span className={`text-xs font-mono ${keywordAnalysis.count === 49 ? "text-green-500" : "text-destructive"}`}>
                  {keywordAnalysis.count}/49
                </span>
              </div>
              <Textarea
                id="keywords"
                placeholder="Paste comma-separated keywords..."
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className={`min-h-[100px] ${keywordAnalysis.issues.some((i) => i.type === "error") ? "border-destructive/50" : ""}`}
              />
              {keywordAnalysis.issues.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {keywordAnalysis.issues.map((issue, i) => (
                    <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${issue.type === "error" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                      {issue.text}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="font-medium">Description</Label>
                <span className="text-xs text-muted-foreground font-mono">{description.length} chars</span>
              </div>
              <Textarea
                id="description"
                placeholder="Paste description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            {/* Prompt */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="prompt" className="font-medium">Prompt</Label>
                {/\bgre[ya]\s*(background|bg)\b/i.test(prompt) && (
                  <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/20">
                    Grey BG detected → suggest white
                  </Badge>
                )}
              </div>
              <Textarea
                id="prompt"
                placeholder="Paste AI generation prompt..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            {/* Fix Button */}
            <Button onClick={handleFix} disabled={loading} className="w-full h-12 text-base gap-2" size="lg">
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing & Fixing...
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  Fix & Optimize
                </>
              )}
            </Button>
          </div>

          {/* RIGHT: Fixed Output */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <h2 className="font-semibold text-lg">Fixed Metadata</h2>
              {result && (
                <Badge variant="outline" className="ml-auto">
                  {result.issues.length} issues fixed
                </Badge>
              )}
            </div>

            {!result && !loading && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <ArrowRight className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">Fixed metadata will appear here</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Paste your metadata on the left and click "Fix & Optimize"</p>
                </CardContent>
              </Card>
            )}

            {loading && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                  <p className="text-muted-foreground">AI is analyzing and fixing...</p>
                </CardContent>
              </Card>
            )}

            <AnimatePresence>
              {result && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* Score */}
                  <Card>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Adobe Stock Compliance</span>
                        <span className={`text-lg font-bold ${result.score >= 80 ? "text-green-500" : result.score >= 50 ? "text-warning" : "text-destructive"}`}>
                          {result.score}%
                        </span>
                      </div>
                      <Progress value={result.score} className="h-2.5" />
                      <div className="flex gap-3 mt-2">
                        <span className="text-xs text-destructive flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> {errorCount} errors
                        </span>
                        <span className="text-xs text-warning flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> {warningCount} warnings
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Fixed Title */}
                  <FixedField
                    label="Title"
                    value={result.fixed.title}
                    counter={`${result.fixed.title.length}/70`}
                    counterOk={result.fixed.title.length <= 70}
                    copied={copiedField === "Title"}
                    onCopy={() => copyToClipboard(result.fixed.title, "Title")}
                  />

                  {/* Fixed Keywords */}
                  <FixedField
                    label="Keywords"
                    value={result.fixed.keywords}
                    counter={`${fixedKeywordCount}/49`}
                    counterOk={fixedKeywordCount === 49}
                    copied={copiedField === "Keywords"}
                    onCopy={() => copyToClipboard(result.fixed.keywords, "Keywords")}
                    multiline
                  />

                  {/* Fixed Description */}
                  <FixedField
                    label="Description"
                    value={result.fixed.description}
                    counter={`${result.fixed.description.length} chars`}
                    counterOk={result.fixed.description.length >= 200 && result.fixed.description.length <= 500}
                    copied={copiedField === "Description"}
                    onCopy={() => copyToClipboard(result.fixed.description, "Description")}
                    multiline
                  />

                  {/* Fixed Prompt */}
                  <FixedField
                    label="Prompt"
                    value={result.fixed.prompt}
                    copied={copiedField === "Prompt"}
                    onCopy={() => copyToClipboard(result.fixed.prompt, "Prompt")}
                    multiline
                  />

                  {/* Issues List */}
                  {result.issues.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          Changes Made ({result.issues.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {result.issues.map((issue, i) => (
                            <div key={i} className="text-xs p-2 rounded bg-muted/50 space-y-1">
                              <div className="flex items-center gap-1.5">
                                {issue.type === "error" ? (
                                  <XCircle className="h-3 w-3 text-destructive shrink-0" />
                                ) : (
                                  <AlertTriangle className="h-3 w-3 text-warning shrink-0" />
                                )}
                                <Badge variant="outline" className="text-[9px] uppercase">{issue.field}</Badge>
                                <span className="text-muted-foreground">{issue.reason}</span>
                              </div>
                              <div className="flex items-center gap-2 pl-4">
                                <span className="line-through text-destructive/70">{issue.original}</span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-green-600 dark:text-green-400">{issue.fixed}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {result.summary && (
                    <p className="text-xs text-muted-foreground italic px-1">{result.summary}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-component ---

function FixedField({
  label,
  value,
  counter,
  counterOk,
  copied,
  onCopy,
  multiline,
}: {
  label: string;
  value: string;
  counter?: string;
  counterOk?: boolean;
  copied: boolean;
  onCopy: () => void;
  multiline?: boolean;
}) {
  return (
    <Card className="border-green-500/20 bg-green-500/[0.02]">
      <CardContent className="pt-3 pb-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="font-medium text-sm flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            {label}
          </Label>
          <div className="flex items-center gap-2">
            {counter && (
              <span className={`text-xs font-mono ${counterOk ? "text-green-500" : "text-destructive"}`}>
                {counter}
              </span>
            )}
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onCopy}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
        <div className={`text-sm bg-muted/30 rounded p-2 ${multiline ? "whitespace-pre-wrap" : "truncate"}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
