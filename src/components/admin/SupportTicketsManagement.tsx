import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Mail, Trash2, MessageSquare, Reply } from "lucide-react";
import { useSendCustomEmail } from "@/hooks/usePaymentRequests";

type Ticket = {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  subject: string;
  message: string;
  status: "open" | "replied" | "closed";
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
};

export function SupportTicketsManagement() {
  const queryClient = useQueryClient();
  const sendEmail = useSendCustomEmail();
  const [filter, setFilter] = useState<"all" | "open" | "replied" | "closed">("all");
  const [replyDialog, setReplyDialog] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Ticket[];
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ ticket, reply }: { ticket: Ticket; reply: string }) => {
      const { error } = await supabase
        .from("support_tickets")
        .update({
          admin_reply: reply,
          status: "replied",
          replied_at: new Date().toISOString(),
        })
        .eq("id", ticket.id);
      if (error) throw error;
      await sendEmail.mutateAsync({
        to: ticket.user_email,
        subject: `Re: ${ticket.subject}`,
        html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p>Hi ${ticket.user_name || "there"},</p>
          <p>Thanks for contacting us. Here is our response to your inquiry:</p>
          <blockquote style="border-left: 3px solid #7c3aed; padding: 10px 16px; margin: 16px 0; background: #f9fafb; color: #111;">
            ${reply.replace(/\n/g, "<br>")}
          </blockquote>
          <p style="color:#666; font-size: 13px;">Your original message:</p>
          <blockquote style="border-left: 3px solid #d1d5db; padding: 8px 12px; margin: 8px 0; color:#555; font-size: 13px;">
            <strong>${ticket.subject}</strong><br>
            ${ticket.message.replace(/\n/g, "<br>")}
          </blockquote>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">Best regards,<br>Prompt SEO Nest Support</p>
        </div>`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Reply sent and ticket updated");
      setReplyDialog(null);
      setReplyText("");
    },
    onError: (e: any) => toast.error(e.message || "Failed to send reply"),
  });

  const closeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("support_tickets").update({ status: "closed" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Ticket closed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("support_tickets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Ticket deleted");
    },
  });

  const filtered = tickets?.filter((t) => filter === "all" || t.status === filter) ?? [];
  const openCount = tickets?.filter((t) => t.status === "open").length ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> Support Tickets
            {openCount > 0 && <Badge variant="destructive">{openCount} open</Badge>}
          </CardTitle>
          <div className="flex gap-1">
            {(["all", "open", "replied", "closed"] as const).map((s) => (
              <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)}>
                {s}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No tickets</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((t) => (
              <div key={t.id} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-foreground truncate">{t.subject}</h4>
                      <Badge variant={t.status === "open" ? "destructive" : t.status === "replied" ? "default" : "secondary"}>
                        {t.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      From <span className="font-medium">{t.user_name || t.user_email}</span> · {t.user_email} · {new Date(t.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/40 p-3 rounded">{t.message}</p>
                {t.admin_reply && (
                  <div className="text-sm border-l-2 border-primary pl-3">
                    <p className="text-xs text-muted-foreground mb-1">Admin reply · {t.replied_at ? new Date(t.replied_at).toLocaleString() : ""}</p>
                    <p className="whitespace-pre-wrap">{t.admin_reply}</p>
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={() => { setReplyDialog(t); setReplyText(t.admin_reply || ""); }} className="gap-1">
                    <Reply className="h-3.5 w-3.5" /> {t.admin_reply ? "Edit Reply" : "Reply"}
                  </Button>
                  {t.status !== "closed" && (
                    <Button size="sm" variant="outline" onClick={() => closeMutation.mutate(t.id)}>Close</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => window.location.href = `mailto:${t.user_email}?subject=Re: ${encodeURIComponent(t.subject)}`}>
                    <Mail className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm("Delete this ticket?")) deleteMutation.mutate(t.id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!replyDialog} onOpenChange={(o) => { if (!o) { setReplyDialog(null); setReplyText(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reply to {replyDialog?.user_email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm bg-muted/40 p-3 rounded">
              <p className="font-medium">{replyDialog?.subject}</p>
              <p className="text-muted-foreground whitespace-pre-wrap mt-1">{replyDialog?.message}</p>
            </div>
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={7}
              placeholder="Write your reply..."
              maxLength={4000}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReplyDialog(null)}>Cancel</Button>
            <Button
              disabled={!replyText.trim() || replyMutation.isPending}
              onClick={() => replyDialog && replyMutation.mutate({ ticket: replyDialog, reply: replyText.trim() })}
            >
              {replyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
