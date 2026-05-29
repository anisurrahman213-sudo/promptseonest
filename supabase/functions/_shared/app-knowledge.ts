// ============================================================
// SHARED PROMPTSEONEST KNOWLEDGE
// Single source of truth used by ALL AI edge functions so every
// AI feature speaks consistently about the product.
// Keep this synced with the actual product.
// ============================================================

// Short context preamble — inject into specialised AI prompts
// (metadata generator, rejection analyzer, keyword research, etc.)
// so they stay on-brand without bloating their task tokens.
export const APP_CONTEXT = `
You are operating inside **PromptSEONest** (https://promptseonest.com) — a professional AI-powered metadata & SEO automation suite for stock-media contributors (Adobe Stock, Shutterstock, Freepik, and 16+ other platforms).
Core capabilities the user can use elsewhere in the app:
- /dashboard — bulk upload up to 500 files; AI generates Title, Description, 40–50 single-word keywords, AI prompt, category.
- /adobe-stock-generator — vision-powered Adobe Stock metadata (strict 5-column CSV: Filename, Title, Keywords, Category, Releases).
- /metadata-fixer — 100-point SEO score + one-click rewrite.
- /platform-converter — reformat Adobe Stock metadata for Shutterstock / Freepik.
- /keyword-research — Primary/Secondary/Supporting prioritised panels.
- /trending-keywords — current stock-market trends and oversaturation warnings.
- /rejection-analyzer — diagnose platform rejection reasons.
- /submission-tracker — log submissions and outcomes.
- /calendar — 2026 event calendar with .ics export.
Quality bar: all English copy at IELTS Academic Band 8–9 (natural vocabulary, varied sentence structure, zero repetition). Adobe Stock keywords must be exactly **49 single-word** keywords, no hyphens. Generations and uploaded media auto-delete after **3 days** — always export CSV before then.
`.trim();

// Full authoritative knowledge base — used by the conversational
// AI Ask chatbot. Do not invent anything outside this content.
export const KNOWLEDGE_BASE = `
\`# PROMPTSEONEST — COMPLETE A-Z PRODUCT KNOWLEDGE BASE
\`
\`## 1. WHAT IS PROMPTSEONEST?
\`PromptSEONest is a professional AI-powered metadata & SEO automation suite built for stock media contributors — photographers, videographers, illustrators, AI-art creators, microstock sellers.
\`
\`Core workflow:
\`1. Upload your image or video (single or up to 500 in bulk)
\`2. AI vision model analyses every visual element
\`3. You receive an SEO-optimised Title, Description, 40–50 single-word Keywords, reusable AI Prompt, Category, and Editorial flag
\`4. Output is formatted to the exact rules of 19+ stock platforms
\`5. Export as a submission-ready CSV in one click
\`
\`Quality standard: All English copy is written at IELTS Academic Band 8–9 — natural vocabulary, varied sentence structure, zero repetition, fully buyer-search-optimised.
\`Domain: promptseonest.com
\`
\`## 2. SUPPORTED STOCK PLATFORMS (19+)
\`Adobe Stock, Shutterstock, Freepik, Getty Images, iStock, Dreamstime, 123RF, Alamy, Depositphotos, Pond5, Vecteezy, Canva, Pixta, EyeEm, Stocksy, Wirestock, Twenty20, Foap, Snapwire.
\`
\`## 3. COMPLETE PAGE & ROUTE GUIDE
\`Every page a user can visit:
\`
\`### "/" — Home
\`Hero section, feature cards, demo videos, pricing teaser, calendar preview, Stock Tools showcase. Best starting point for new visitors.
\`
\`### "/auth" — Login & Signup
\`- Sign up with email + password OR Google OAuth
\`- Email verification required before first login (check inbox AND spam folder)
\`- "Forgot password?" link sends a secure reset email
\`- After 5 failed attempts, the account is locked for 15 minutes (anti-brute-force protection)
\`- New users go through onboarding to add full name and phone number
\`
\`### "/dashboard" — Main Workspace
\`The heart of the app. From here you:
\`- Upload up to 500 files at once (drag-and-drop, click to browse, or paste with Ctrl+V)
\`- Select platform and click "Generate Metadata"
\`- See a live progress bar (parallel processing of ~80 files at a time)
\`- Search and filter your generation history
\`- Bulk-select items for CSV export
\`- View "Recent Activity" and "Recent Exports"
\`- See real-time platform validation badges (✅/❌ for each platform)
\`
\`### "/adobe-stock-generator"
\`Vision-powered Adobe Stock specialist. Strict 5-column CSV output: Filename, Title, Keywords, Category, Releases. Categories auto-mapped to Adobe's official taxonomy.
\`
\`### "/metadata-fixer"
\`Paste any existing metadata (from any source). Receive a 100-point SEO compliance score with breakdown:
\`- Title length & optimisation
\`- Description quality
\`- Keyword count, uniqueness, density
\`- Banned/prohibited word detection
\`- Repetition analysis
\`Click "Fix" — everything is rewritten to 100% Adobe Stock compliance instantly.
\`
\`### "/keyword-research"
\`Enter a subject and category. AI generates three prioritised panels:
\`- **Primary** — highest buyer-search volume (use first)
\`- **Secondary** — strong supporting terms
\`- **Supporting** — long-tail and niche
\`Drag-and-drop to reorder. Save keyword sets for later. Multi-platform support.
\`
\`### "/platform-converter"
\`Take Adobe Stock metadata and instantly reformat it for Shutterstock or Freepik. Handles different keyword counts, title-length rules, and category mapping. Bulk mode supported.
\`
\`### "/trending-keywords"
\`Discover currently-trending stock-market topics. Includes seasonal opportunities, evergreen winners, and oversaturation warnings (so you don't waste effort on flooded niches).
\`
\`### "/rejection-analyzer"
\`Paste a rejection message from any platform. AI categorises the cause into one of: quality_technical, trademark_ip, similar_content, model_property_release, metadata_keywords, content_policy, composition, commercial_value, other. Returns severity (low/medium/high), 1-sentence summary, 3–5 actionable fixes, 2–3 "avoid in future" tips, confidence score (0–100).
\`
\`### "/submission-tracker"
\`Log every submission: image → platform → status (pending/approved/rejected) → notes. Filter by platform or status. Run a full portfolio audit.
\`
\`### "/calendar"
\`2026 Event Calendar pre-loaded with global holidays, religious observances, awareness days, seasonal events. Add custom events (saved to your account). Export to .ics for Google Calendar, Apple Calendar, or Outlook. Plan stock content 2–4 weeks ahead — buyers search holiday terms early.
\`
\`### "/tutorials"
\`Video guides for every major feature. Best for visual learners.
\`
\`### "/pricing"
\`Credit plans and lifetime offers. When all paid plans are deactivated, the app runs in **Free Mode** — unlimited free generations.
\`
\`### "/profile"
\`Update full name, phone number, change password.
\`
\`### "/payment-history"
\`View all your past payment requests, statuses, and admin notes.
\`
\`### "/extension-download"
\`Download the official Chrome Extension (Manifest V3 — works on Chrome, Edge, Brave).
\`
\`### AI Ask popup
\`Floating chat bubble (this assistant) — available on every page. Ask anything about features, pricing, troubleshooting, or how-to.
\`
\`## 4. METADATA GENERATION — STEP BY STEP
\`
\`### How to generate metadata:
\`1. Go to /dashboard
\`2. Upload files (drag-and-drop, click to browse, or paste with Ctrl+V — up to 500 at once)
\`3. Wait for upload + auto-compression to finish (images compressed to ~150KB; videos converted to VP9 codec)
\`4. Optionally toggle "Auto Platform Limits" and pick your target platform
\`5. Optionally enable "Editorial mode" if your content is newsworthy/branded/location-specific
\`6. Click "Generate Metadata"
\`7. Watch the live progress bar — up to ~80 files process in parallel
\`8. Even if you navigate away, processing continues in the background
\`9. Edit any field (title, description, keywords, category) directly in the dashboard
\`10. Select items and click "Export CSV" when ready
\`
\`### What you get for every file:
\`- **SEO Title** (≤60 chars for Adobe Stock; ≤100 for Shutterstock/Freepik) — buyer-intent optimised
\`- **Description** — 150–200 words of natural flowing prose
\`- **40–50 unique single-word Keywords** — no hyphens, sorted by Adobe Stock ranking priority
\`- **Detailed AI Prompt** — reusable for Midjourney, DALL·E, Stable Diffusion
\`- **Category** — auto-mapped to Adobe Stock standard taxonomy
\`- **Editorial flag** — auto-detected for newsworthy/branded content
\`
\`### Supported file formats:
\`- Images: jpg, jpeg, png, webp, heic
\`- Videos: mp4, mov, webm
\`- Up to 500 files per upload batch
\`
\`### Video handling:
\`A 4-frame 2x2 grid is auto-extracted and analysed instead of full video. Same quality outcome, much faster, lower cost.
\`
\`## 5. ADVANCED METADATA CONTROLS
\`- **Auto Platform Limits** toggle — instantly syncs title length, keyword count, and description rules to the chosen platform
\`- **Editorial mode** flag — for newsworthy, branded, or location-specific content
\`- **Per-generation category override** — edit the AI's suggestion if needed
\`- **Linguistic Quality Engine** — IELTS Band 8–9 vocabulary diversity, zero repetition
\`
\`## 6. CONTENT QUALITY CONTROL (CQC)
\`Filters prohibited terms (trademarks, restricted brand names) BEFORE the AI processes the prompt. Warns about images that may violate stock-platform guidelines. Avoids 90% of common rejection reasons.
\`
\`## 7. PLATFORM VALIDATION (REAL-TIME)
\`Every uploaded file is checked in real-time against all 19 platforms' requirements:
\`- Min/max dimensions
\`- Maximum file size
\`- Aspect ratio
\`- Color profile (sRGB)
\`You see ✅/❌ per platform BEFORE clicking "Generate" — no wasted credits.
\`
\`## 8. CSV EXPORT (SUBMISSION-READY)
\`- Per-platform CSV format. Adobe Stock uses the strict 5-column official format: **Filename, Title, Keywords, Category, Releases**
\`- UTF-8 encoded — opens correctly in Excel, Google Sheets, Numbers
\`- Filename matches the uploaded asset exactly (critical for platform matching)
\`- Auto-split for very large exports (Adobe Stock recommends ≤500 rows per CSV)
\`- "Recent Exports" panel keeps your last 5 exports for quick re-download
\`
\`### How to export:
\`1. On /dashboard, select items (or "Select All")
\`2. Click "Export CSV"
\`3. Choose target platform (Adobe Stock, Shutterstock, Freepik, etc.)
\`4. CSV downloads immediately
\`5. Upload the CSV directly to the stock platform's contributor portal
\`
\`## 9. KEYWORD RESEARCH TOOL — DETAILS
\`Three prioritised panels per subject:
\`- **Primary** — highest buyer-search volume — use first
\`- **Secondary** — strong supporting terms
\`- **Supporting** — long-tail and niche
\`
\`Drag-and-drop reorder, save keyword sets, multi-platform support.
\`
\`Platform keyword limits:
\`- Adobe Stock: exactly **49 single-word** keywords (no hyphens, no compound words)
\`- Shutterstock: up to **50**
\`- Freepik: up to **30** (some tiers up to 50)
\`
\`## 10. METADATA FIXER — DETAILS
\`Input: any existing title + description + keywords.
\`Output: 100-point SEO compliance score with full breakdown plus a one-click "Fix" button that rewrites everything to 100% Adobe Stock compliance.
\`
\`## 11. PLATFORM CONVERTER — DETAILS
\`Take any Adobe Stock metadata and instantly reformat for Shutterstock or Freepik. Handles different keyword counts, title-length rules, and category mapping. Bulk mode supported.
\`
\`## 12. REJECTION ANALYZER — DETAILS
\`Paste the rejection message a platform sent you. AI categorises the cause and returns severity, summary, actionable suggestions, and "avoid in future" tips with a confidence score.
\`
\`## 13. SUBMISSION TRACKER — DETAILS
\`Log every submission: image → platform → status (pending/approved/rejected) → notes. Filter by platform or status. Useful for portfolio audit and identifying which platforms convert best for you.
\`
\`## 14. EVENT CALENDAR 2026
\`Pre-loaded with global holidays, religious observances, awareness days, seasonal events. Add custom events (stored per-user). Export to .ics for Google/Apple/Outlook.
\`
\`**Pro tip:** Buyers search holiday terms 2–4 weeks in advance. Plan accordingly.
\`
\`## 15. CHROME EXTENSION
\`- Manifest V3 — works on Chrome, Edge, Brave
\`- Auto-detects which platform's upload page you are on (Adobe Stock, Shutterstock, Freepik)
\`- One-click metadata fill from your generated data
\`- Download from /extension-download (3-step install guide included)
\`
\`## 16. RETENTION & AUTO-DELETE
\`**IMPORTANT:** All generations and uploaded media are auto-deleted after **3 days** (privacy + storage hygiene).
\`- Dashboard shows clear warnings when items are nearing expiry
\`- ALWAYS export your CSV before the 3-day window closes
\`- Original AI Prompts and metadata are gone after deletion — there is no recovery
\`
\`## 17. INACTIVITY NOTIFICATIONS
\`If you don't log in for 2 days, you receive a friendly email + push reminder. Helps avoid losing track of pending generations before the 3-day deletion.
\`
\`## 18. NETWORK & OFFLINE HANDLING
\`- App detects offline / slow / VPN-blocked states and shows a banner
\`- Heartbeat every 30 seconds verifies backend connectivity
\`- Latency indicator helps diagnose slow connections
\`- If you see "Offline" but your internet works, try disabling your VPN
\`
\`## 19. PWA SUPPORT
\`Install PromptSEONest as a standalone app on phone or desktop:
\`- **Android Chrome:** tap the install banner that appears, or menu → "Install app"
\`- **iPhone Safari:** tap Share → "Add to Home Screen"
\`- **Desktop Chrome/Edge:** install icon in address bar
\`Offline browsing of previously generated content is supported.
\`
\`## 20. MULTILINGUAL UI (11 LANGUAGES)
\`English · বাংলা (Bengali) · Español · Français · Deutsch · Português · 中文 (Chinese) · 日本語 (Japanese) · 한국어 (Korean) · العربية (Arabic — RTL) · हिन्दी (Hindi)
\`Switch via the flag/globe icon in the header. Your choice is remembered across sessions.
\`
\`## 21. CREDITS & PRICING
\`- New users receive **10 free credits** on signup
\`- 1 credit = 1 image OR 1 video metadata generation
\`- **Free Mode:** when all paid plans are deactivated on /pricing, generations become unlimited and free
\`- Plans on /pricing — pay via local methods (bKash, Nagad, Rocket, bank transfer) by submitting a payment request with screenshot
\`- Lifetime plans available — pay once, use forever
\`- After admin reviews and approves, credits are added and you receive an email notification
\`- Track all your payments on /payment-history
\`
\`### How to buy credits:
\`1. Go to /pricing
\`2. Choose a plan
\`3. Send payment via bKash/Nagad/Rocket/bank
\`4. Submit the payment request form with transaction ID and screenshot
\`5. Admin reviews → credits added → email confirmation
\`
\`## 22. AUTHENTICATION
\`- Email + password OR Google OAuth
\`- Email verification required before first login (check spam folder)
\`- Password reset via "Forgot password?" link on /auth
\`- Account locks for 15 minutes after multiple failed login attempts
\`- New users complete onboarding (full name, phone) before reaching the dashboard
\`
\`## 23. PLATFORM-SPECIFIC RULES (QUICK REFERENCE)
\`
\`### ADOBE STOCK
\`- Title: ≤60 characters
\`- Keywords: exactly **49 single-word** keywords (no hyphens, no compound words)
\`- CSV: 5 columns — Filename, Title, Keywords, Category, Releases
\`- Categories: must match Adobe's standard taxonomy
\`- Recommended: ≤500 rows per CSV upload
\`
\`### SHUTTERSTOCK
\`- Title: ≤100 characters
\`- Keywords: up to 50
\`- Description: optional but recommended
\`
\`### FREEPIK
\`- Title: ≤100 characters
\`- Keywords: up to 30 (some tiers up to 50)
\`- Detailed description recommended for AI-generated content
\`
\`### Other platforms
\`Use /platform-converter or "Auto Platform Limits" — limits and category mappings are handled automatically.
\`
\`## 24. COMMON QUESTIONS — VERIFIED ANSWERS
\`
\`**Q: How do I get started?**
\`A: Sign up at /auth → verify email → complete profile → go to /dashboard → upload files → click Generate. You start with 10 free credits.
\`
\`**Q: How do I get more credits?**
\`A: Buy a plan on /pricing OR check if Free Mode is currently active (then it's unlimited).
\`
\`**Q: My upload failed — what should I do?**
\`A: Check (1) file size and format, (2) internet connection, (3) disable your VPN if active, (4) try the "Retry" button, (5) refresh the page.
\`
\`**Q: How long are my generations kept?**
\`A: 3 days. Always export your CSV before then — there is no recovery after auto-delete.
\`
\`**Q: Can I use this for Shutterstock / Freepik / other platforms?**
\`A: Yes — toggle "Auto Platform Limits" on /dashboard, OR use /platform-converter to reformat existing Adobe Stock metadata.
\`
\`**Q: What's the best title length?**
\`A: ≤60 characters for Adobe Stock; ≤100 for Shutterstock and Freepik.
\`
\`**Q: How many keywords should I use?**
\`A: Adobe Stock: exactly 49 single-word keywords (no hyphens). Shutterstock: up to 50. Freepik: up to 30.
\`
\`**Q: Can I edit the AI's output?**
\`A: Yes — every field (title, description, keywords, category) is fully editable in the dashboard before export.
\`
\`**Q: How do I install the Chrome Extension?**
\`A: Visit /extension-download → follow the 3-step install guide. Works on Chrome, Edge, Brave.
\`
\`**Q: I forgot my password.**
\`A: Click "Forgot password?" on /auth → enter your email → check inbox for the reset link.
\`
\`**Q: My email isn't verified.**
\`A: Check your spam/junk folder. If still missing, request a new verification email from /auth.
\`
\`**Q: My account is locked.**
\`A: Wait 15 minutes — the lock auto-expires. The countdown is shown on the login screen.
\`
\`**Q: Why was my submission rejected by [platform]?**
\`A: Use /rejection-analyzer — paste the rejection reason and the AI will diagnose it and suggest a fix.
\`
\`**Q: How do I plan content around holidays?**
\`A: Use /calendar — pre-loaded with 2026 events. Buyers search Christmas/Valentine's/Eid/Diwali terms 2–4 weeks in advance.
\`
\`**Q: Can I install this app on my phone?**
\`A: Yes — it's a PWA. On Chrome Android tap the install banner; on iPhone Safari tap Share → "Add to Home Screen".
\`
\`**Q: Is there a free trial?**
\`A: Yes — 10 credits on signup. If Free Mode is active, all generations are unlimited and free.
\`
\`**Q: What file formats are supported?**
\`A: Images: jpg, jpeg, png, webp, heic. Videos: mp4, mov, webm. Up to 500 files per upload batch.
\`
\`**Q: Does it work for AI-generated images?**
\`A: Yes — particularly recommended for Adobe Firefly, Midjourney, DALL·E, Stable Diffusion outputs. The reusable AI Prompt field helps you re-generate variations.
\`
\`**Q: Are videos supported?**
\`A: Yes — a 4-frame 2x2 grid is auto-extracted and analysed for faster results with no quality loss.
\`
\`**Q: Can I process files in bulk?**
\`A: Yes — up to 500 files per batch, with ~80 processed in parallel. Background processing continues even if you navigate away.
\`
\`**Q: How do I export a CSV?**
\`A: On /dashboard, select items → click "Export CSV" → choose platform → file downloads instantly.
\`
\`**Q: Can I export the same generations multiple times?**
\`A: Yes. The "Recent Exports" panel keeps your last 5 exports for quick re-download.
\`
\`**Q: My CSV won't open correctly in Excel.**
\`A: Our CSVs are UTF-8 encoded. In Excel, use **Data → From Text/CSV** and select UTF-8 — don't double-click.
\`
\`**Q: How do I switch the app language?**
\`A: Click the globe/flag icon in the header. 11 languages supported including Bengali, Arabic (RTL), Hindi, Chinese.
\`
\`**Q: How do I change my password?**
\`A: Go to /profile → "Change password" section.
\`
\`**Q: Where do I see my past payments?**
\`A: /payment-history shows all submitted requests, statuses, and admin notes.
\`
\`**Q: I lost connection while generating — did I lose my credits?**
\`A: Credits are only deducted on successful generation. Failed generations are not charged.
\`
\`**Q: How do I delete my account?**
\`A: Contact support@promptseonest.com with the request from your registered email.
\`
\`**Q: Can I use the same metadata across multiple platforms?**
\`A: Yes — generate once for Adobe Stock, then use /platform-converter to reformat for Shutterstock and Freepik.
`.trim();
