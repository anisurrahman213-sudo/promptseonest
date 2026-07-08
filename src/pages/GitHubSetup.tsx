import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/SEOHead';
import { ArrowLeft, Github, CheckCircle2, ExternalLink, GitBranch, Shield, RefreshCw } from 'lucide-react';

const STEPS = [
  {
    n: 1,
    title: 'Lovable editor খুলুন',
    desc: 'উপরের বাম কোণায় project name-এর পাশে বা chat input-এর Plus (+) button-এ click করুন।',
    icon: Github,
  },
  {
    n: 2,
    title: 'GitHub → Connect project',
    desc: 'Menu থেকে "GitHub" select করে "Connect to GitHub" চাপুন। Lovable GitHub App-কে authorize করুন।',
    icon: Shield,
  },
  {
    n: 3,
    title: 'Account / Organization বেছে নিন',
    desc: 'কোন GitHub account বা organization-এ repository তৈরি হবে সেটা select করুন।',
    icon: GitBranch,
  },
  {
    n: 4,
    title: 'Repository create করুন',
    desc: '"Create Repository" চাপলে আপনার সম্পূর্ণ codebase নতুন repo-তে push হবে এবং two-way sync চালু হয়ে যাবে।',
    icon: CheckCircle2,
  },
];

const FEATURES = [
  { title: 'Two-way sync', desc: 'Lovable বা GitHub — যেকোনো জায়গায় edit করলে অন্য দিকে auto sync হবে।' },
  { title: 'Full code ownership', desc: 'পুরো source code আপনার GitHub account-এ থাকবে, যেকোনো সময় clone/download করতে পারবেন।' },
  { title: 'Branch & PR support', desc: 'GitHub-এ branch তৈরি করে PR দিয়ে review workflow ব্যবহার করতে পারবেন।' },
  { title: 'Self-hosting সম্ভব', desc: 'চাইলে Vercel/Netlify/নিজের server-এ deploy করতে পারবেন।' },
];

export default function GitHubSetup() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="GitHub Connection Setup"
        description="আপনার Lovable project কে GitHub repository-র সাথে connect করার step-by-step guide।"
        path="/github-setup"
        noindex
      />

      <div className="container max-w-4xl mx-auto px-4 py-6 sm:py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex flex-col items-center text-center mb-8 sm:mb-12">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 shadow-glow">
            <Github className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold mb-3">
            GitHub-এর সাথে connect করুন
          </h1>
          <p className="text-muted-foreground max-w-xl text-sm sm:text-base">
            আপনার সম্পূর্ণ codebase একটি GitHub repository-তে sync করুন। একবার connect
            করলে দুই দিকের সব change automatic sync হবে।
          </p>
        </div>

        <Card className="mb-6 shadow-glow border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">
                Step by step
              </Badge>
            </div>
            <CardTitle className="font-display text-xl sm:text-2xl">
              4 ধাপে connection setup
            </CardTitle>
            <CardDescription>
              নিচের steps গুলো Lovable editor-এ follow করুন। পুরো প্রক্রিয়া 1 মিনিটের কম সময় নেবে।
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.n}
                  className="flex gap-4 p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {s.n}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-sm sm:text-base">{s.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              );
            })}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                size="lg"
                className="flex-1"
                onClick={() =>
                  window.open('https://docs.lovable.dev/integrations/github', '_blank', 'noopener')
                }
              >
                <Github className="w-4 h-4 mr-2" />
                Setup guide খুলুন
                <ExternalLink className="w-3.5 h-3.5 ml-2 opacity-70" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                onClick={() => window.open('https://github.com/', '_blank', 'noopener')}
              >
                GitHub-এ যান
                <ExternalLink className="w-3.5 h-3.5 ml-2 opacity-70" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg sm:text-xl">
              Connect করলে যা যা পাবেন
            </CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">{f.title}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="mt-6 p-4 rounded-lg border border-dashed bg-muted/30 flex gap-3 items-start">
          <RefreshCw className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-muted-foreground">
            <strong className="text-foreground">নোট:</strong> একটি Lovable account একসাথে একটি
            GitHub account-এর সাথেই connect করা যায়। বিদ্যমান GitHub repo সরাসরি import করা
            এখনো supported নয় — নতুন repo তৈরি করুন এবং প্রয়োজনে code manually copy করুন।
          </p>
        </div>
      </div>
    </div>
  );
}
