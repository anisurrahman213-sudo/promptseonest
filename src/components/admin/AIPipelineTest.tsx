import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Sparkles, Play, CheckCircle2, XCircle, Loader2, AlertTriangle, Image as ImageIcon, Clock,
} from 'lucide-react';

type FieldStatus = 'pending' | 'pass' | 'fail';

interface FieldResult {
  name: 'Prompt' | 'Title' | 'Description' | 'Tags';
  status: FieldStatus;
  value?: string;
  reason?: string;
  length?: number;
}

interface RunResult {
  overall: 'pass' | 'fail';
  durationMs: number;
  fields: FieldResult[];
  error?: string;
  category?: string;
}

/** Generate a small but content-rich PNG using <canvas>, return base64 (no data URL prefix). */
function generateSampleImageBase64(): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const w = 512;
      const h = 512;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas 2D context unavailable'));

      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#1e3a8a');
      sky.addColorStop(0.5, '#7c3aed');
      sky.addColorStop(1, '#fb923c');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Sun
      ctx.beginPath();
      ctx.fillStyle = '#fde68a';
      ctx.arc(w * 0.7, h * 0.45, 50, 0, Math.PI * 2);
      ctx.fill();

      // Mountains
      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.75);
      ctx.lineTo(w * 0.25, h * 0.5);
      ctx.lineTo(w * 0.45, h * 0.7);
      ctx.lineTo(w * 0.65, h * 0.45);
      ctx.lineTo(w * 0.85, h * 0.65);
      ctx.lineTo(w, h * 0.55);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Foreground
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, h * 0.85, w, h * 0.15);

      // Some texture dots (stars)
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (let i = 0; i < 60; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h * 0.4;
        ctx.fillRect(x, y, 1.5, 1.5);
      }

      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1] || '';
      if (!base64) return reject(new Error('Failed to encode sample image'));
      resolve(base64);
    } catch (e) {
      reject(e instanceof Error ? e : new Error(String(e)));
    }
  });
}

const DEFAULT_SETTINGS = {
  exportPlatform: 'adobe_stock',
  titleLength: 60,
  titleLengthMix: true,
  descriptionLength: 200,
  descriptionLengthFixed: false,
  keywordsCount: 49,
  imageType: 'none',
  prefix: '',
  suffix: '',
  negativeTitleWords: '',
  negativeKeywords: '',
  categoryLanguage: 'en',
};

function evaluateField(
  name: FieldResult['name'],
  raw: unknown,
): FieldResult {
  if (typeof raw !== 'string') {
    return { name, status: 'fail', reason: 'Missing or non-string value' };
  }
  const value = raw.trim();
  if (!value) return { name, status: 'fail', reason: 'Empty value' };

  if (name === 'Title') {
    if (value.length < 10) return { name, status: 'fail', value, length: value.length, reason: 'Title too short (<10 chars)' };
    if (value.length > 200) return { name, status: 'fail', value, length: value.length, reason: 'Title too long (>200 chars)' };
  }
  if (name === 'Description') {
    if (value.length < 30) return { name, status: 'fail', value, length: value.length, reason: 'Description too short (<30 chars)' };
  }
  if (name === 'Tags') {
    const tagCount = value.split(',').map((t) => t.trim()).filter(Boolean).length;
    if (tagCount < 5) return { name, status: 'fail', value, length: tagCount, reason: `Only ${tagCount} tags (need ≥5)` };
    return { name, status: 'pass', value, length: tagCount };
  }
  if (name === 'Prompt' && value.length < 30) {
    return { name, status: 'fail', value, length: value.length, reason: 'Prompt too short (<30 chars)' };
  }

  return { name, status: 'pass', value, length: value.length };
}

export function AIPipelineTest() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState<string>('');
  const [result, setResult] = useState<RunResult | null>(null);

  const runTest = async () => {
    setRunning(true);
    setResult(null);
    const started = performance.now();

    try {
      setStep('Generating sample image…');
      const base64 = await generateSampleImageBase64();

      setStep('Calling AI analysis pipeline…');
      const { data, error } = await supabase.functions.invoke('analyze-image', {
        body: {
          imageBase64: base64,
          imageName: 'health-check-sample.png',
          mediaType: 'image/png',
          settings: DEFAULT_SETTINGS,
        },
      });

      const durationMs = Math.round(performance.now() - started);

      if (error) {
        setResult({
          overall: 'fail',
          durationMs,
          fields: [],
          error: error.message || 'Edge function invocation failed',
        });
        return;
      }

      if (!data || data.success === false || data.error) {
        setResult({
          overall: 'fail',
          durationMs,
          fields: [],
          error: data?.error || 'AI returned no data',
        });
        return;
      }

      const payload = data.data ?? data;
      setStep('Verifying generated fields…');

      const fields: FieldResult[] = [
        evaluateField('Prompt', payload.prompt),
        evaluateField('Title', payload.title),
        evaluateField('Description', payload.description),
        evaluateField('Tags', payload.tags),
      ];

      const overall: RunResult['overall'] =
        fields.every((f) => f.status === 'pass') ? 'pass' : 'fail';

      setResult({ overall, durationMs, fields, category: payload.category });
    } catch (e) {
      const durationMs = Math.round(performance.now() - started);
      setResult({
        overall: 'fail',
        durationMs,
        fields: [],
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setStep('');
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Metadata Pipeline Test
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Uploads a generated sample image and verifies that Prompt, Title, Description, and Tags are produced without errors.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={runTest} disabled={running} className="gap-2">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? 'Running test…' : 'Run end-to-end test'}
          </Button>
          {running && step && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ImageIcon className="h-3 w-3" /> {step}
            </span>
          )}
        </div>

        {result && (
          <>
            <Alert
              className={`border-2 ${
                result.overall === 'pass'
                  ? 'bg-success/10 text-success border-success/30'
                  : 'bg-destructive/10 text-destructive border-destructive/30'
              }`}
            >
              {result.overall === 'pass' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle className="flex items-center gap-2 text-sm">
                {result.overall === 'pass' ? 'Pipeline healthy' : 'Pipeline failing'}
                <Badge variant="outline" className="gap-1 ml-auto text-xs font-normal">
                  <Clock className="h-3 w-3" /> {(result.durationMs / 1000).toFixed(1)}s
                </Badge>
              </AlertTitle>
              {result.error && (
                <AlertDescription className="text-xs mt-1">{result.error}</AlertDescription>
              )}
              {result.category && !result.error && (
                <AlertDescription className="text-xs mt-1 opacity-80">
                  Detected category: <span className="font-medium">{result.category}</span>
                </AlertDescription>
              )}
            </Alert>

            {result.fields.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {result.fields.map((f) => {
                  const Icon =
                    f.status === 'pass' ? CheckCircle2 : f.status === 'fail' ? XCircle : AlertTriangle;
                  const cls =
                    f.status === 'pass'
                      ? 'text-success'
                      : f.status === 'fail'
                      ? 'text-destructive'
                      : 'text-warning';
                  return (
                    <div
                      key={f.name}
                      className="rounded-md border bg-card p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium flex items-center gap-1.5 text-sm">
                          <Icon className={`h-3.5 w-3.5 ${cls}`} />
                          {f.name}
                        </span>
                        {typeof f.length === 'number' && (
                          <Badge variant="outline" className="text-[10px]">
                            {f.name === 'Tags' ? `${f.length} tags` : `${f.length} chars`}
                          </Badge>
                        )}
                      </div>
                      {f.reason && (
                        <p className="text-destructive text-[11px]">{f.reason}</p>
                      )}
                      {f.value && (
                        <p className="text-muted-foreground line-clamp-2 break-words">
                          {f.value}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default AIPipelineTest;
