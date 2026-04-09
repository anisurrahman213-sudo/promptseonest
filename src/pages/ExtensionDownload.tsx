import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Chrome, CheckCircle2, Settings, Zap, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  { icon: "🔍", title: "Auto-Detect Platform", desc: "Detects Adobe Stock, Shutterstock & Freepik automatically" },
  { icon: "⚡", title: "Instant Fix", desc: "Fix titles, keywords & descriptions in one click" },
  { icon: "📥", title: "Auto-Fill", desc: "Read & write metadata directly on upload pages" },
  { icon: "📋", title: "Compliance Score", desc: "Real-time 0-100% compliance checker per platform" },
  { icon: "🖱️", title: "Right-Click Menu", desc: "Analyze any image from context menu" },
  { icon: "🎯", title: "49 Keywords", desc: "Auto-generate exactly 49 single-word keywords" },
];

const steps = [
  "Download the extension ZIP file below",
  "Unzip the downloaded file",
  "Open chrome://extensions in Chrome",
  "Enable Developer Mode (toggle top-right)",
  "Click Load Unpacked and select the unzipped folder",
  "Pin PromptSEONest to your toolbar — ready to use!",
];

export default function ExtensionDownload() {
  const navigate = useNavigate();

  const handleDownload = () => {
    fetch("/promptseonest-extension.zip")
      .then((res) => {
        if (!res.ok) throw new Error("Download failed");
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "promptseonest-extension.zip";
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => alert("Download failed. Please try again."));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">PromptSEONest Chrome Extension</h1>
            <p className="text-xs text-muted-foreground">Stock metadata optimizer for your browser</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Chrome className="h-4 w-4" /> Chrome Extension
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold">Optimize Stock Metadata<br />Right From Your Browser</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Fix titles, keywords & descriptions for Adobe Stock, Shutterstock & Freepik — directly on their upload pages.
          </p>
          <Button size="lg" className="gap-2 h-12 px-8 text-base" onClick={handleDownload}>
            <Download className="h-5 w-5" /> Download Extension (ZIP)
          </Button>
          <p className="text-xs text-muted-foreground">Works on Chrome, Edge, Brave, Arc & Opera</p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <Card key={f.title} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5 pb-4">
                <div className="text-2xl mb-2">{f.icon}</div>
                <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Supported Platforms */}
        <div className="text-center space-y-3">
          <h3 className="font-bold text-lg">Supported Platforms</h3>
          <div className="flex justify-center gap-3 flex-wrap">
            <Badge variant="outline" className="text-sm py-1.5 px-4 gap-1.5">
              <Globe className="h-3.5 w-3.5" /> Adobe Stock
            </Badge>
            <Badge variant="outline" className="text-sm py-1.5 px-4 gap-1.5">
              <Globe className="h-3.5 w-3.5" /> Shutterstock
            </Badge>
            <Badge variant="outline" className="text-sm py-1.5 px-4 gap-1.5">
              <Globe className="h-3.5 w-3.5" /> Freepik
            </Badge>
          </div>
        </div>

        {/* Installation Steps */}
        <Card>
          <CardContent className="pt-6 pb-5">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" /> Installation Guide
            </h3>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm">{step}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <strong>Settings:</strong> Click the ⚙️ icon in the extension popup to enter your Claude API key and configure platform preferences.
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" className="gap-2" onClick={handleDownload}>
            <Download className="h-5 w-5" /> Download PromptSEONest Extension
          </Button>
        </div>
      </div>
    </div>
  );
}
