import { motion } from "framer-motion";
import { ExternalLink, X } from "lucide-react";
import { useState, useEffect } from "react";

const PRODUCT_HUNT_URL = "https://www.producthunt.com/posts/prompt-seo-nest";

export function ProductHuntBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("ph-banner-dismissed");
    if (dismissed) {
      setIsDismissed(true);
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem("ph-banner-dismissed", "true");
  };

  if (!isVisible || isDismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative bg-gradient-to-r from-[#da552f] via-[#ea532a] to-[#ff6154] text-white"
    >
      <div className="container mx-auto px-4 py-2.5 sm:py-3">
        <div className="flex items-center justify-center gap-2 sm:gap-4 text-center">
          {/* Product Hunt Cat Logo */}
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="hidden sm:block"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-md"
            >
              <circle cx="20" cy="20" r="20" fill="white" />
              <path
                d="M22.5 20H17.5V14H22.5C24.157 14 25.5 15.343 25.5 17C25.5 18.657 24.157 20 22.5 20Z"
                fill="#DA552F"
              />
              <path
                d="M17.5 14H15V26H17.5V22H22.5C25.538 22 28 19.538 28 16.5V17C28 14.462 25.538 12 22.5 12H17.5V14Z"
                fill="#DA552F"
              />
              <rect x="15" y="20" width="2.5" height="6" fill="#DA552F" />
            </svg>
          </motion.div>

          {/* Message */}
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
            <span className="text-xs sm:text-sm font-medium">
              🚀 We're LIVE on Product Hunt!
            </span>
            <a
              href={PRODUCT_HUNT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-semibold transition-all hover:scale-105 active:scale-95"
            >
              Support us with an Upvote
              <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </a>
          </div>

          {/* Animated Upvote Arrow */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-md bg-white/20 backdrop-blur-sm"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
