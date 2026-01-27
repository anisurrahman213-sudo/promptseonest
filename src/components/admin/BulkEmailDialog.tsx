import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Mail, Users, AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BulkEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUsers: Array<{ email: string; full_name: string | null }>;
}

const EMAIL_TEMPLATES = [
  { id: 'custom', name: 'Custom Message', subject: '', body: '' },
  { 
    id: 'welcome', 
    name: 'Welcome Message', 
    subject: 'Welcome to PromptNest!',
    body: `Hi {name},

Welcome to PromptNest! We're excited to have you on board.

Start generating professional metadata for your images today. If you have any questions, feel free to reach out.

Best regards,
The PromptNest Team`
  },
  { 
    id: 'low_credits', 
    name: 'Low Credits Reminder', 
    subject: 'Your PromptNest Credits are Running Low',
    body: `Hi {name},

We noticed your credits are running low. Don't let your workflow stop!

Upgrade your plan today to continue generating metadata for your images without interruption.

Visit our pricing page to explore our plans.

Best regards,
The PromptNest Team`
  },
  { 
    id: 'new_feature', 
    name: 'New Feature Announcement', 
    subject: 'Exciting New Feature on PromptNest!',
    body: `Hi {name},

We're thrilled to announce a new feature on PromptNest!

[Describe the new feature here]

Log in to your dashboard to try it out.

Best regards,
The PromptNest Team`
  },
  { 
    id: 'promotion', 
    name: 'Special Promotion', 
    subject: 'Exclusive Offer Just for You!',
    body: `Hi {name},

As a valued member of PromptNest, we have an exclusive offer just for you!

[Describe the promotion here]

Don't miss out - this offer is for a limited time only.

Best regards,
The PromptNest Team`
  },
];

export function BulkEmailDialog({ open, onOpenChange, selectedUsers }: BulkEmailDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0 });

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  };

  const sendBulkEmailMutation = useMutation({
    mutationFn: async () => {
      if (!subject || !body) {
        throw new Error('Subject and body are required');
      }

      const total = selectedUsers.length;
      setSendProgress({ sent: 0, total });
      
      let successCount = 0;
      let failCount = 0;

      for (const user of selectedUsers) {
        const personalizedBody = body.replace(/{name}/g, user.full_name || 'Valued Customer');
        const personalizedHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            ${personalizedBody.split('\n').map(line => `<p style="margin: 0 0 10px 0;">${line || '&nbsp;'}</p>`).join('')}
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">Best regards,<br>The PromptNest Team</p>
          </div>
        `;

        try {
          await supabase.functions.invoke('send-email', {
            body: {
              to: user.email,
              subject,
              html: personalizedHtml,
            }
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to send email to ${user.email}:`, error);
          failCount++;
        }
        
        setSendProgress({ sent: successCount + failCount, total });
      }

      return { successCount, failCount };
    },
    onSuccess: (result) => {
      if (result.failCount === 0) {
        toast.success(`Successfully sent ${result.successCount} emails!`);
      } else {
        toast.warning(`Sent ${result.successCount} emails. ${result.failCount} failed.`);
      }
      onOpenChange(false);
      setSubject('');
      setBody('');
      setSelectedTemplate('custom');
      setSendProgress({ sent: 0, total: 0 });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send emails');
    },
  });

  const isSending = sendBulkEmailMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email to Customers
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 mt-2">
              <Users className="h-4 w-4" />
              <span>Sending to {selectedUsers.length} recipient{selectedUsers.length !== 1 ? 's' : ''}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipients Preview */}
          <div className="space-y-2">
            <Label>Recipients</Label>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-2 border rounded-md bg-muted/50">
              {selectedUsers.slice(0, 10).map((user, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {user.email}
                </Badge>
              ))}
              {selectedUsers.length > 10 && (
                <Badge variant="outline" className="text-xs">
                  +{selectedUsers.length - 10} more
                </Badge>
              )}
            </div>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Email Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter email subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Message</Label>
              <span className="text-xs text-muted-foreground">
                Use {'{name}'} for personalization
              </span>
            </div>
            <Textarea
              id="body"
              placeholder="Enter your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
            />
          </div>

          {/* Warning for bulk email */}
          {selectedUsers.length > 5 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-600">Bulk Email Notice</p>
                <p className="text-muted-foreground">
                  You're about to send emails to {selectedUsers.length} users. This may take a few moments.
                </p>
              </div>
            </div>
          )}

          {/* Progress */}
          {isSending && sendProgress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sending emails...</span>
                <span>{sendProgress.sent} / {sendProgress.total}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(sendProgress.sent / sendProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button 
            onClick={() => sendBulkEmailMutation.mutate()} 
            disabled={isSending || !subject || !body || selectedUsers.length === 0}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send {selectedUsers.length} Email{selectedUsers.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
