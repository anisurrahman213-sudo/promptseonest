// Pings IndexNow (Bing, Yandex, Seznam, Naver, Yep) to notify of URL updates.
// Note: Google deprecated sitemap ping in 2023 — use Google Search Console for Google.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const HOST = "www.promptseonest.com";
const KEY = "c2a2ad3832e47c1184c4ff8f1116bef5";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const SITEMAP_URLS = [
  "https://www.promptseonest.com/",
  "https://www.promptseonest.com/adobe-stock-generator",
  "https://www.promptseonest.com/metadata-fixer",
  "https://www.promptseonest.com/platform-converter",
  "https://www.promptseonest.com/keyword-research",
  "https://www.promptseonest.com/trending-keywords",
  "https://www.promptseonest.com/rejection-analyzer",
  "https://www.promptseonest.com/submission-tracker",
  "https://www.promptseonest.com/pricing",
  "https://www.promptseonest.com/tutorials",
  "https://www.promptseonest.com/extension",
  "https://www.promptseonest.com/calendar",
  "https://www.promptseonest.com/auth",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    let urls = SITEMAP_URLS;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (Array.isArray(body?.urls) && body.urls.length > 0) {
          urls = body.urls.filter((u: unknown): u is string =>
            typeof u === "string" && u.startsWith(`https://${HOST}/`)
          );
        }
      } catch { /* no body — use defaults */ }
    }

    if (urls.length === 0) {
      return new Response(JSON.stringify({ error: "No valid URLs" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls };

    const endpoints = [
      "https://api.indexnow.org/IndexNow",
      "https://www.bing.com/IndexNow",
      "https://yandex.com/indexnow",
    ];

    const results = await Promise.all(endpoints.map(async (url) => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(payload),
        });
        return { endpoint: url, status: res.status, ok: res.ok };
      } catch (e) {
        return { endpoint: url, error: (e as Error).message, ok: false };
      }
    }));

    return new Response(
      JSON.stringify({ submitted: urls.length, urls, results }, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
