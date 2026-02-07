import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Copy, CheckCircle, Loader2, Smartphone, Globe, MessageCircle, Mail } from 'lucide-react';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: {
    name: string;
    price: string;
    credits: string;
  };
}

const PAYMENT_NUMBERS = {
  bkash: '01711464759',
  nagad: '01711464759',
};

export function PaymentDialog({ open, onOpenChange, plan }: PaymentDialogProps) {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const amount = plan.price.replace('$', '');
  const amountBDT = parseInt(amount) * 120; // Approximate USD to BDT

  const copyNumber = async () => {
    await navigator.clipboard.writeText(PAYMENT_NUMBERS[paymentMethod]);
    setCopied(true);
    toast.success('Number copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please login first');
      return;
    }

    if (!transactionId.trim()) {
      toast.error('Please enter Transaction ID');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('payment_requests').insert({
        user_id: user.id,
        plan_name: plan.name,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        transaction_id: transactionId.trim(),
        status: 'pending',
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success('Payment request submitted!');
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setTransactionId('');
    onOpenChange(false);
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <DialogTitle className="text-xl mb-2">Request Submitted!</DialogTitle>
            <DialogDescription className="text-base">
              Your payment is being verified. Credits will be added within 1-24 hours.
            </DialogDescription>
            <Button onClick={handleClose} className="mt-6">
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Buy {plan.name} Plan
          </DialogTitle>
          <DialogDescription>
            {plan.credits} - ৳{amountBDT} (${amount})
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="space-y-6 py-4">
            {/* Payment Method Selection */}
            <div className="space-y-3">
              <Label>Select Payment Method</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as 'bkash' | 'nagad')}
                className="grid grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="bkash"
                  className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                    paymentMethod === 'bkash'
                      ? 'border-pink-500 bg-pink-500/10'
                      : 'border-muted hover:border-pink-500/50'
                  }`}
                >
                  <RadioGroupItem value="bkash" id="bkash" className="sr-only" />
                  <div className="text-2xl font-bold text-pink-500">bKash</div>
                </Label>
                <Label
                  htmlFor="nagad"
                  className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                    paymentMethod === 'nagad'
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-muted hover:border-orange-500/50'
                  }`}
                >
                  <RadioGroupItem value="nagad" id="nagad" className="sr-only" />
                  <div className="text-2xl font-bold text-orange-500">Nagad</div>
                </Label>
              </RadioGroup>
            </div>

            {/* Payment Instructions */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <h4 className="font-medium">Payment Instructions:</h4>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Send ৳{amountBDT} to the number below</li>
                <li>Copy the Transaction ID</li>
                <li>Enter the Transaction ID below</li>
              </ol>

              <div className="flex items-center gap-2 mt-4">
                <div className="flex-1 rounded-md bg-background px-3 py-2 font-mono text-lg">
                  {PAYMENT_NUMBERS[paymentMethod]}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyNumber}
                  className="shrink-0"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Transaction ID Input */}
            <div className="space-y-2">
              <Label htmlFor="transaction-id">Transaction ID</Label>
              <Input
                id="transaction-id"
                placeholder="e.g., TXN123456789"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !transactionId.trim()}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Confirm Payment'
              )}
            </Button>

            {/* International Users Section */}
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">Outside Bangladesh?</span>
              </div>
              <p className="text-xs text-muted-foreground">
                For international payments, please contact us directly:
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="https://wa.me/8801711464759?text=Hi%2C%20I%20want%20to%20buy%20credits%20for%20Prompt%20SEO%20Nest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-green-500 hover:underline"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp: +880 1711-464759
                </a>
                <a
                  href="mailto:anisurrahman213@gmail.com?subject=Credit%20Purchase%20Request"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  Email: anisurrahman213@gmail.com
                </a>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
