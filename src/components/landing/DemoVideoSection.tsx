import { useTranslation } from "react-i18next";
import { useSiteSetting } from "@/hooks/useSiteSettings";
import { motion } from "framer-motion";
import { Play, Youtube } from "lucide-react";
import { useState } from "react";

const DemoVideoSection = () => {
  const { t } = useTranslation();
  const { data: demoVideoUrlSetting } = useSiteSetting('demo_video_url');
  const { data: demoVideoTitleSetting } = useSiteSetting('demo_video_title');
  const { data: demoVideoSubtitleSetting } = useSiteSetting('demo_video_subtitle');
  
  const [isPlaying, setIsPlaying] = useState(false);

  const videoUrl = demoVideoUrlSetting?.setting_value || '';
  const videoTitle = demoVideoTitleSetting?.setting_value || t('landing.demoVideoTitle', 'See How It Works');
  const videoSubtitle = demoVideoSubtitleSetting?.setting_value || t('landing.demoVideoSubtitle', 'Watch our 2-minute demo to see how easy it is to generate SEO metadata for your stock photos');

  // Check if it's a YouTube URL
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const youtubeId = videoUrl ? getYouTubeId(videoUrl) : null;
  const isYouTube = !!youtubeId;

  // Don't render if no video URL is set
  if (!videoUrl) {
    return null;
  }

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-8 sm:mb-12 max-w-2xl text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-primary">
            <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {t('landing.demoBadge', 'Product Demo')}
          </div>
          <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            {videoTitle}
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground px-2">
            {videoSubtitle}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto max-w-4xl"
        >
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl">
            {/* Video Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 rounded-xl sm:rounded-2xl blur-xl opacity-50" />
            
            <div className="relative aspect-video bg-black/90 rounded-xl sm:rounded-2xl overflow-hidden">
              {isYouTube ? (
                !isPlaying ? (
                  // YouTube Thumbnail with Play Button
                  <div 
                    className="relative w-full h-full cursor-pointer group"
                    onClick={() => setIsPlaying(true)}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to hqdefault if maxresdefault doesn't exist
                        e.currentTarget.src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
                      }}
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                    {/* Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/90 group-hover:bg-primary group-hover:scale-110 transition-all flex items-center justify-center shadow-lg">
                        <Play className="h-8 w-8 sm:h-10 sm:w-10 text-primary-foreground ml-1" fill="currentColor" />
                      </div>
                    </div>
                    {/* YouTube Badge */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/70 rounded-full px-3 py-1.5 text-white text-xs sm:text-sm">
                      <Youtube className="h-4 w-4 text-red-500" />
                      YouTube
                    </div>
                  </div>
                ) : (
                  // YouTube Embed
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                    title="Demo Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                )
              ) : (
                // Direct Video URL
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full object-contain"
                  poster=""
                  playsInline
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          </div>

          {/* Video Features */}
          <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-primary mb-1">2 min</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{t('landing.demoQuickWatch', 'Quick Watch')}</div>
            </div>
            <div className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-primary mb-1">3 Steps</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{t('landing.demoEasyProcess', 'Easy Process')}</div>
            </div>
            <div className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-primary mb-1">19+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{t('landing.demoPlatforms', 'Platforms')}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DemoVideoSection;
