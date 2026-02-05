 import { useState, useEffect } from 'react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Loader2, Settings, Coins, Save } from 'lucide-react';
 import { useSiteSetting, useUpdateSiteSetting } from '@/hooks/useSiteSettings';
 import { toast } from 'sonner';
 
 export function CreditSettings() {
   const { data: creditSetting, isLoading } = useSiteSetting('credit_per_generation');
   const updateSetting = useUpdateSiteSetting();
   const [creditCost, setCreditCost] = useState('1');
 
   useEffect(() => {
     if (creditSetting?.setting_value) {
       setCreditCost(creditSetting.setting_value);
     }
   }, [creditSetting]);
 
   const handleSave = () => {
     const cost = parseInt(creditCost);
     if (isNaN(cost) || cost < 0) {
       toast.error('দয়া করে সঠিক সংখ্যা দিন');
       return;
     }
     updateSetting.mutate({ key: 'credit_per_generation', value: cost.toString() });
   };
 
   if (isLoading) {
     return (
       <Card>
         <CardContent className="py-8 flex justify-center">
           <Loader2 className="h-6 w-6 animate-spin text-primary" />
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card>
       <CardHeader>
         <CardTitle className="flex items-center gap-2">
           <Settings className="h-5 w-5" />
           Credit Settings
         </CardTitle>
         <CardDescription>
           প্রতি generation এ কত credit কাটবে সেটা নিয়ন্ত্রণ করুন
         </CardDescription>
       </CardHeader>
       <CardContent className="space-y-4">
         <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
           <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
             <Coins className="h-6 w-6 text-primary" />
           </div>
           <div className="flex-1">
             <Label htmlFor="credit-cost" className="text-sm font-medium">
               Credit Per Generation
             </Label>
             <p className="text-xs text-muted-foreground">
               প্রতিটি ছবি/ভিডিও metadata generate করতে এই পরিমাণ credit কাটা হবে
             </p>
           </div>
           <div className="flex items-center gap-2">
             <Input
               id="credit-cost"
               type="number"
               min="0"
               value={creditCost}
               onChange={(e) => setCreditCost(e.target.value)}
               className="w-24 text-center text-lg font-bold"
             />
             <Button 
               onClick={handleSave}
               disabled={updateSetting.isPending}
               className="gap-2"
             >
               {updateSetting.isPending ? (
                 <Loader2 className="h-4 w-4 animate-spin" />
               ) : (
                 <Save className="h-4 w-4" />
               )}
               Save
             </Button>
           </div>
         </div>
         
         <div className="grid grid-cols-3 gap-3">
           <button
             onClick={() => setCreditCost('0')}
             className={`p-3 rounded-lg border text-center transition-colors ${
               creditCost === '0' ? 'border-primary bg-primary/10' : 'hover:bg-muted'
             }`}
           >
             <p className="font-bold text-lg">0</p>
             <p className="text-xs text-muted-foreground">Free</p>
           </button>
           <button
             onClick={() => setCreditCost('1')}
             className={`p-3 rounded-lg border text-center transition-colors ${
               creditCost === '1' ? 'border-primary bg-primary/10' : 'hover:bg-muted'
             }`}
           >
             <p className="font-bold text-lg">1</p>
             <p className="text-xs text-muted-foreground">Default</p>
           </button>
           <button
             onClick={() => setCreditCost('2')}
             className={`p-3 rounded-lg border text-center transition-colors ${
               creditCost === '2' ? 'border-primary bg-primary/10' : 'hover:bg-muted'
             }`}
           >
             <p className="font-bold text-lg">2</p>
             <p className="text-xs text-muted-foreground">Premium</p>
           </button>
         </div>
         
         <p className="text-xs text-muted-foreground text-center">
           💡 Tip: 0 দিলে generation সম্পূর্ণ ফ্রি হয়ে যাবে
         </p>
       </CardContent>
     </Card>
   );
 }