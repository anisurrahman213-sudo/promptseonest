import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSiteSetting, useUpdateSiteSetting } from '@/hooks/useSiteSettings';
import { Loader2, Video, Save, ExternalLink, Youtube, Play } from 'lucide-react';

export function DemoVideoManagement() {
  const { data: videoUrlSetting, isLoading: loadingUrl } = useSiteSetting('demo_video_url');
  const { data: videoTitleSetting, isLoading: loadingTitle } = useSiteSetting('demo_video_title');
  const { data: videoSubtitleSetting, isLoading: loadingSubtitle } = useSiteSetting('demo_video_subtitle');
  
  const updateSetting = useUpdateSiteSetting();
  
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoSubtitle, setVideoSubtitle] = useState('');

  const currentVideoUrl = videoUrlSetting?.setting_value || '';
  const currentTitle = videoTitleSetting?.setting_value || '';
  const currentSubtitle = videoSubtitleSetting?.setting_value || '';

  useEffect(() => {
    setVideoUrl(currentVideoUrl);
    setVideoTitle(currentTitle);
    setVideoSubtitle(currentSubtitle);
  }, [currentVideoUrl, currentTitle, currentSubtitle]);

  const isLoading = loadingUrl || loadingTitle || loadingSubtitle;

  // Check if it's a YouTube URL
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const youtubeId = videoUrl ? getYouTubeId(videoUrl) : null;
  const isYouTube = !!youtubeId;

  const handleSaveUrl = () => {
    updateSetting.mutate({ key: 'demo_video_url', value: videoUrl || null });
  };

  const handleSaveTitle = () => {
    updateSetting.mutate({ key: 'demo_video_title', value: videoTitle || null });
  };

  const handleSaveSubtitle = () => {
    updateSetting.mutate({ key: 'demo_video_subtitle', value: videoSubtitle || null });
  };

  const handleClearVideo = () => {
    setVideoUrl('');
    updateSetting.mutate({ key: 'demo_video_url', value: null });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Demo Video Section
        </CardTitle>
        <CardDescription>
          Add a demo video to your landing page. Supports YouTube links or direct video URLs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Video URL */}
        <div className="space-y-2">
          <Label htmlFor="video-url" className="flex items-center gap-2">
            <Youtube className="h-4 w-4" />
            Video URL
          </Label>
          <div className="flex gap-2">
            <Input
              id="video-url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... or direct video URL"
              className="flex-1"
            />
            <Button 
              onClick={handleSaveUrl}
              disabled={updateSetting.isPending}
            >
              {updateSetting.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste a YouTube link or direct video URL. Leave empty to hide the demo section.
          </p>
        </div>

        {/* Video Preview */}
        {videoUrl && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
              {isYouTube ? (
                <div className="relative w-full h-full">
                  <img
                    src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center">
                      <Play className="h-8 w-8 text-primary-foreground ml-1" fill="currentColor" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/70 rounded-full px-2 py-1 text-white text-xs">
                    <Youtube className="h-3 w-3 text-red-500" />
                    YouTube
                  </div>
                </div>
              ) : (
                <video
                  src={videoUrl}
                  className="w-full h-full object-cover"
                  controls
                  playsInline
                />
              )}
            </div>
            <div className="flex gap-2">
              {isYouTube && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(videoUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in YouTube
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearVideo}
              >
                Remove Video
              </Button>
            </div>
          </div>
        )}

        {/* Section Title */}
        <div className="space-y-2">
          <Label htmlFor="video-title">Section Title</Label>
          <div className="flex gap-2">
            <Input
              id="video-title"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="See How It Works"
              className="flex-1"
            />
            <Button 
              onClick={handleSaveTitle}
              disabled={updateSetting.isPending}
            >
              {updateSetting.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Section Subtitle */}
        <div className="space-y-2">
          <Label htmlFor="video-subtitle">Section Subtitle</Label>
          <div className="flex gap-2">
            <Textarea
              id="video-subtitle"
              value={videoSubtitle}
              onChange={(e) => setVideoSubtitle(e.target.value)}
              placeholder="Watch our 2-minute demo to see how easy it is to generate SEO metadata"
              className="flex-1 min-h-[80px]"
            />
            <Button 
              onClick={handleSaveSubtitle}
              disabled={updateSetting.isPending}
              className="self-start"
            >
              {updateSetting.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Tips */}
        <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
          <p className="font-medium mb-2">💡 Tips for a great demo video:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Keep it under 2 minutes for better engagement</li>
            <li>Show the upload → generate → export workflow</li>
            <li>Highlight the AI-generated metadata quality</li>
            <li>YouTube videos auto-generate thumbnails</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
