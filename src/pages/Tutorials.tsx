import { useTranslation } from "react-i18next";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, UserPlus, Settings, Sparkles } from "lucide-react";

interface TutorialVideo {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
  duration: string;
  videoUrl?: string; // YouTube embed URL or video file URL
  thumbnailUrl?: string;
}

const tutorialVideos: TutorialVideo[] = [
  {
    id: "signup",
    titleKey: "tutorials.signupTitle",
    descriptionKey: "tutorials.signupDesc",
    icon: <UserPlus className="h-5 w-5" />,
    duration: "2:30",
    videoUrl: "", // Add YouTube embed URL here
    thumbnailUrl: "/placeholder.svg",
  },
  {
    id: "pricing",
    titleKey: "tutorials.pricingTitle",
    descriptionKey: "tutorials.pricingDesc",
    icon: <Settings className="h-5 w-5" />,
    duration: "4:15",
    videoUrl: "",
    thumbnailUrl: "/placeholder.svg",
  },
  {
    id: "metadata",
    titleKey: "tutorials.metadataTitle",
    descriptionKey: "tutorials.metadataDesc",
    icon: <Sparkles className="h-5 w-5" />,
    duration: "5:00",
    videoUrl: "",
    thumbnailUrl: "/placeholder.svg",
  },
];

const TutorialCard = ({ tutorial }: { tutorial: TutorialVideo }) => {
  const { t } = useTranslation();

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="relative aspect-video bg-muted overflow-hidden">
        {tutorial.videoUrl ? (
          <iframe
            src={tutorial.videoUrl}
            title={t(tutorial.titleKey)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
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
            {tutorial.icon}
          </div>
          <CardTitle className="text-lg">{t(tutorial.titleKey)}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm leading-relaxed">
          {t(tutorial.descriptionKey)}
        </CardDescription>
      </CardContent>
    </Card>
  );
};

const Tutorials = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {tutorialVideos.map((tutorial) => (
            <TutorialCard key={tutorial.id} tutorial={tutorial} />
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-primary/5 border-primary/20">
            <CardContent className="py-8">
              <h3 className="text-xl font-semibold mb-2">{t("tutorials.needHelp")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("tutorials.contactSupport")}
              </p>
              <a
                href="mailto:support@promptseonest.com"
                className="text-primary hover:underline font-medium"
              >
                support@promptseonest.com
              </a>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Tutorials;
