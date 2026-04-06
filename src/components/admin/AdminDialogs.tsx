import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>Send an email to: <strong>{emailTo}</strong></DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email-subject">Subject</Label>
            <Input id="email-subject" placeholder="Enter email subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-body">Message</Label>
            <Textarea id="email-body" placeholder="Enter your message..." value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
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
