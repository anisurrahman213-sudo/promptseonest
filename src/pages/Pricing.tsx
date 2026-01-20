import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { PaymentDialog } from '@/components/PaymentDialog';
import { useAuth } from '@/hooks/useAuth';
import { usePricingPlans, PricingPlan } from '@/hooks/usePricingPlans';
import { Check, Sparkles, CreditCard, Crown, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Pricing() {
  const { user } = useAuth();
  const { data: plans, isLoading } = usePricingPlans();
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const handleBuyPlan = (plan: PricingPlan) => {
    if (!user) {
      window.location.href = '/auth?tab=signup';
      return;
    }
    setSelectedPlan(plan);
    setPaymentDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Skeleton className="h-6 w-32 mx-auto mb-4" />
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-96 w-full rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    );
  }

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
          {plans?.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative ${plan.is_popular ? 'border-primary shadow-glow ring-2 ring-primary/20' : ''} ${plan.is_unlimited ? 'bg-gradient-to-b from-primary/5 to-transparent' : ''}`}
            >
              {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-primary flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Best Value
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="font-display text-xl flex items-center justify-center gap-2">
                  {plan.is_unlimited && <Crown className="h-5 w-5 text-primary" />}
                  {plan.name}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-4">
                  <span className="font-display text-3xl font-bold">৳{plan.price_bdt.toLocaleString()}</span>
                  {plan.period && (
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">(${plan.price_usd} USD)</p>
                <Badge variant={plan.is_unlimited ? 'default' : 'outline'} className={`mt-2 ${plan.is_unlimited ? 'bg-gradient-primary' : ''}`}>
                  {plan.credits}
                </Badge>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className={`h-4 w-4 shrink-0 mt-0.5 ${plan.is_unlimited ? 'text-primary' : 'text-success'}`} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {plan.is_free ? (
                  <Link to="/auth?tab=signup">
                    <Button 
                      className="w-full"
                      variant="outline"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Get Started Free
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    className={`w-full ${plan.is_unlimited ? 'bg-gradient-primary hover:opacity-90 text-white' : ''}`}
                    variant={plan.is_popular ? 'default' : 'outline'}
                    onClick={() => handleBuyPlan(plan)}
                  >
                    {plan.is_unlimited ? <Crown className="mr-2 h-4 w-4" /> : <CreditCard className="mr-2 h-4 w-4" />}
                    {plan.is_unlimited ? 'Get Lifetime Access' : 'Buy Now'}
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
            price: `$${selectedPlan.price_usd}`,
            credits: selectedPlan.credits,
          }}
        />
      )}
    </div>
  );
}