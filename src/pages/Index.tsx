import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureCards } from "@/hooks/useFeatureCards";
import { useSiteSetting } from "@/hooks/useSiteSettings";
import { 
  Sparkles, 
  Image, 
  Tags, 
  Download, 
  Zap, 
  Shield,
  ArrowRight,
  CheckCircle2,
  Calendar,
  LucideIcon
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Sparkles,
  Tags,
  Image,
  Download,
  Zap,
  Shield,
};

const Index = () => {
  const { user } = useAuth();
  const { data: featureCards, isLoading: featuresLoading } = useFeatureCards();
  const { data: heroBackgroundSetting } = useSiteSetting('hero_background_url');
  const { data: heroSizeSetting } = useSiteSetting('hero_background_size');
  const { data: heroPositionXSetting } = useSiteSetting('hero_background_position_x');
  const { data: heroPositionYSetting } = useSiteSetting('hero_background_position_y');

  const heroBackgroundUrl = heroBackgroundSetting?.setting_value;
  const heroSize = heroSizeSetting?.setting_value ? parseInt(heroSizeSetting.setting_value) : 100;
  const heroPositionX = heroPositionXSetting?.setting_value ? parseInt(heroPositionXSetting.setting_value) : 50;
  const heroPositionY = heroPositionYSetting?.setting_value ? parseInt(heroPositionYSetting.setting_value) : 50;

  // Fallback features if database is empty
  const defaultFeatures = [
    { icon_name: "Sparkles", title: "AI-Powered Prompts", description: "Generate professional, detailed image prompts using advanced AI vision technology", image_url: null },
    { icon_name: "Tags", title: "SEO Metadata", description: "Get optimized titles, descriptions, and 40-50 relevant tags for maximum visibility", image_url: null },
    { icon_name: "Image", title: "Bulk Processing", description: "Upload and process multiple images at once with our efficient queue system", image_url: null },
    { icon_name: "Download", title: "Easy Export", description: "Download all your results as CSV or copy individual fields with one click", image_url: null },
    { icon_name: "Zap", title: "Lightning Fast", description: "Get results in seconds with our optimized AI processing pipeline", image_url: null },
    { icon_name: "Shield", title: "Secure & Private", description: "Your images are processed securely and never stored permanently", image_url: null },
  ];

  const features = featureCards && featureCards.length > 0 ? featureCards : defaultFeatures;

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
        {heroBackgroundUrl ? (
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${heroBackgroundUrl})`,
              backgroundSize: `${heroSize}%`,
              backgroundPosition: `${heroPositionX}% ${heroPositionY}%`,
              backgroundRepeat: 'no-repeat',
            }}
          >
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        )}
        <div className="container relative z-10 mx-auto px-4">
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
            {features.map((feature) => {
              const IconComponent = iconMap[feature.icon_name] || Sparkles;
              const isVideo = feature.image_url && ['.mp4', '.webm', '.mov'].some(ext => feature.image_url?.toLowerCase().includes(ext));
              
              return (
                <Card key={feature.title} className="group border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg overflow-hidden">
                  {feature.image_url && (
                    <div className="aspect-video overflow-hidden">
                      {isVideo ? (
                        <video 
                          src={feature.image_url}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          muted
                          loop
                          autoPlay
                          playsInline
                        />
                      ) : (
                        <img 
                          src={feature.image_url} 
                          alt={feature.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      )}
                    </div>
                  )}
                  <CardContent className="p-6">
                    {!feature.image_url && (
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <IconComponent className="h-6 w-6" />
                      </div>
                    )}
                    <h3 className="mb-2 text-xl font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Event Calendar CTA */}
      <section className="py-16 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
              <Calendar className="h-4 w-4" />
              📅 Event Calendar 2026
            </div>
            <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
              Discover Important Dates & Get Inspired
            </h2>
            <p className="mb-6 text-muted-foreground">
              Explore holidays, celebrations, and creative events throughout 2026. Get daily motivation and plan your content calendar!
            </p>
            <Link to={user ? "/calendar" : "/auth"}>
              <Button size="lg" className="gap-2">
                <Calendar className="h-5 w-5" />
                {user ? "View Calendar" : "Sign Up to Access"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

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
