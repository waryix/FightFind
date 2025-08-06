import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Navigation } from "@/components/ui/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CheckCircle, CreditCard, Smartphone, Globe, IndianRupee, DollarSign } from "lucide-react";

interface PricingPlan {
  name: string;
  features: string[];
  popular?: boolean;
}

interface PaymentMethods {
  methods: string[];
  cards?: string[];
  upi?: string[];
  description: string;
}

interface PricingData {
  [key: string]: {
    usd: { amount: number; display: string };
    inr: { amount: number; display: string };
  };
}

const pricingPlans: Record<string, PricingPlan> = {
  basic: {
    name: "Basic",
    features: [
      "Access to basic fight finder",
      "View gym locations",
      "Basic messaging",
      "Profile creation"
    ]
  },
  premium: {
    name: "Premium",
    features: [
      "Everything in Basic",
      "Advanced fight matching",
      "Priority messaging",
      "Detailed analytics",
      "Custom training plans"
    ],
    popular: true
  },
  pro: {
    name: "Pro",
    features: [
      "Everything in Premium",
      "Professional coaching access",
      "Tournament notifications",
      "Advanced statistics",
      "Priority support",
      "Custom branding"
    ]
  }
};

const PaymentMethodCard = ({ method, currency, onSelect, selected }: {
  method: string;
  currency: string;
  onSelect: (method: string) => void;
  selected: boolean;
}) => {
  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCard className="h-6 w-6" />;
      case 'upi':
        return <Smartphone className="h-6 w-6" />;
      default:
        return <Globe className="h-6 w-6" />;
    }
  };

  const getMethodName = (method: string) => {
    switch (method) {
      case 'card':
        return currency === 'inr' ? 'Cards (Visa, Mastercard, RuPay)' : 'Cards (Visa, Mastercard, Amex)';
      case 'upi':
        return 'UPI (PhonePe, Google Pay, Paytm, BHIM)';
      default:
        return method;
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        selected ? 'ring-2 ring-fight-red border-fight-red' : ''
      }`}
      onClick={() => onSelect(method)}
    >
      <CardContent className="flex items-center space-x-3 p-4">
        {getMethodIcon(method)}
        <div className="flex-1">
          <h4 className="font-medium">{getMethodName(method)}</h4>
          {method === 'upi' && (
            <p className="text-sm text-muted-foreground">
              Pay with UPI ID or scan QR code
            </p>
          )}
        </div>
        {selected && <CheckCircle className="h-5 w-5 text-fight-red" />}
      </CardContent>
    </Card>
  );
};

export default function Subscribe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCurrency, setSelectedCurrency] = useState<'usd' | 'inr'>('usd');
  const [selectedPlan, setSelectedPlan] = useState<string>('premium');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods | null>(null);
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch payment methods and pricing
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        const response = await apiRequest(`/api/payment/methods?currency=${selectedCurrency}`);
        if (response.ok) {
          const data = await response.json();
          setPaymentMethods(data.paymentMethods);
          setPricing(data.pricing);
        }
      } catch (error) {
        console.error('Failed to fetch payment data:', error);
      }
    };

    fetchPaymentData();
  }, [selectedCurrency]);

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: selectedCurrency,
          paymentMethod: selectedPaymentMethod,
          planType: selectedPlan
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fight-black via-fight-gray to-fight-black">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Please log in to subscribe
            </h1>
            <p className="text-gray-300 mb-8">
              You need to be logged in to access subscription plans.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    
    // Trigger storage event for other components to update
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'isAuthenticated',
      oldValue: 'true',
      newValue: null,
      storageArea: localStorage
    }));
    
    // Simple redirect without reload to avoid routing conflicts
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fight-black via-fight-gray to-fight-black">
      <Navigation 
        user={user}
        onLogin={() => window.location.href = '/auth'}
        onLogout={handleLogout}
      />
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-gray-300 text-lg">
            Unlock the full potential of FightFind with multi-currency payments
          </p>
        </div>

        {/* Currency Selection */}
        <div className="max-w-md mx-auto mb-8">
          <Card className="bg-fight-gray border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-center flex items-center justify-center gap-2">
                <Globe className="h-5 w-5" />
                Select Currency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedCurrency} onValueChange={(value: string) => setSelectedCurrency(value as 'usd' | 'inr')}>
                <TabsList className="grid w-full grid-cols-2 bg-fight-black">
                  <TabsTrigger value="usd" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    USD
                  </TabsTrigger>
                  <TabsTrigger value="inr" className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />
                    INR
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {Object.entries(pricingPlans).map(([planKey, plan]) => {
            const planPricing = pricing?.[planKey];
            const currentPrice = planPricing?.[selectedCurrency];
            const isSelected = selectedPlan === planKey;
            
            return (
              <Card 
                key={planKey}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isSelected 
                    ? 'bg-fight-gray border-fight-red ring-2 ring-fight-red' 
                    : plan.popular 
                    ? 'bg-fight-gray border-fight-red' 
                    : 'bg-fight-gray border-gray-700'
                }`}
                onClick={() => setSelectedPlan(planKey)}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-fight-red">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-white text-xl flex items-center justify-between">
                    {plan.name}
                    {isSelected && <CheckCircle className="h-5 w-5 text-fight-red" />}
                  </CardTitle>
                  <div className="text-3xl font-bold text-white">
                    {currentPrice?.display || '$0'}
                    <span className="text-lg font-normal text-gray-400">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-gray-300">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-fight-red mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Payment Methods */}
        <div className="max-w-2xl mx-auto mb-8">
          <Card className="bg-fight-gray border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-center">
                Payment Methods
              </CardTitle>
              <CardDescription className="text-center text-gray-300">
                {paymentMethods?.description || 'Select your preferred payment method'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {paymentMethods?.methods.map((method: string) => (
                  <PaymentMethodCard
                    key={method}
                    method={method}
                    currency={selectedCurrency}
                    selected={selectedPaymentMethod === method}
                    onSelect={setSelectedPaymentMethod}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Button */}
        <div className="max-w-md mx-auto">
          <Card className="bg-fight-gray border-gray-700">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <h3 className="text-white text-lg font-semibold mb-2">
                  {pricingPlans[selectedPlan]?.name} Plan
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  Pay with {selectedPaymentMethod === 'upi' ? 'UPI' : 'Card'} in {selectedCurrency.toUpperCase()}
                </p>
                <div className="text-2xl font-bold text-white">
                  {pricing?.[selectedPlan]?.[selectedCurrency]?.display || '$0'}/month
                </div>
              </div>
              
              <Button 
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-fight-red hover:bg-fight-red-dark text-white font-semibold py-3"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </div>
                ) : (
                  `Subscribe with ${selectedPaymentMethod === 'upi' ? 'UPI' : 'Card'}`
                )}
              </Button>
              
              {selectedCurrency === 'inr' && selectedPaymentMethod === 'upi' && (
                <p className="text-xs text-gray-400 text-center mt-3">
                  Supports PhonePe, Google Pay, Paytm, BHIM, and UPI ID
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
