import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRightLeft,
  Wrench,
  Search,
  TrendingUp,
  AlertTriangle,
  ClipboardList,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

interface ToolItem {
  icon: typeof Sparkles;
  title: string;
  description: string;
  highlight: string;
  path: string;
  gradient: string;
  iconBg: string;
  badge?: string;
}

const TOOLS: ToolItem[] = [
  {
    icon: Sparkles,
    title: "Adobe Stock Metadata Generator",
    description:
      "Vision-AI দিয়ে এক ক্লিকে SEO-perfect Title, Description আর exactly 49 single-word Keywords generate করুন।",
    highlight: "Bulk 500 files · 100% Adobe Compliance",
    path: "/adobe-stock-generator",
    gradient: "from-violet-500/20 via-fuchsia-500/10 to-pink-500/20",
    iconBg: "bg-gradient-to-br from-violet-500 to-fuchsia-500",
    badge: "Most Popular",
  },
  {
    icon: ArrowRightLeft,
    title: "Platform Converter",
    description:
      "Adobe Stock metadata কে এক ক্লিকে Shutterstock আর Freepik format-এ rule-perfect convert করুন।",
    highlight: "3 Platforms · Bulk CSV Support",
    path: "/platform-converter",
    gradient: "from-blue-500/20 via-cyan-500/10 to-teal-500/20",
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
  },
  {
    icon: Wrench,
    title: "Metadata Fixer & Optimizer",
    description:
      "Existing title/keywords paste করুন — AI multi-word fix, banned words remove আর IELTS Band 8-9 quality enforce করবে।",
    highlight: "Auto Fix · Compliance Score",
    path: "/metadata-fixer",
    gradient: "from-emerald-500/20 via-green-500/10 to-lime-500/20",
    iconBg: "bg-gradient-to-br from-emerald-500 to-green-500",
  },
  {
    icon: Search,
    title: "Keyword Research",
    description:
      "যেকোনো subject দিন — high-CPC, buyer-intent keywords, categorized & ready-to-use list পান।",
    highlight: "Niche · Category · Intent",
    path: "/keyword-research",
    gradient: "from-amber-500/20 via-orange-500/10 to-red-500/20",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-500",
  },
  {
    icon: TrendingUp,
    title: "Trending Keywords",
    description:
      "এই মুহূর্তে Adobe Stock-এ কী trending সেটা real-time দেখুন আর সেই অনুযায়ী shoot করুন।",
    highlight: "Live Trends · Niche Insights",
    path: "/trending-keywords",
    gradient: "from-rose-500/20 via-pink-500/10 to-fuchsia-500/20",
    iconBg: "bg-gradient-to-br from-rose-500 to-pink-500",
    badge: "New",
  },
  {
    icon: AlertTriangle,
    title: "Rejection Analyzer",
    description:
      "Rejection email/reason paste করুন — AI বলবে exact কারণ আর কীভাবে fix করে resubmit করবেন।",
    highlight: "Root-cause · Action Plan",
    path: "/rejection-analyzer",
    gradient: "from-red-500/20 via-rose-500/10 to-orange-500/20",
    iconBg: "bg-gradient-to-br from-red-500 to-rose-500",
  },
  {
    icon: ClipboardList,
    title: "Submission Tracker",
    description:
      "কোন platform-এ কতগুলো submitted, accepted, rejected — সব track এক জায়গায়।",
    highlight: "19+ Platforms · Earnings Insight",
    path: "/submission-tracker",
    gradient: "from-indigo-500/20 via-blue-500/10 to-violet-500/20",
    iconBg: "bg-gradient-to-br from-indigo-500 to-blue-500",
  },
];

export default function StockToolsShowcase() {
  const { user } = useAuth();

  return (
    <section
      aria-label="Stock Contributor Tools"
      className="relative py-14 sm:py-24 overflow-hidden"
    >
      {/* Decorative background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-10 sm:mb-14 max-w-2xl text-center"
        >
          <div className="mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-primary">
            <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            All-in-One Stock Contributor Suite
          </div>
          <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            একটাই Platform — Stock-এ Earn করার সব Tools
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground px-2">
            Generate, Fix, Convert, Research আর Track — যা যা একজন successful Adobe Stock /
            Shutterstock / Freepik contributor-এর দরকার, সব এক জায়গায়।
          </p>
        </motion.div>

        {/* Tools Grid */}
        <div className="mx-auto grid max-w-6xl gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool, index) => {
            const Icon = tool.icon;
            const to = user ? tool.path : "/auth";
            return (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: Math.min(index * 0.07, 0.4) }}
              >
                <Link to={to} className="block h-full group">
                  <Card className="relative h-full border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]">
                    {/* Gradient overlay */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    />

                    {/* Badge */}
                    {tool.badge && (
                      <div className="absolute top-3 right-3 z-10 rounded-full bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold px-2 py-0.5 shadow-md">
                        {tool.badge}
                      </div>
                    )}

                    <CardContent className="relative p-5 sm:p-6 flex flex-col h-full">
                      {/* Icon */}
                      <div
                        className={`mb-4 inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl ${tool.iconBg} text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                      >
                        <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                      </div>

                      {/* Title */}
                      <h3 className="mb-2 text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {tool.title}
                      </h3>

                      {/* Description */}
                      <p className="mb-4 text-sm text-muted-foreground leading-relaxed flex-1">
                        {tool.description}
                      </p>

                      {/* Highlight chip */}
                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/40">
                        <span className="text-[11px] sm:text-xs font-medium text-primary/80 truncate">
                          {tool.highlight}
                        </span>
                        <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 sm:mt-14 mx-auto max-w-3xl"
        >
          <div className="rounded-xl sm:rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 p-5 sm:p-7 text-center">
            <p className="text-sm sm:text-base text-muted-foreground mb-3">
              <span className="font-semibold text-foreground">100% Free</span>-তে শুরু করুন —
              কোনো credit card লাগবে না।
            </p>
            <Link to={user ? "/dashboard" : "/auth"}>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-medium text-primary-foreground shadow-md hover:opacity-90 transition-opacity">
                {user ? "Go to Dashboard" : "Try All Tools Free"}
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
