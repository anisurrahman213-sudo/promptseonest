import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Copy, 
  CheckCircle, 
  Loader2, 
  CreditCard, 
  Globe2, 
  MessageSquare, 
  Mail, 
  Shield, 
  Clock, 
  Sparkles,
  ArrowRight,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: {
    name: string;
    price: string;
    credits: string;
  };
}

const PAYMENT_METHODS = {
  bkash: {
    name: 'bKash',
    number: '01711464759',
    color: 'from-pink-500 to-pink-600',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500',
    textColor: 'text-pink-500',
  },
  nagad: {
    name: 'Nagad',
    number: '01711464759',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-500',
  },
};

type PaymentMethodType = keyof typeof PAYMENT_METHODS;

export function PaymentDialog({ open, onOpenChange, plan }: PaymentDialogProps) {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const amount = plan.price.replace('$', '');
  const amountBDT = parseInt(amount) * 120;
  const selectedMethod = PAYMENT_METHODS[paymentMethod];

  const copyNumber = async () => {
    await navigator.clipboard.writeText(selectedMethod.number);
    setCopied(true);
    toast.success('Number copied to clipboard!');
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
      toast.success('Payment request submitted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setTransactionId('');
    setStep(1);
    onOpenChange(false);
  };

  // Success State
  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md border-0 bg-gradient-to-b from-background to-muted/30">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30"
            >
              <CheckCircle className="h-10 w-10 text-white" />
            </motion.div>
            <DialogTitle className="text-2xl font-bold mb-3">Payment Submitted!</DialogTitle>
            <p className="text-muted-foreground mb-6 max-w-xs">
              Your payment is being verified. Credits will be added within <span className="text-foreground font-medium">1-24 hours</span>.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Shield className="h-4 w-4" />
              <span>Secure & Encrypted</span>
            </div>
            <Button onClick={handleClose} size="lg" className="px-8">
              Done
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 border-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 pt-6 pb-4">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <DialogHeader className="relative">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="secondary" className="mb-2">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {plan.name} Plan
                </Badge>
                <DialogTitle className="text-2xl font-bold">Complete Purchase</DialogTitle>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">${amount}</div>
                <div className="text-sm text-muted-foreground">৳{amountBDT.toLocaleString()}</div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-6 py-6 space-y-6">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Step Indicator */}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                    <span className="font-medium">Select Payment Method</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground mx-1" />
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-muted-foreground text-xs font-bold">2</div>
                    <span className="text-muted-foreground">Confirm Payment</span>
                  </div>

                  {/* Payment Method Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    {(Object.keys(PAYMENT_METHODS) as PaymentMethodType[]).map((method) => {
                      const m = PAYMENT_METHODS[method];
                      const isSelected = paymentMethod === method;
                      return (
                        <motion.button
                          key={method}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setPaymentMethod(method)}
                          className={`relative p-5 rounded-xl border-2 transition-all duration-200 ${
                            isSelected 
                              ? `${m.borderColor} ${m.bgColor}` 
                              : 'border-muted hover:border-muted-foreground/30'
                          }`}
                        >
                          {isSelected && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className={`absolute top-2 right-2 h-5 w-5 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center`}
                            >
                              <Check className="h-3 w-3 text-white" />
                            </motion.div>
                          )}
                          <div className={`text-2xl font-bold bg-gradient-to-br ${m.color} bg-clip-text text-transparent`}>
                            {m.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">Mobile Banking</div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Trust Badges */}
                  <div className="flex items-center justify-center gap-6 py-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Shield className="h-3.5 w-3.5" />
                      <span>Secure</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Instant Verification</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>Local Payment</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => setStep(2)} 
                    size="lg" 
                    className="w-full"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <Separator />

                  {/* International Section */}
                  <div className="rounded-xl bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Globe2 className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">International Payments</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      For payments outside Bangladesh, contact us via:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href="https://wa.me/8801711464759?text=Hi%2C%20I%20want%20to%20buy%20credits%20for%20Prompt%20SEO%20Nest"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors text-xs font-medium"
                      >
                        <MessageSquare className="h-3 w-3" />
                        WhatsApp
                      </a>
                      <a
                        href="mailto:anisurrahman213@gmail.com?subject=Credit%20Purchase%20Request"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium"
                      >
                        <Mail className="h-3 w-3" />
                        Email
                      </a>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Step Indicator */}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-muted-foreground">Payment Method</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground mx-1" />
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
                    <span className="font-medium">Confirm Payment</span>
                  </div>

                  {/* Selected Method Display */}
                  <div className={`rounded-xl ${selectedMethod.bgColor} border ${selectedMethod.borderColor} p-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Send to {selectedMethod.name}</div>
                        <div className="text-2xl font-bold font-mono mt-1">{selectedMethod.number}</div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={copyNumber}
                        className="shrink-0"
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1.5 text-emerald-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1.5" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <div className={`text-lg font-semibold ${selectedMethod.textColor} mt-3`}>
                      Amount: ৳{amountBDT.toLocaleString()}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-xs">i</span>
                      Quick Instructions
                    </h4>
                    <ol className="space-y-2">
                      {[
                        `Open ${selectedMethod.name} app and send ৳${amountBDT.toLocaleString()}`,
                        'Copy the Transaction ID from your receipt',
                        'Paste it below and confirm'
                      ].map((instruction, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className={`flex items-center justify-center h-5 w-5 rounded-full bg-gradient-to-br ${selectedMethod.color} text-white text-xs shrink-0 mt-0.5`}>
                            {i + 1}
                          </span>
                          {instruction}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Transaction ID Input */}
                  <div className="space-y-2">
                    <Label htmlFor="transaction-id" className="text-sm font-medium">
                      Transaction ID
                    </Label>
                    <Input
                      id="transaction-id"
                      placeholder="Enter your transaction ID"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !transactionId.trim()}
                      className="flex-[2]"
                      size="lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Confirm Payment
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted/30 border-t">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              256-bit SSL
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              24hr Support
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
