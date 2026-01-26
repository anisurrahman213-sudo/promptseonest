import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Image,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  TrendingUp,
  Calendar,
  FileImage,
  Loader2,
} from 'lucide-react';
import { useCustomerHistory } from '@/hooks/useCustomerHistory';

interface CustomerInfo {
  user_id: string;
  email: string;
  phone_number: string | null;
  full_name: string | null;
  credits: number;
}

interface CustomerHistoryDialogProps {
  customer: CustomerInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerHistoryDialog({
  customer,
  open,
  onOpenChange,
}: CustomerHistoryDialogProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: history, isLoading } = useCustomerHistory(customer?.user_id || null);

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {customer.full_name || 'Customer'}
              </h2>
              <p className="text-sm text-muted-foreground font-normal">
                {customer.email}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Payments
              {history && history.totalPayments > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {history.totalPayments}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="generations" className="gap-2">
              <FileImage className="h-4 w-4" />
              Generations
              {history && history.totalGenerations > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {history.totalGenerations}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="py-8 space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-4 space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    icon={<CreditCard className="h-5 w-5" />}
                    label="Current Credits"
                    value={customer.credits.toLocaleString()}
                    color="primary"
                  />
                  <StatCard
                    icon={<DollarSign className="h-5 w-5" />}
                    label="Total Spent"
                    value={`৳${history?.totalSpent.toLocaleString() || 0}`}
                    color="success"
                  />
                  <StatCard
                    icon={<CheckCircle className="h-5 w-5" />}
                    label="Approved Payments"
                    value={history?.approvedPayments || 0}
                    color="success"
                  />
                  <StatCard
                    icon={<Image className="h-5 w-5" />}
                    label="Total Generations"
                    value={history?.totalGenerations || 0}
                    color="primary"
                  />
                </div>

                {/* Contact Info */}
                <Card>
                  <CardContent className="pt-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{customer.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{customer.phone_number || 'Not provided'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardContent className="pt-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recent Activity
                    </h3>
                    <div className="space-y-2">
                      {history?.generations.slice(0, 3).map((gen) => (
                        <div
                          key={gen.id}
                          className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                        >
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-muted">
                            <img
                              src={gen.image_url}
                              alt={gen.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{gen.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(gen.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))}
                      {(!history?.generations || history.generations.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No recent activity
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payments Tab */}
              <TabsContent value="payments" className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    <AnimatePresence>
                      {history?.payments.map((payment, index) => (
                        <motion.div
                          key={payment.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card>
                            <CardContent className="py-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{payment.plan_name}</span>
                                    <StatusBadge status={payment.status} />
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    ৳{payment.amount} via {payment.payment_method}
                                  </p>
                                  {payment.transaction_id && (
                                    <p className="text-xs font-mono text-muted-foreground">
                                      TXN: {payment.transaction_id}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(payment.created_at), 'dd MMM yyyy')}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(payment.created_at), 'hh:mm a')}
                                  </p>
                                </div>
                              </div>
                              {payment.admin_notes && (
                                <div className="mt-2 p-2 rounded bg-muted/50 text-sm">
                                  <span className="text-muted-foreground">Notes: </span>
                                  {payment.admin_notes}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {(!history?.payments || history.payments.length === 0) && (
                      <div className="text-center py-12">
                        <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No payment history</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Generations Tab */}
              <TabsContent value="generations" className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <AnimatePresence>
                      {history?.generations.map((gen, index) => (
                        <motion.div
                          key={gen.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.03 }}
                          className="group relative rounded-lg overflow-hidden border bg-card"
                        >
                          <div className="aspect-square">
                            <img
                              src={gen.image_url}
                              alt={gen.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <p className="text-white text-sm font-medium truncate">
                                {gen.title}
                              </p>
                              <p className="text-white/70 text-xs">
                                {formatDistanceToNow(new Date(gen.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  {(!history?.generations || history.generations.length === 0) && (
                    <div className="text-center py-12">
                      <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No generations yet</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'primary' | 'success';
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`text-${color}`}>{icon}</div>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: 'default' | 'destructive' | 'secondary'; icon: React.ReactNode }> = {
    approved: {
      variant: 'default',
      icon: <CheckCircle className="h-3 w-3 mr-1" />,
    },
    rejected: {
      variant: 'destructive',
      icon: <XCircle className="h-3 w-3 mr-1" />,
    },
    pending: {
      variant: 'secondary',
      icon: <Clock className="h-3 w-3 mr-1" />,
    },
  };

  const config = variants[status] || variants.pending;

  return (
    <Badge variant={config.variant} className="text-xs">
      {config.icon}
      {status}
    </Badge>
  );
}
