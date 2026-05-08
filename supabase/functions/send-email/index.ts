import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { requireAdmin } from "../_shared/auth.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  type?: 'payment_approved' | 'payment_rejected' | 'custom';
  customerName?: string;
  planName?: string;
  credits?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, type, customerName, planName, credits }: EmailRequest = await req.json();

    let emailSubject = subject;
    let emailHtml = html;

    // Generate email content based on type
    if (type === 'payment_approved') {
      emailSubject = `Payment Approved - ${planName} Plan`;
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-badge { background: #10b981; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin-bottom: 20px; }
            .credits-box { background: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; border: 2px solid #667eea; }
            .credits-number { font-size: 48px; font-weight: bold; color: #667eea; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Payment Approved!</h1>
            </div>
            <div class="content">
              <p>Hi ${customerName || 'Valued Customer'},</p>
              <span class="success-badge">✓ Payment Verified</span>
              <p>Great news! Your payment for the <strong>${planName}</strong> plan has been approved.</p>
              <div class="credits-box">
                <div class="credits-number">${credits || 'Unlimited'}</div>
                <div>Credits Added</div>
              </div>
              <p>You can now start generating metadata for your images. Head over to your dashboard to get started!</p>
              <p>Thank you for choosing PromptNest!</p>
              <p>Best regards,<br>The PromptNest Team</p>
            </div>
            <div class="footer">
              <p>© 2024 PromptNest. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (type === 'payment_rejected') {
      emailSubject = `Payment Update - ${planName} Plan`;
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Update</h1>
            </div>
            <div class="content">
              <p>Hi ${customerName || 'Valued Customer'},</p>
              <p>We were unable to verify your payment for the <strong>${planName}</strong> plan.</p>
              <p>This could be due to:</p>
              <ul>
                <li>Invalid transaction ID</li>
                <li>Payment not received</li>
                <li>Incorrect amount sent</li>
              </ul>
              <p>Please try again or contact our support team for assistance.</p>
              <p>Best regards,<br>The PromptNest Team</p>
            </div>
            <div class="footer">
              <p>© 2024 PromptNest. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    console.log(`Sending email to ${to} with subject: ${emailSubject}`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "PromptNest <onboarding@resend.dev>",
        to: [to],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    const data = await res.json();
    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: res.ok ? 200 : 400,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
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
