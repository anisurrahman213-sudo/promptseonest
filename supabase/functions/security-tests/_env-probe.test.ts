import "https://deno.land/std@0.224.0/dotenv/load.ts";

Deno.test("ENV probe — list available test runtime variables", () => {
  const keys = Object.keys(Deno.env.toObject()).filter((k) =>
    /SUPA|SERVICE|SECRET|KEY|VITE|URL/i.test(k)
  );
  console.log("Available env vars:", keys);
});
