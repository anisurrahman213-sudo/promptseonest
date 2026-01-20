import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAdminPricingPlans, useCreatePlan, useUpdatePlan, useDeletePlan, PricingPlan } from '@/hooks/usePricingPlans';
import { Plus, Pencil, Trash2, Crown, GripVertical } from 'lucide-react';

export function PlanManagement() {
  const { data: plans, isLoading } = useAdminPricingPlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<PricingPlan | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    price_usd: 0,
    price_bdt: 0,
    period: '',
    description: '',
    credits: '',
    credits_amount: 0,
    features: '',
    is_free: false,
    is_unlimited: false,
    is_popular: false,
    is_active: true,
    sort_order: 0,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      price_usd: 0,
      price_bdt: 0,
      period: '',
      description: '',
      credits: '',
      credits_amount: 0,
      features: '',
      is_free: false,
      is_unlimited: false,
      is_popular: false,
      is_active: true,
      sort_order: plans?.length || 0,
    });
    setEditingPlan(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price_usd: plan.price_usd,
      price_bdt: plan.price_bdt,
      period: plan.period || '',
      description: plan.description,
      credits: plan.credits,
      credits_amount: plan.credits_amount,
      features: plan.features.join('\n'),
      is_free: plan.is_free,
      is_unlimited: plan.is_unlimited,
      is_popular: plan.is_popular,
      is_active: plan.is_active,
      sort_order: plan.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const planData = {
      name: formData.name,
      price_usd: formData.price_usd,
      price_bdt: formData.price_bdt,
      period: formData.period || null,
      description: formData.description,
      credits: formData.credits,
      credits_amount: formData.credits_amount,
      features: formData.features.split('\n').filter(f => f.trim()),
      is_free: formData.is_free,
      is_unlimited: formData.is_unlimited,
      is_popular: formData.is_popular,
      is_active: formData.is_active,
      sort_order: formData.sort_order,
    };

    if (editingPlan) {
      await updatePlan.mutateAsync({ id: editingPlan.id, ...planData });
    } else {
      await createPlan.mutateAsync(planData);
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (planToDelete) {
      await deletePlan.mutateAsync(planToDelete.id);
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading plans...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pricing Plans</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Plan
        </Button>
      </div>

      <div className="grid gap-4">
        {plans?.map((plan) => (
          <Card key={plan.id} className={`${!plan.is_active ? 'opacity-50' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <CardTitle className="text-lg flex items-center gap-2">
                    {plan.is_unlimited && <Crown className="h-4 w-4 text-primary" />}
                    {plan.name}
                  </CardTitle>
                  {plan.is_popular && <Badge className="bg-gradient-primary">Popular</Badge>}
                  {!plan.is_active && <Badge variant="secondary">Inactive</Badge>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(plan)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive"
                    onClick={() => {
                      setPlanToDelete(plan);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Price:</span>
                  <p className="font-semibold">৳{plan.price_bdt} (${plan.price_usd}){plan.period}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Credits:</span>
                  <p className="font-semibold">{plan.credits}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Credits Amount:</span>
                  <p className="font-semibold">{plan.credits_amount === -1 ? 'Unlimited' : plan.credits_amount}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Features:</span>
                  <p className="font-semibold">{plan.features.length} items</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Pro"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., For power users"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price_usd">Price (USD)</Label>
                <Input
                  id="price_usd"
                  type="number"
                  value={formData.price_usd}
                  onChange={(e) => setFormData({ ...formData, price_usd: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="price_bdt">Price (BDT)</Label>
                <Input
                  id="price_bdt"
                  type="number"
                  value={formData.price_bdt}
                  onChange={(e) => setFormData({ ...formData, price_bdt: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="period">Period</Label>
                <Input
                  id="period"
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  placeholder="e.g., /month, lifetime"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="credits">Credits Display</Label>
                <Input
                  id="credits"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                  placeholder="e.g., 500 credits/month"
                />
              </div>
              <div>
                <Label htmlFor="credits_amount">Credits Amount (-1 = unlimited)</Label>
                <Input
                  id="credits_amount"
                  type="number"
                  value={formData.credits_amount}
                  onChange={(e) => setFormData({ ...formData, credits_amount: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="features">Features (one per line)</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                rows={5}
                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_free"
                  checked={formData.is_free}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked })}
                />
                <Label htmlFor="is_free">Free Plan</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_unlimited"
                  checked={formData.is_unlimited}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_unlimited: checked })}
                />
                <Label htmlFor="is_unlimited">Unlimited</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_popular"
                  checked={formData.is_popular}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
                />
                <Label htmlFor="is_popular">Popular Badge</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmit}
              disabled={createPlan.isPending || updatePlan.isPending}
            >
              {editingPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete "{planToDelete?.name}"? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deletePlan.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
