import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InactiveUser {
  user_id: string;
  email: string;
  full_name: string | null;
  last_upload: string;
  generation_count: number;
}

const generateWarningEmailHtml = (
  userName: string,
  generationCount: number,
  hoursLeft: number
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .warning-icon { font-size: 48px; margin-bottom: 10px; }
        .content { background: #fff8f0; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #fed7aa; }
        .alert-box { background: #fef3c7; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .count-box { background: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .count-number { font-size: 48px; font-weight: bold; color: #ef4444; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .tips { background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .tips h3 { margin: 0 0 10px 0; color: #0369a1; }
        .tips ul { margin: 0; padding-left: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="warning-icon">⚠️</div>
          <h1>Your Photos Will Be Deleted Soon!</h1>
        </div>
        <div class="content">
          <p>Hi ${userName || 'there'},</p>
          
          <div class="alert-box">
            <strong>⏰ Warning:</strong> You haven't uploaded any photos in the last 2 days. 
            Your existing generations will be automatically deleted in approximately <strong>${hoursLeft} hours</strong>!
          </div>
          
          <div class="count-box">
            <div class="count-number">${generationCount}</div>
            <div>Generations at Risk</div>
          </div>
          
          <p>Our system automatically deletes generations older than 3 days to keep your storage optimized.</p>
          
          <div class="tips">
            <h3>💡 To Save Your Work:</h3>
            <ul>
              <li>Export your generations before they expire</li>
              <li>Download the images you want to keep</li>
              <li>Upload a new photo to stay active</li>
            </ul>
          </div>
          
          <center>
            <a href="https://promptseonest.lovable.app/dashboard" class="cta-button">
              📸 Go to Dashboard Now
            </a>
          </center>
          
          <p>Don't lose your valuable metadata! Take action now.</p>
          
          <p>Best regards,<br>The PromptNest Team</p>
        </div>
        <div class="footer">
          <p>© 2024 PromptNest. All rights reserved.</p>
          <p style="font-size: 12px; color: #999;">
            You received this email because you haven't been active for 2 days.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting inactive user notification check...");

    // Create Supabase client with service role key
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find users who haven't uploaded in exactly 2 days (between 48 and 72 hours ago)
    // This ensures we catch them before the 3-day auto-delete
    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);
    
    const threeDaysAgo = new Date();
    threeDaysAgo.setHours(threeDaysAgo.getHours() - 72);

    // Get users with their last upload time and generation count
    const { data: inactiveUsers, error: usersError } = await supabase
      .from('generations')
      .select('user_id, created_at')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error("Error fetching generations:", usersError);
      throw usersError;
    }

    // Group by user and find their last upload
    const userLastUpload: Record<string, { lastUpload: Date; count: number }> = {};
    
    inactiveUsers?.forEach(gen => {
      if (!userLastUpload[gen.user_id]) {
        userLastUpload[gen.user_id] = { 
          lastUpload: new Date(gen.created_at), 
          count: 1 
        };
      } else {
        userLastUpload[gen.user_id].count++;
        const genDate = new Date(gen.created_at);
        if (genDate > userLastUpload[gen.user_id].lastUpload) {
          userLastUpload[gen.user_id].lastUpload = genDate;
        }
      }
    });

    // Filter users inactive for 2+ days but less than 3 days
    const usersToNotify: string[] = [];
    const now = new Date();

    Object.entries(userLastUpload).forEach(([userId, data]) => {
      const hoursSinceLastUpload = (now.getTime() - data.lastUpload.getTime()) / (1000 * 60 * 60);
      // Notify users inactive between 48-72 hours
      if (hoursSinceLastUpload >= 48 && hoursSinceLastUpload < 72) {
        usersToNotify.push(userId);
      }
    });

    console.log(`Found ${usersToNotify.length} users to notify`);

    if (usersToNotify.length === 0) {
      return new Response(
        JSON.stringify({ message: "No inactive users to notify", notified: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check which users have already been notified today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: recentNotifications, error: notifError } = await supabase
      .from('notification_logs')
      .select('user_id')
      .eq('notification_type', 'inactivity_warning')
      .gte('sent_at', today.toISOString());

    if (notifError) {
      console.error("Error checking notifications:", notifError);
    }

    const alreadyNotified = new Set(recentNotifications?.map(n => n.user_id) || []);
    const usersToActuallyNotify = usersToNotify.filter(id => !alreadyNotified.has(id));

    console.log(`${usersToActuallyNotify.length} users haven't been notified yet`);

    // Get user details from admin_user_view
    const { data: userDetails, error: detailsError } = await supabase
      .from('admin_user_view')
      .select('user_id, email, full_name')
      .in('user_id', usersToActuallyNotify);

    if (detailsError) {
      console.error("Error fetching user details:", detailsError);
      throw detailsError;
    }

    let emailsSent = 0;
    const errors: string[] = [];

    // Send emails to each inactive user
    for (const user of userDetails || []) {
      if (!user.email) continue;

      const userData = userLastUpload[user.user_id!];
      const hoursLeft = Math.max(0, 72 - Math.floor((now.getTime() - userData.lastUpload.getTime()) / (1000 * 60 * 60)));

      try {
        console.log(`Sending email to ${user.email}...`);

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "PromptNest <onboarding@resend.dev>",
            to: [user.email],
            subject: "⚠️ Your Photos Will Be Deleted Tomorrow!",
            html: generateWarningEmailHtml(
              user.full_name || 'there',
              userData.count,
              hoursLeft
            ),
          }),
        });

        const emailResult = await emailResponse.json();
        
        if (emailResponse.ok) {
          emailsSent++;
          console.log(`Email sent successfully to ${user.email}`);

          // Log the notification
          await supabase.from('notification_logs').insert({
            user_id: user.user_id,
            notification_type: 'inactivity_warning',
            email_sent: true,
            push_sent: false,
          });
        } else {
          console.error(`Failed to send email to ${user.email}:`, emailResult);
          errors.push(`Failed to send to ${user.email}: ${emailResult.message || 'Unknown error'}`);
        }
      } catch (error: any) {
        console.error(`Error sending email to ${user.email}:`, error);
        errors.push(`Error for ${user.email}: ${error.message}`);
      }
    }

    console.log(`Notification job complete. Emails sent: ${emailsSent}`);

    return new Response(
      JSON.stringify({
        message: "Inactive user notification complete",
        usersFound: usersToNotify.length,
        usersNotified: emailsSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-inactive-users function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
