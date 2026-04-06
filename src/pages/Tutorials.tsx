import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Play, UserPlus, Settings, Sparkles, Video, BookOpen, Zap, Star, Mail, MessageCircle } from "lucide-react";
import { useTutorialVideos, TutorialVideo } from "@/hooks/useTutorialVideos";

const iconMap: Record<string, React.ReactNode> = {
  Play: <Play className="h-5 w-5" />,
  UserPlus: <UserPlus className="h-5 w-5" />,
  Settings: <Settings className="h-5 w-5" />,
  Sparkles: <Sparkles className="h-5 w-5" />,
  Video: <Video className="h-5 w-5" />,
  BookOpen: <BookOpen className="h-5 w-5" />,
  Zap: <Zap className="h-5 w-5" />,
  Star: <Star className="h-5 w-5" />,
};

const TutorialCard = ({ tutorial }: { tutorial: TutorialVideo }) => {
  const { t } = useTranslation();
  
  // Try to use i18n key, fallback to direct text
  const title = t(tutorial.title_key, { defaultValue: tutorial.title });
  const description = t(tutorial.description_key, { defaultValue: tutorial.description });

  // Check if it's a direct video file (mp4, webm, etc.) or an embed URL (YouTube)
  const isDirectVideo = tutorial.video_url?.match(/\.(mp4|webm|ogg|mov)(\?|$)/i);

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="relative aspect-video bg-muted overflow-hidden">
        {tutorial.video_url ? (
          isDirectVideo ? (
            <video
              src={tutorial.video_url}
              title={title}
              className="w-full h-full object-cover"
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <iframe
              src={tutorial.video_url}
              title={title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Play className="h-8 w-8 text-primary fill-primary" />
              </div>
              <p className="text-sm text-muted-foreground">{t("tutorials.comingSoon")}</p>
            </div>
          </div>
        )}
        <Badge className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm text-foreground">
          {tutorial.duration}
        </Badge>
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {iconMap[tutorial.icon_name] || <Play className="h-5 w-5" />}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
};

const Tutorials = () => {
  const { t } = useTranslation();
  const { data: tutorials, isLoading } = useTutorialVideos();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Tutorials" description="Learn how to use Prompt SEO Nest to generate AI-powered SEO metadata for your stock photos and images." path="/tutorials" keywords="tutorials, seo guide, stock photo seo tutorial" />
      <Header />
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            📚 {t("tutorials.badge")}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            {t("tutorials.title")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("tutorials.subtitle")}
          </p>
        </div>

        {/* Tutorial Videos Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video" />
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {tutorials?.map((tutorial) => (
              <TutorialCard key={tutorial.id} tutorial={tutorial} />
            ))}
            {tutorials?.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No tutorials available yet.
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-primary/5 border-primary/20">
            <CardContent className="py-8">
              <h3 className="text-xl font-semibold mb-2">{t("tutorials.needHelp")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("tutorials.contactSupport")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="outline"
                  className="gap-2"
                  asChild
                >
                  <a href="mailto:anisurrahman213@gmail.com">
                    <Mail className="h-4 w-4" />
                    anisurrahman213@gmail.com
                  </a>
                </Button>
                <Button
                  className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
                  asChild
                >
                  <a
                    href="https://wa.me/8801711464759?text=Hi%2C%20I%20need%20help%20with%20PromptNest"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Tutorials;
