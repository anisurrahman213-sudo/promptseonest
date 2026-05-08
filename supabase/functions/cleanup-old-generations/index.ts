import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Authorize: allow service-role caller (cron) or signed-in admin
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";
  const isServiceRole = authHeader === `Bearer ${supabaseServiceKey}`;
  if (!isServiceRole) {
    const auth = await requireAdmin(req, corsHeaders);
    if (!auth.ok) return auth.response;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the date 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const cutoffDate = threeDaysAgo.toISOString();

    console.log(`Cleaning up generations older than: ${cutoffDate}`);

    // Fetch all generations older than 3 days
    const { data: oldGenerations, error: fetchError } = await supabase
      .from("generations")
      .select("id, image_url, user_id")
      .lt("created_at", cutoffDate);

    if (fetchError) {
      console.error("Error fetching old generations:", fetchError);
      throw fetchError;
    }

    if (!oldGenerations || oldGenerations.length === 0) {
      console.log("No old generations to clean up");
      return new Response(
        JSON.stringify({ message: "No old generations to clean up", deleted: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${oldGenerations.length} generations to delete`);

    // Extract image paths for storage cleanup
    const imagePaths: string[] = [];
    for (const gen of oldGenerations) {
      if (gen.image_url) {
        try {
          const url = new URL(gen.image_url);
          const pathMatch = url.pathname.match(/\/images\/(.+)/);
          if (pathMatch && pathMatch[1]) {
            imagePaths.push(pathMatch[1]);
          }
        } catch (e) {
          console.log("Could not parse image URL:", gen.image_url);
        }
      }
    }

    // Delete from database
    const generationIds = oldGenerations.map((g) => g.id);
    const { error: deleteError } = await supabase
      .from("generations")
      .delete()
      .in("id", generationIds);

    if (deleteError) {
      console.error("Error deleting generations:", deleteError);
      throw deleteError;
    }

    console.log(`Deleted ${generationIds.length} generations from database`);

    // Delete images from storage
    if (imagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("images")
        .remove(imagePaths);

      if (storageError) {
        console.error("Error deleting images from storage:", storageError);
        // Don't throw, just log - the DB records are already deleted
      } else {
        console.log(`Deleted ${imagePaths.length} images from storage`);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Cleanup completed successfully",
        deleted: generationIds.length,
        imagesRemoved: imagePaths.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Cleanup error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
