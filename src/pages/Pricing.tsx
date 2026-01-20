import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { PaymentDialog } from '@/components/PaymentDialog';
import { useAuth } from '@/hooks/useAuth';
import { Check, Sparkles, CreditCard, Crown } from 'lucide-react';

const plans = [
  {
    name: 'Free Trial',
    price: '$0',
    priceBDT: '৳0',
    description: 'Try it out with free credits',
    credits: '10 credits',
    features: [
      '10 free credits on signup',
      'AI-powered prompt generation',
      'SEO optimized metadata',
      '40-50 relevant tags per image',
      'CSV export',
    ],
    cta: 'Get Started Free',
    popular: false,
    isFree: true,
    isUnlimited: false,
  },
  {
    name: 'Lite',
    price: '$9',
    priceBDT: '৳1,080',
    period: '/month',
    description: 'For regular creators',
    credits: '100 credits/month',
    features: [
      '100 credits per month',
      'Everything in Free',
      'Priority processing',
      'Bulk upload (up to 10 images)',
      'Download history',
    ],
    cta: 'Buy Now',
    popular: false,
    isFree: false,
    isUnlimited: false,
  },
  {
    name: 'Pro',
    price: '$29',
    priceBDT: '৳3,480',
    period: '/month',
    description: 'For power users',
    credits: '500 credits/month',
    features: [
      '500 credits per month',
      'Everything in Lite',
      'Faster processing',
      'Bulk upload (up to 50 images)',
      'CSV import & export',
      'API access (coming soon)',
    ],
    cta: 'Buy Now',
    popular: false,
    isFree: false,
    isUnlimited: false,
  },
  {
    name: 'Unlimited',
    price: '$50',
    priceBDT: '৳6,000',
    period: ' lifetime',
    description: 'Best value for professionals',
    credits: 'Unlimited credits',
    features: [
      'Unlimited metadata generation',
      'Lifetime access - never expires',
      'Upload up to 1000 files at once',
      'Batch generation access',
      'Priority support',
      'All current & future features',
      'No monthly fees ever',
    ],
    cta: 'Get Lifetime Access',
    popular: true,
    isFree: false,
    isUnlimited: true,
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const handleBuyPlan = (plan: typeof plans[0]) => {
    if (!user) {
      window.location.href = '/auth?tab=signup';
      return;
    }
    setSelectedPlan(plan);
    setPaymentDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-4">
            Simple Pricing
          </Badge>
          <h1 className="font-display text-4xl font-bold mb-4">
            Choose your plan
          </h1>
          <p className="text-muted-foreground text-lg">
            Start free and scale as you grow. Each credit = 1 image analyzed.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={`relative ${plan.popular ? 'border-primary shadow-glow ring-2 ring-primary/20' : ''} ${plan.isUnlimited ? 'bg-gradient-to-b from-primary/5 to-transparent' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-primary flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Best Value
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="font-display text-xl flex items-center justify-center gap-2">
                  {plan.isUnlimited && <Crown className="h-5 w-5 text-primary" />}
                  {plan.name}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-4">
                  <span className="font-display text-3xl font-bold">{plan.priceBDT}</span>
                  {plan.period && (
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">({plan.price} USD)</p>
                <Badge variant={plan.isUnlimited ? 'default' : 'outline'} className={`mt-2 ${plan.isUnlimited ? 'bg-gradient-primary' : ''}`}>
                  {plan.credits}
                </Badge>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className={`h-4 w-4 shrink-0 mt-0.5 ${plan.isUnlimited ? 'text-primary' : 'text-success'}`} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {plan.isFree ? (
                  <Link to="/auth?tab=signup">
                    <Button 
                      className="w-full"
                      variant="outline"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {plan.cta}
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    className={`w-full ${plan.isUnlimited ? 'bg-gradient-primary hover:opacity-90 text-white' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handleBuyPlan(plan)}
                  >
                    {plan.isUnlimited ? <Crown className="mr-2 h-4 w-4" /> : <CreditCard className="mr-2 h-4 w-4" />}
                    {plan.cta}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Need more credits or custom plans?{' '}
            <a href="mailto:support@promptnest.ai" className="text-primary hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </main>

      {selectedPlan && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          plan={{
            name: selectedPlan.name,
            price: selectedPlan.price,
            credits: selectedPlan.credits,
          }}
        />
      )}
    </div>
  );
}