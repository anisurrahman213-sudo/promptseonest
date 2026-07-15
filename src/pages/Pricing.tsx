import { useState } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { PaymentDialog } from '@/components/PaymentDialog';
import { useAuth } from '@/hooks/useAuth';
import { usePricingPlans, PricingPlan } from '@/hooks/usePricingPlans';
import { Check, Sparkles, CreditCard, Crown, MessageSquare, Mail } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Pricing() {
  const { t } = useTranslation();
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
        <main className="container py-8 sm:py-16 px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <Skeleton className="h-5 sm:h-6 w-24 sm:w-32 mx-auto mb-3 sm:mb-4" />
            <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 mx-auto mb-3 sm:mb-4" />
            <Skeleton className="h-5 sm:h-6 w-72 sm:w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-72 sm:h-96 w-full rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Pricing Plans" description="Affordable pricing plans for AI-powered image SEO. Get credits to generate titles, descriptions and tags for your stock photos." path="/pricing" keywords="pricing, seo credits, stock photo seo pricing" />
      <Header />
      
      <main className="container py-8 sm:py-16 px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <Badge variant="secondary" className="mb-3 sm:mb-4 text-xs sm:text-sm">
            Simple Pricing
          </Badge>
          <h1 className="font-display text-2xl sm:text-4xl font-bold mb-3 sm:mb-4">
            Choose your plan
          </h1>
          <p className="text-muted-foreground text-sm sm:text-lg px-2">
            Start free and scale as you grow. Each credit = 1 image analyzed.
          </p>
        </div>

        <h2 className="sr-only">Available plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {plans?.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative ${plan.is_popular ? 'border-primary shadow-glow ring-2 ring-primary/20' : ''} ${plan.is_unlimited ? 'bg-gradient-to-b from-primary/5 to-transparent' : ''}`}
            >
              {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-primary flex items-center gap-1 text-xs sm:text-sm">
                    <Crown className="h-3 w-3" />
                    Best Value
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6 pt-5 sm:pt-6">
                <CardTitle className="font-display text-lg sm:text-xl flex items-center justify-center gap-1.5 sm:gap-2">
                  {plan.is_unlimited && <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">{plan.description}</CardDescription>
                <div className="pt-3 sm:pt-4">
                  <span className="font-display text-2xl sm:text-3xl font-bold">৳{plan.price_bdt.toLocaleString()}</span>
                  {plan.period && (
                    <span className="text-muted-foreground text-xs sm:text-sm">{plan.period}</span>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">(${plan.price_usd} USD)</p>
                <Badge variant={plan.is_unlimited ? 'default' : 'outline'} className={`mt-2 text-xs ${plan.is_unlimited ? 'bg-gradient-primary' : ''}`}>
                  {plan.credits}
                </Badge>
              </CardHeader>
              
              <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-5 sm:pb-6">
                <ul className="space-y-1.5 sm:space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 mt-0.5 ${plan.is_unlimited ? 'text-primary' : 'text-success'}`} />
                      <span className="text-xs sm:text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {plan.is_free ? (
                  <Link to="/auth?tab=signup">
                    <Button 
                      className="w-full h-10 sm:h-11 text-sm"
                      variant="outline"
                    >
                      <Sparkles className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Get Started Free
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    className={`w-full h-10 sm:h-11 text-sm ${plan.is_unlimited ? 'bg-gradient-primary hover:opacity-90 text-white' : ''}`}
                    variant={plan.is_popular ? 'default' : 'outline'}
                    onClick={() => handleBuyPlan(plan)}
                  >
                    {plan.is_unlimited ? <Crown className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <CreditCard className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                    {plan.is_unlimited ? 'Get Lifetime Access' : 'Buy Now'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 sm:mt-16 max-w-2xl mx-auto">
          <Card className="bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 border-primary/20">
            <CardContent className="p-6 sm:p-8 text-center">
              <h3 className="font-display text-lg sm:text-xl font-semibold mb-2">
                Need more credits or custom plans?
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base mb-6">
                Contact us for bulk pricing, enterprise solutions, or any questions
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <a
                  href="https://wa.me/8801711464759?text=Hi%2C%20I%20want%20to%20inquire%20about%20custom%20plans%20for%20Prompt%20SEO%20Nest"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full sm:w-auto gap-2 border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600">
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </Button>
                </a>
                <a href="mailto:anisurrahman213@gmail.com?subject=Custom%20Plan%20Inquiry%20-%20Prompt%20SEO%20Nest">
                  <Button variant="outline" className="w-full sm:w-auto gap-2">
                    <Mail className="h-4 w-4" />
                    Email Us
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
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