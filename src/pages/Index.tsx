import { useEffect, lazy, Suspense, useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useFeatureCards } from "@/hooks/useFeatureCards";
import { useSiteSettingsBatch, getSettingValue } from "@/hooks/useSiteSettings";
import { motion } from "framer-motion";
import { Sparkles, Image, Tags, Download, Zap, Shield, ArrowRight, CheckCircle2, Calendar, Chrome, LucideIcon, Loader2 } from "lucide-react";
import { getOptimizedImageUrl, getResponsiveSrcSet } from "@/lib/imageOptimization";
import extensionScreenshot from "@/assets/extension-screenshot-1.jpg";

// Eager import critical above-fold-ish content (Stock Tools is core landing content)
import StockToolsShowcase from "@/components/landing/StockToolsShowcase";
import { SupportTicketButton } from "@/components/SupportTicketButton";
// Lazy load truly below-fold / non-critical components
const DemoVideoSection = lazy(() => import("@/components/landing/DemoVideoSection"));
const ProductHuntBanner = lazy(() => import("@/components/landing/ProductHuntBanner").then(m => ({ default: m.ProductHuntBanner })));
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
    t
  } = useTranslation();
  const {
    user,
    signInWithGoogle
  } = useAuth();
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({ title: t('auth.error'), description: error.message, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: t('auth.error'), description: 'Something went wrong', variant: 'destructive' });
    } finally {
      setGoogleLoading(false);
    }
  };
  const {
    data: featureCards,
    isLoading: featuresLoading
  } = useFeatureCards();
  const heroSettingKeys = [
    'hero_background_url', 'hero_video_url', 'hero_background_size',
    'hero_background_position_x', 'hero_background_position_y',
    'hero_overlay_opacity', 'hero_text_color', 'hero_text_shadow'
  ];
  const { data: heroSettings } = useSiteSettingsBatch(heroSettingKeys);

  const heroBackgroundUrl = getSettingValue(heroSettings, 'hero_background_url');
  const heroVideoUrl = getSettingValue(heroSettings, 'hero_video_url');
  const heroSize = parseInt(getSettingValue(heroSettings, 'hero_background_size') || '100');
  const heroPositionX = parseInt(getSettingValue(heroSettings, 'hero_background_position_x') || '50');
  const heroPositionY = parseInt(getSettingValue(heroSettings, 'hero_background_position_y') || '50');
  const heroOverlayOpacity = parseInt(getSettingValue(heroSettings, 'hero_overlay_opacity') || '70');
  const heroTextColor = getSettingValue(heroSettings, 'hero_text_color') || '';
  const heroTextShadow = parseInt(getSettingValue(heroSettings, 'hero_text_shadow') || '0');

  // Preload hero background image for LCP optimization with responsive sizes.
  // Also caches the URL in localStorage so repeat visitors get instant preload via index.html script.
  useEffect(() => {
    if (heroVideoUrl || !heroBackgroundUrl) {
      // Clear cache if hero changed to video or removed
      try { localStorage.removeItem('hero_preload_url'); } catch {}
      return;
    }

    const isMobile = window.innerWidth < 768;
    const width = isMobile ? 800 : 1920;
    const url = getOptimizedImageUrl(heroBackgroundUrl, width, 80);

    // Cache for next visit (instant preload from index.html inline script)
    try { localStorage.setItem('hero_preload_url', url); } catch {}

    // Skip injecting preload tag if already preloaded by inline script in index.html
    const existing = document.querySelector(`link[rel="preload"][href="${url}"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    link.fetchPriority = 'high';
    document.head.appendChild(link);
    return () => {
      try { document.head.removeChild(link); } catch {}
    };
  }, [heroBackgroundUrl, heroVideoUrl]);

  const heroTextStyle = {
    color: heroTextColor || undefined,
    textShadow: heroTextShadow > 0 ? `0 2px ${heroTextShadow}px rgba(0,0,0,0.5)` : undefined
  };

  // Fallback features if database is empty
  const defaultFeatures = [{
    icon_name: "Sparkles",
    title: t('features.aiPoweredPrompts'),
    description: t('features.aiPoweredPromptsDesc'),
    image_url: null
  }, {
    icon_name: "Tags",
    title: t('features.seoMetadata'),
    description: t('features.seoMetadataDesc'),
    image_url: null
  }, {
    icon_name: "Image",
    title: t('features.bulkProcessing'),
    description: t('features.bulkProcessingDesc'),
    image_url: null
  }, {
    icon_name: "Download",
    title: t('features.easyExport'),
    description: t('features.easyExportDesc'),
    image_url: null
  }, {
    icon_name: "Zap",
    title: t('features.lightningFast'),
    description: t('features.lightningFastDesc'),
    image_url: null
  }, {
    icon_name: "Shield",
    title: t('features.securePrivate'),
    description: t('features.securePrivateDesc'),
    image_url: null
  }];
  const features = featureCards && featureCards.length > 0 ? featureCards : defaultFeatures;
  const howItWorks = [{
    step: 1,
    title: t('landing.step1Title'),
    description: t('landing.step1Description')
  }, {
    step: 2,
    title: t('landing.step2Title'),
    description: t('landing.step2Description')
  }, {
    step: 3,
    title: t('landing.step3Title'),
    description: t('landing.step3Description')
  }];
  const whatYouGetItems = [t('landing.feature1'), t('landing.feature2'), t('landing.feature3'), t('landing.feature4'), t('landing.feature5'), t('landing.feature6')];
  return <div className="min-h-screen bg-background">
      <SEOHead
        title="Free Adobe Stock Metadata Generator"
        description="Generate 100% Adobe Stock-compliant metadata in seconds. Fix multi-word keywords and optimise titles with our free AI tool for stock contributors."
        path="/"
        keywords="adobe stock metadata generator, stock photo keyword generator, adobe stock keywords, metadata generator free, keyword fixer, seo tool, shutterstock keywords, freepik metadata, 49 keywords adobe stock, image seo"
      />
      {/* Skip Navigation Link for Accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none">
        Skip to main content
      </a>
      <Suspense fallback={null}>
        <ProductHuntBanner />
      </Suspense>
      <Header />
      
      <main id="main-content" role="main">
      {/* Hero Section */}
      <section aria-label="Hero" className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-32">
        {/* Video Background */}
        {heroVideoUrl ? <div className="absolute inset-0 z-0 overflow-hidden">
            <video src={heroVideoUrl} className="h-full w-full object-cover" autoPlay muted loop playsInline />
            <div className="absolute inset-0" style={{
          backgroundColor: `hsl(var(--background) / ${heroOverlayOpacity / 100})`
        }} />
          </div> : heroBackgroundUrl ? <div className="absolute inset-0 z-0" style={{
        backgroundImage: `url(${getOptimizedImageUrl(heroBackgroundUrl, typeof window !== 'undefined' && window.innerWidth < 768 ? 800 : 1920, 80)})`,
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
          }} className="mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {t('landing.badge')}
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
          }} className="mb-4 sm:mb-6 text-3xl sm:text-5xl lg:text-7xl font-bold leading-tight tracking-tight" style={heroTextStyle}>
              <span className="text-foreground">{t('landing.title')}</span>
              <span className={heroTextColor ? '' : 'block text-gradient animate-pulse'}>
                {t('landing.titleHighlight')}
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
          }} className="mx-auto mb-6 sm:mb-10 max-w-2xl text-sm sm:text-lg md:text-xl text-muted-foreground leading-relaxed" style={{
            color: heroTextColor ? `${heroTextColor}cc` : undefined,
            textShadow: heroTextStyle.textShadow
          }}>
              {t('landing.subtitle')}
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
                      {t('landing.goToDashboard')}
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
                    {t('landing.generateSeoTitles')}
                  </motion.span>
                </div> : <div className="flex flex-col items-center gap-3 sm:gap-4">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full">
                    <Link to="/auth" className="w-full sm:w-auto">
                      <Button size="lg" className="gap-2 px-6 py-5 sm:px-8 sm:py-6 text-base sm:text-lg w-full">
                        {t('landing.startFreeTrial')}
                        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </Link>
                  </div>
                  <div className="relative w-full sm:w-auto flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-px w-8 bg-border" />
                      {t('auth.orContinueWith')}
                      <span className="h-px w-8 bg-border" />
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      className="gap-2 px-6 py-5 sm:px-8 sm:py-6 text-base sm:text-lg w-full sm:w-auto"
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading}
                    >
                      {googleLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                      )}
                      {t('auth.continueWithGoogle')}
                    </Button>
                  </div>
                </div>}
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
              {t('landing.freeCredits')}
            </motion.p>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <Suspense fallback={null}>
        <DemoVideoSection />
      </Suspense>

      {/* Stock Contributor Tools Showcase - eager loaded for reliability */}
      <StockToolsShowcase />

      {/* Features Section */}
      <section aria-label="Features" className="py-12 sm:py-24 bg-muted/30">
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
              {t('landing.featuresTitle')}
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground px-2">
              {t('landing.featuresSubtitle')}
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
                        {isVideo ? <video src={feature.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-105" width={800} height={450} muted loop autoPlay playsInline aria-label={feature.title} /> : <img src={getOptimizedImageUrl(feature.image_url!, 800)} srcSet={getResponsiveSrcSet(feature.image_url!, [400, 800])} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" alt={feature.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : undefined} decoding={index === 0 ? "sync" : "async"} width={800} height={450} />}
                      </div>}
                    <CardContent className="p-4 sm:p-6">
                      {!feature.image_url && <div className="mb-3 sm:mb-4 inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>}
                      <h3 className="mb-1.5 sm:mb-2 text-lg sm:text-xl font-semibold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>;
          })}
          </div>
        </div>
      </section>

      {/* Event Calendar CTA */}
      <section aria-label="Event Calendar" className="py-10 sm:py-16 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-primary">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {t('landing.calendarBadge')}
            </div>
            <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              {t('landing.calendarTitle')}
            </h2>
            <p className="mb-5 sm:mb-6 text-sm sm:text-base text-muted-foreground px-2">
              {t('landing.calendarSubtitle')}
            </p>
            <Link to={user ? "/calendar" : "/auth"}>
              <Button size="lg" className="gap-2 px-5 py-4 sm:px-6 sm:py-5 text-sm sm:text-base">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                {user ? t('landing.viewCalendar') : t('landing.signUpToAccess')}
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section aria-label="How It Works" className="py-12 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto mb-10 sm:mb-16 max-w-2xl text-center">
            <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              {t('landing.howItWorksTitle')}
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground">
              {t('landing.howItWorksSubtitle')}
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 sm:gap-8 grid-cols-1 md:grid-cols-3">
            {howItWorks.map(item => <div key={item.step} className="text-center">
                <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary text-xl sm:text-2xl font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mb-1.5 sm:mb-2 text-lg sm:text-xl font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {item.description}
                </p>
              </div>)}
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section aria-label="What You Get" className="py-12 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 sm:mb-16 text-center">
              <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                {t('landing.whatYouGetTitle')}
              </h2>
              <p className="text-sm sm:text-lg text-muted-foreground">
                {t('landing.whatYouGetSubtitle')}
              </p>
            </div>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
              {whatYouGetItems.map(item => <div key={item} className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-3 sm:p-4">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-primary" />
                  <span className="text-sm sm:text-base text-foreground">{item}</span>
                </div>)}
            </div>
          </div>
        </div>
      </section>

      {/* Chrome Extension CTA */}
      <section aria-label="Chrome Extension" className="py-10 sm:py-16 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-6 sm:gap-10 items-center grid-cols-1 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs sm:text-sm font-medium text-primary">
                  <Chrome className="h-3.5 w-3.5" /> Chrome Extension
                </div>
                <h2 className="mb-3 text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                  Optimize Metadata Right From Your Browser
                </h2>
                <p className="mb-4 text-sm sm:text-base text-muted-foreground">
                  Fix titles, keywords & descriptions for Adobe Stock, Shutterstock & Freepik — directly on their upload pages. Auto-detect platform, auto-fill fields, and get instant compliance scoring.
                </p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {["Auto-Detect Platform", "One-Click Fix", "49 Keywords", "Compliance Score"].map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      <CheckCircle2 className="h-3 w-3" /> {tag}
                    </span>
                  ))}
                </div>
                <Link to="/extension">
                  <Button size="lg" className="gap-2 px-5 py-4 sm:px-6 sm:py-5 text-sm sm:text-base">
                    <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                    Download Extension
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </Link>
                <p className="mt-2 text-xs text-muted-foreground">Works on Chrome, Edge, Brave, Arc & Opera</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative"
              >
                <div className="overflow-hidden rounded-xl border shadow-xl bg-card">
                  <img
                    src={extensionScreenshot}
                    alt="PromptSEONest Chrome Extension popup showing metadata optimizer"
                    className="w-full aspect-[4/3] object-cover"
                    loading="lazy"
                    width={800}
                    height={600}
                  />
                </div>
                <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold shadow-lg">
                  100% Free
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - SEO content */}
      <section aria-label="Frequently Asked Questions" className="py-12 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 sm:mb-12 text-center">
              <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                Frequently Asked Questions
              </h2>
              <p className="text-sm sm:text-lg text-muted-foreground">
                Everything you need to know about Adobe Stock metadata optimization
              </p>
            </div>
            <div className="space-y-4">
              {[
                {
                  q: "What is Adobe Stock metadata?",
                  a: "Adobe Stock metadata includes the title, keywords, and description that help buyers find your images. Optimised metadata significantly increases your image visibility and sales."
                },
                {
                  q: "Why must Adobe Stock keywords be single words?",
                  a: 'Adobe Stock requires all keywords to be individual single words. Multi-word phrases like "solar panel" must be split into "solar" and "panel" separately. PromptSEONest automatically fixes this.'
                },
                {
                  q: "How many keywords does Adobe Stock allow?",
                  a: "Adobe Stock allows exactly 49 keywords per image. PromptSEONest automatically generates and validates exactly 49 single-word keywords for every image."
                },
                {
                  q: "Is PromptSEONest free to use?",
                  a: "Yes, PromptSEONest offers a free plan with daily credits. Upgrade to Pro for unlimited metadata generation."
                },
                {
                  q: "Does PromptSEONest work for Shutterstock and Freepik?",
                  a: "Yes, PromptSEONest supports Adobe Stock, Shutterstock, and Freepik with platform-specific keyword rules for each."
                }
              ].map((faq) => (
                <details key={faq.q} className="group rounded-lg border border-border/50 bg-card/50 p-4 sm:p-5 backdrop-blur-sm transition-all hover:border-primary/30">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm sm:text-base font-semibold text-foreground">
                    <span>{faq.q}</span>
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-primary transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section aria-label="Call to Action" className="py-12 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-3xl rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 p-8 sm:p-12 text-center">
            <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              {t('landing.ctaTitle')}
            </h2>
            <p className="mb-6 sm:mb-8 text-sm sm:text-lg text-muted-foreground">
              {t('landing.ctaSubtitle')}
            </p>
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button size="lg" className="gap-2 px-6 py-5 sm:px-8 sm:py-6 text-base sm:text-lg">
                {user ? t('landing.goToDashboard') : t('landing.startYourFreeTrial')}
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 sm:py-8" role="contentinfo">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="font-semibold text-sm sm:text-base text-foreground">Prompt SEO Nest</span>
            </div>
            <nav aria-label="Footer navigation" className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/pricing" className="hover:text-foreground py-1">{t('footer.pricing')}</Link>
              <Link to="/auth" className="hover:text-foreground py-1">{t('header.login')}</Link>
            </nav>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t('footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
      <SupportTicketButton />
    </div>;
};
export default Index;