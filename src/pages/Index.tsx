import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import { EventCalendar } from "@/components/EventCalendar";
import { useAuth } from "@/hooks/useAuth";
import { 
  Sparkles, 
  Image, 
  Tags, 
  Download, 
  Zap, 
  Shield,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

const Index = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Prompts",
      description: "Generate professional, detailed image prompts using advanced AI vision technology"
    },
    {
      icon: Tags,
      title: "SEO Metadata",
      description: "Get optimized titles, descriptions, and 40-50 relevant tags for maximum visibility"
    },
    {
      icon: Image,
      title: "Bulk Processing",
      description: "Upload and process multiple images at once with our efficient queue system"
    },
    {
      icon: Download,
      title: "Easy Export",
      description: "Download all your results as CSV or copy individual fields with one click"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Get results in seconds with our optimized AI processing pipeline"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your images are processed securely and never stored permanently"
    }
  ];

  const howItWorks = [
    { step: 1, title: "Upload", description: "Drag and drop your images or click to browse" },
    { step: 2, title: "Process", description: "Our AI analyzes your images instantly" },
    { step: 3, title: "Export", description: "Copy or download your generated metadata" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              AI-Powered Image Analysis
            </div>
            <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl">
              Generate Perfect
              <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Image Prompts & Metadata
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Transform any image into SEO-optimized titles, descriptions, tags, and detailed AI prompts. 
              Perfect for stock photographers, content creators, and digital marketers.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg" className="gap-2 px-8 py-6 text-lg">
                    Go to Dashboard
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth">
                    <Button size="lg" className="gap-2 px-8 py-6 text-lg">
                      Start Free Trial
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/pricing">
                    <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
                      View Pricing
                    </Button>
                  </Link>
                </>
              )}
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              ✨ Get 10 free credits to start • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful features to help you create the perfect metadata for your images
            </p>
          </div>
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="group border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Event Calendar 2026 */}
      <EventCalendar />

      {/* How It Works */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps to generate perfect metadata
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                What You Get
              </h2>
              <p className="text-lg text-muted-foreground">
                For each image, our AI generates comprehensive metadata
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                "Detailed AI image prompt for recreation",
                "SEO-optimized title (under 60 characters)",
                "Compelling description (150-200 words)",
                "40-50 relevant comma-separated tags",
                "One-click copy for each field",
                "CSV export for bulk downloads"
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-4">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 p-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join thousands of creators using AI to generate perfect image metadata
            </p>
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button size="lg" className="gap-2 px-8 py-6 text-lg">
                {user ? "Go to Dashboard" : "Start Your Free Trial"}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">ImagePrompt AI</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
              <Link to="/auth" className="hover:text-foreground">Login</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 ImagePrompt AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
