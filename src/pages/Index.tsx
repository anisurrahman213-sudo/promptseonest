import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureCards } from "@/hooks/useFeatureCards";
import { useSiteSetting } from "@/hooks/useSiteSettings";
import { motion } from "framer-motion";
import { Sparkles, Image, Tags, Download, Zap, Shield, ArrowRight, CheckCircle2, Calendar, LucideIcon } from "lucide-react";
import DemoVideoSection from "@/components/landing/DemoVideoSection";
import { ProductHuntBanner } from "@/components/landing/ProductHuntBanner";
import { getOptimizedImageUrl } from "@/lib/imageOptimization";
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
    data: heroVideoSetting
  } = useSiteSetting('hero_video_url');
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
  const heroVideoUrl = heroVideoSetting?.setting_value;

  // Preload hero background image for LCP optimization
  useEffect(() => {
    const url = !heroVideoUrl && heroBackgroundUrl
      ? getOptimizedImageUrl(heroBackgroundUrl, 1920, 80)
      : null;
    if (!url) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    link.fetchPriority = 'high';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, [heroBackgroundUrl, heroVideoUrl]);
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
      <ProductHuntBanner />
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-32">
        {/* Video Background */}
        {heroVideoUrl ? <div className="absolute inset-0 z-0 overflow-hidden">
            <video src={heroVideoUrl} className="h-full w-full object-cover" autoPlay muted loop playsInline />
            <div className="absolute inset-0" style={{
          backgroundColor: `hsl(var(--background) / ${heroOverlayOpacity / 100})`
        }} />
          </div> : heroBackgroundUrl ? <div className="absolute inset-0 z-0" style={{
        backgroundImage: `url(${getOptimizedImageUrl(heroBackgroundUrl, 1920, 80)})`,
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
          }} className="mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-pink-600">
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
                </div> : <>
                  <Link to="/auth" className="w-full sm:w-auto">
                    <Button size="lg" className="gap-2 px-6 py-5 sm:px-8 sm:py-6 text-base sm:text-lg w-full">
                      {t('landing.startFreeTrial')}
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </Link>
                  <Link to="/pricing" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="px-6 py-5 sm:px-8 sm:py-6 text-base sm:text-lg w-full">
                      {t('landing.viewPricing')}
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
              {t('landing.freeCredits')}
            </motion.p>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <DemoVideoSection />

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
                        {isVideo ? <video src={feature.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-105" width={800} height={450} muted loop autoPlay playsInline /> : <img src={getOptimizedImageUrl(feature.image_url!, 800)} alt={feature.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : undefined} decoding={index === 0 ? "sync" : "async"} width={800} height={450} />}
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
      <section className="py-10 sm:py-16 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
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
      <section className="py-12 sm:py-24">
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
      <section className="py-12 sm:py-24 bg-muted/30">
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

      {/* CTA Section */}
      <section className="py-12 sm:py-24">
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

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="font-semibold text-sm sm:text-base text-foreground">Prompt SEO Nest</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/pricing" className="hover:text-foreground py-1">{t('footer.pricing')}</Link>
              <Link to="/auth" className="hover:text-foreground py-1">{t('header.login')}</Link>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t('footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;