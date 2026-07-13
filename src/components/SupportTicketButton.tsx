import { useState } from "react";
import { z } from "zod";
import { MessageCircle, Loader2, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ticketSchema = z.object({
  subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(120),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000),
});

export function SupportTicketButton() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleOpen = () => {
    if (!user) {
      toast.info("Please sign in to contact support");
      navigate("/auth");
      return;
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    const parsed = ticketSchema.safeParse({ subject, message });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        user_email: user.email ?? "",
        user_name: (user.user_metadata as any)?.full_name ?? null,
        subject: parsed.data.subject,
        message: parsed.data.message,
      });
      if (error) throw error;
      toast.success("Your message has been sent. We'll reply to your email.");
      setSubject("");
      setMessage("");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Contact support"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline text-sm font-medium">Contact / Complaint</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Support</DialogTitle>
            <DialogDescription>
              Send us your question or complaint. Our admin team will reply to your account email.
            </DialogDescription>
          </DialogHeader>
          {!user ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <p className="text-sm text-muted-foreground text-center">Please sign in to submit a support request.</p>
              <Button onClick={() => { setOpen(false); navigate("/auth"); }}>
                <LogIn className="h-4 w-4 mr-2" /> Sign in
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ticket-subject">Subject</Label>
                <Input
                  id="ticket-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary"
                  maxLength={120}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket-message">Message</Label>
                <Textarea
                  id="ticket-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or question in detail..."
                  rows={6}
                  maxLength={2000}
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground text-right">{message.length}/2000</p>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Send
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
