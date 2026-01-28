import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureCards } from "@/hooks/useFeatureCards";
import { useSiteSetting } from "@/hooks/useSiteSettings";
import { motion } from "framer-motion";
import { Sparkles, Image, Tags, Download, Zap, Shield, ArrowRight, CheckCircle2, Calendar, LucideIcon } from "lucide-react";
const iconMap: Record<string, LucideIcon> = {
  Sparkles,
  Tags,
  Image,
  Download,
  Zap,
  Shield
};
const Index = () => {
  const {
    user
  } = useAuth();
  const {
    data: featureCards,
    isLoading: featuresLoading
  } = useFeatureCards();
  const {
    data: heroBackgroundSetting
  } = useSiteSetting('hero_background_url');
  const {
    data: heroSizeSetting
  } = useSiteSetting('hero_background_size');
  const {
    data: heroPositionXSetting
  } = useSiteSetting('hero_background_position_x');
  const {
    data: heroPositionYSetting
  } = useSiteSetting('hero_background_position_y');
  const {
    data: heroOpacitySetting
  } = useSiteSetting('hero_overlay_opacity');
  const {
    data: heroTextColorSetting
  } = useSiteSetting('hero_text_color');
  const {
    data: heroTextShadowSetting
  } = useSiteSetting('hero_text_shadow');
  const heroBackgroundUrl = heroBackgroundSetting?.setting_value;
  const heroSize = heroSizeSetting?.setting_value ? parseInt(heroSizeSetting.setting_value) : 100;
  const heroPositionX = heroPositionXSetting?.setting_value ? parseInt(heroPositionXSetting.setting_value) : 50;
  const heroPositionY = heroPositionYSetting?.setting_value ? parseInt(heroPositionYSetting.setting_value) : 50;
  const heroOverlayOpacity = heroOpacitySetting?.setting_value ? parseInt(heroOpacitySetting.setting_value) : 70;
  const heroTextColor = heroTextColorSetting?.setting_value || '';
  const heroTextShadow = heroTextShadowSetting?.setting_value ? parseInt(heroTextShadowSetting.setting_value) : 0;
  const heroTextStyle = {
    color: heroTextColor || undefined,
    textShadow: heroTextShadow > 0 ? `0 2px ${heroTextShadow}px rgba(0,0,0,0.5)` : undefined
  };

  // Fallback features if database is empty
  const defaultFeatures = [{
    icon_name: "Sparkles",
    title: "AI-Powered Prompts",
    description: "Generate professional, detailed image prompts using advanced AI vision technology",
    image_url: null
  }, {
    icon_name: "Tags",
    title: "SEO Metadata",
    description: "Get optimized titles, descriptions, and 40-50 relevant tags for maximum visibility",
    image_url: null
  }, {
    icon_name: "Image",
    title: "Bulk Processing",
    description: "Upload and process multiple images at once with our efficient queue system",
    image_url: null
  }, {
    icon_name: "Download",
    title: "Easy Export",
    description: "Download all your results as CSV or copy individual fields with one click",
    image_url: null
  }, {
    icon_name: "Zap",
    title: "Lightning Fast",
    description: "Get results in seconds with our optimized AI processing pipeline",
    image_url: null
  }, {
    icon_name: "Shield",
    title: "Secure & Private",
    description: "Your images are processed securely and never stored permanently",
    image_url: null
  }];
  const features = featureCards && featureCards.length > 0 ? featureCards : defaultFeatures;
  const howItWorks = [{
    step: 1,
    title: "Upload",
    description: "Drag and drop your images or click to browse"
  }, {
    step: 2,
    title: "Process",
    description: "Our AI analyzes your images instantly"
  }, {
    step: 3,
    title: "Export",
    description: "Copy or download your generated metadata"
  }];
  return <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-32">
        {heroBackgroundUrl ? <div className="absolute inset-0 z-0" style={{
        backgroundImage: `url(${heroBackgroundUrl})`,
        backgroundSize: `${heroSize}%`,
        backgroundPosition: `${heroPositionX}% ${heroPositionY}%`,
        backgroundRepeat: 'no-repeat'
      }}>
            <div className="absolute inset-0 backdrop-blur-sm" style={{
          backgroundColor: `hsl(var(--background) / ${heroOverlayOpacity / 100})`
        }} />
          </div> : <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />}
        <div className="container relative z-10 mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            ease: "easeOut"
          }} className="mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              AI-Powered Image Analysis
            </motion.div>
            <motion.h1 initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            delay: 0.1,
            ease: "easeOut"
          }} className="mb-4 sm:mb-6 text-3xl sm:text-5xl lg:text-7xl font-bold leading-tight tracking-tight md:text-[sidebar-accent-foreground] text-primary-foreground" style={heroTextStyle}>
              Generate Perfect
              <span className={heroTextColor ? '' : 'block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent'}>
                Image Prompts & Metadata
              </span>
            </motion.h1>
            <motion.p initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            delay: 0.2,
            ease: "easeOut"
          }} className="mx-auto mb-6 sm:mb-10 max-w-2xl text-sm sm:text-lg md:text-xl px-2 bg-indigo-800 text-primary-foreground" style={{
            color: heroTextColor ? `${heroTextColor}cc` : undefined,
            textShadow: heroTextStyle.textShadow
          }}>
              Transform any image into SEO-optimized titles, descriptions, tags, and detailed AI prompts. 
              Perfect for stock photographers, content creators, and digital marketers.
            </motion.p>
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            delay: 0.3,
            ease: "easeOut"
          }} className="flex flex-col items-center justify-center gap-3 sm:gap-4 sm:flex-row">
              {user ? <div className="flex flex-col items-center gap-2">
                  <Link to="/dashboard">
                    <Button size="lg" className="gap-2 px-6 py-5 sm:px-8 sm:py-6 text-base sm:text-lg w-full sm:w-auto">
                      Go to Dashboard
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </Link>
                  <motion.span initial={{
                opacity: 0,
                y: 5
              }} animate={{
                opacity: 1,
                y: 0
              }} transition={{
                delay: 0.5,
                duration: 0.5,
                ease: "easeOut"
              }} className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                    <motion.span animate={{
                  rotate: [0, 15, -15, 0]
                }} transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}>
                      <Sparkles className="h-3 w-3 text-primary" />
                    </motion.span>
                    Generate SEO-optimized titles
                  </motion.span>
                </div> : <>
                  <Link to="/auth" className="w-full sm:w-auto">
                    <Button size="lg" className="gap-2 px-6 py-5 sm:px-8 sm:py-6 text-base sm:text-lg w-full">
                      Start Free Trial
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </Link>
                  <Link to="/pricing" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="px-6 py-5 sm:px-8 sm:py-6 text-base sm:text-lg w-full">
                      View Pricing
                    </Button>
                  </Link>
                </>}
            </motion.div>
            <motion.p initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} transition={{
            duration: 0.5,
            delay: 0.5,
            ease: "easeOut"
          }} className="mt-4 sm:mt-6 text-xs sm:text-sm text-muted-foreground">
              ✨ Get 10 free credits to start • No credit card required
            </motion.p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true,
          margin: "-100px"
        }} transition={{
          duration: 0.5
        }} className="mx-auto mb-8 sm:mb-16 max-w-2xl text-center">
            <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              Everything You Need
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground px-2">
              Powerful features to help you create the perfect metadata for your images
            </p>
          </motion.div>
          <div className="mx-auto grid max-w-6xl gap-4 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
            const IconComponent = iconMap[feature.icon_name] || Sparkles;
            const isVideo = feature.image_url && ['.mp4', '.webm', '.mov'].some(ext => feature.image_url?.toLowerCase().includes(ext));
            return <motion.div key={feature.title} initial={{
              opacity: 0,
              y: 30
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true,
              margin: "-50px"
            }} transition={{
              duration: 0.5,
              delay: index * 0.1
            }}>
                  <Card className="group h-full border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg overflow-hidden active:scale-[0.98]">
                    {feature.image_url && <div className="aspect-video overflow-hidden">
                        {isVideo ? <video src={feature.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-105" muted loop autoPlay playsInline /> : <img src={feature.image_url} alt={feature.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />}
                      </div>}
                    <CardContent className="p-4 sm:p-6">
                      {!feature.image_url && <div className="mb-3 sm:mb-4 inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>}
                      <h3 className="mb-1.5 sm:mb-2 text-lg sm:text-xl font-semibold text-foreground">{feature.title}</h3>
                      <p className="text-sm sm:text-base text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>;
          })}
          </div>
        </div>
      </section>

      {/* Event Calendar CTA */}
      <section className="py-10 sm:py-16 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-primary">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              📅 Event Calendar 2026
            </div>
            <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              Discover Important Dates & Get Inspired
            </h2>
            <p className="mb-5 sm:mb-6 text-sm sm:text-base text-muted-foreground px-2">
              Explore holidays, celebrations, and creative events throughout 2026. Get daily motivation and plan your content calendar!
            </p>
            <Link to={user ? "/calendar" : "/auth"}>
              <Button size="lg" className="gap-2 px-5 py-4 sm:px-6 sm:py-5 text-sm sm:text-base">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                {user ? "View Calendar" : "Sign Up to Access"}
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto mb-10 sm:mb-16 max-w-2xl text-center">
            <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              How It Works
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground">
              Three simple steps to generate perfect metadata
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 sm:gap-8 grid-cols-1 md:grid-cols-3">
            {howItWorks.map(item => <div key={item.step} className="text-center">
                <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary text-xl sm:text-2xl font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mb-1.5 sm:mb-2 text-lg sm:text-xl font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{item.description}</p>
              </div>)}
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-12 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 sm:mb-16 text-center">
              <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                What You Get
              </h2>
              <p className="text-sm sm:text-lg text-muted-foreground">
                For each image, our AI generates comprehensive metadata
              </p>
            </div>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
              {["Detailed AI image prompt for recreation", "SEO-optimized title (under 60 characters)", "Compelling description (150-200 words)", "40-50 relevant comma-separated tags", "One-click copy for each field", "CSV export for bulk downloads"].map(item => <div key={item} className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-3 sm:p-4">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-primary" />
                  <span className="text-sm sm:text-base text-foreground">{item}</span>
                </div>)}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-3xl rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 p-8 sm:p-12 text-center">
            <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              Ready to Get Started?
            </h2>
            <p className="mb-6 sm:mb-8 text-sm sm:text-lg text-muted-foreground">
              Join thousands of creators using AI to generate perfect image metadata
            </p>
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button size="lg" className="gap-2 px-6 py-5 sm:px-8 sm:py-6 text-base sm:text-lg">
                {user ? "Go to Dashboard" : "Start Your Free Trial"}
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="font-semibold text-sm sm:text-base text-foreground">Prompt SEO Nest</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/pricing" className="hover:text-foreground py-1">Pricing</Link>
              <Link to="/auth" className="hover:text-foreground py-1">Login</Link>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              © 2026 Prompt SEO Nest. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;