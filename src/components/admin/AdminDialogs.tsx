import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const EMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
  custom: { subject: '', body: '' },
  welcome: {
    subject: 'Welcome to PromptSEONest!',
    body: 'Hi there,\n\nWelcome to PromptSEONest! We are excited to have you on board. Start generating SEO-optimized stock metadata in minutes.\n\nIf you have any questions, just reply to this email.\n\nBest regards,\nThe PromptSEONest Team',
  },
  reminder: {
    subject: 'A friendly reminder from PromptSEONest',
    body: 'Hi there,\n\nWe noticed you have not been active recently. Your generations are auto-deleted after 3 days, so make sure to export anything important.\n\nLog back in to keep creating: https://promptseonest.com\n\nBest regards,\nThe PromptSEONest Team',
  },
  account_update: {
    subject: 'Your PromptSEONest account update',
    body: 'Hi there,\n\nThis is an update regarding your PromptSEONest account.\n\n[Add details here]\n\nIf you have any questions, please reply to this email.\n\nBest regards,\nThe PromptSEONest Team',
  },
  credits_added: {
    subject: 'Credits added to your PromptSEONest account',
    body: 'Hi there,\n\nGood news! Credits have been added to your PromptSEONest account. Log in to start generating: https://promptseonest.com\n\nThank you for being part of our community.\n\nBest regards,\nThe PromptSEONest Team',
  },
};

interface AddCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  credits: string;
  setCredits: (v: string) => void;
  isPending: boolean;
  onSubmit: () => void;
}

export function AddCreditsDialog({ open, onOpenChange, email, credits, setCredits, isPending, onSubmit }: AddCreditsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Credits</DialogTitle>
          <DialogDescription>Add credits to user: <strong>{email}</strong></DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="credits">Number of Credits</Label>
            <Input id="credits" type="number" min="1" placeholder="Enter amount (e.g., 1000)" value={credits} onChange={(e) => setCredits(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit} disabled={isPending || !credits}>
            {isPending ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding...</>) : 'Add Credits'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailTo: string;
  subject: string;
  setSubject: (v: string) => void;
  body: string;
  setBody: (v: string) => void;
  isPending: boolean;
  onSubmit: () => void;
}

export function EmailDialog({ open, onOpenChange, emailTo, subject, setSubject, body, setBody, isPending, onSubmit }: EmailDialogProps) {
  const handleTemplateChange = (value: string) => {
    const tpl = EMAIL_TEMPLATES[value];
    if (!tpl) return;
    setSubject(tpl.subject);
    setBody(tpl.body);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>Send an email to: <strong className="break-all">{emailTo}</strong></DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email-template">Template</Label>
            <Select onValueChange={handleTemplateChange} defaultValue="custom">
              <SelectTrigger id="email-template">
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom (write your own)</SelectItem>
                <SelectItem value="welcome">👋 Welcome message</SelectItem>
                <SelectItem value="reminder">⏰ Activity reminder</SelectItem>
                <SelectItem value="account_update">📢 Account update</SelectItem>
                <SelectItem value="credits_added">💎 Credits added</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Pick a template to pre-fill, then edit as needed.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-subject">Subject</Label>
            <Input id="email-subject" placeholder="Enter email subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-body">Message</Label>
            <Textarea id="email-body" placeholder="Enter your message..." value={body} onChange={(e) => setBody(e.target.value)} rows={8} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit} disabled={isPending || !subject || !body}>
            {isPending ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>) : (<><Send className="h-4 w-4 mr-2" />Send Email</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  isPending: boolean;
  onConfirm: () => void;
}

export function DeleteUserDialog({ open, onOpenChange, email, isPending, onConfirm }: DeleteUserDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Are you sure you want to delete <strong>{email}</strong>?</p>
            <p className="text-destructive font-medium">This will permanently delete:</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              <li>User account & profile</li>
              <li>All generated images</li>
              <li>Payment history</li>
              <li>All other associated data</li>
            </ul>
            <p className="text-destructive text-sm font-medium">This action cannot be undone!</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isPending ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</>) : 'Delete User'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
