import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Navigation } from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "You are subscribed!",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe}
        className="w-full bg-fight-red hover:bg-fight-red-dark"
      >
        Subscribe to Pro
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [clientSecret, setClientSecret] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("pro");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    if (user && selectedPlan === "pro") {
      // Create subscription as soon as the page loads
      apiRequest("POST", "/api/get-or-create-subscription")
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret);
        })
        .catch((error) => {
          if (isUnauthorizedError(error)) {
            toast({
              title: "Unauthorized",
              description: "You are logged out. Logging in again...",
              variant: "destructive",
            });
            setTimeout(() => {
              window.location.href = "/api/login";
            }, 500);
            return;
          }
          toast({
            title: "Error",
            description: "Failed to initialize payment. Please try again.",
            variant: "destructive",
          });
        });
    }
  }, [user, selectedPlan, toast]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (selectedPlan === "pro" && !clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation user={user} onLogout={handleLogout} />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-gray-600">Setting up your subscription...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onLogout={handleLogout} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-fight-black">Choose Your Plan</h1>
          <p className="mt-4 text-xl text-gray-600">Unlock premium features for serious fighters</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Basic Plan */}
          <Card className="relative">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-fight-black mb-4">Basic</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-fight-black">Free</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="text-green-500 mr-3" size={20} />
                  <span className="text-gray-700">Basic profile creation</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-green-500 mr-3" size={20} />
                  <span className="text-gray-700">Limited partner search</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-green-500 mr-3" size={20} />
                  <span className="text-gray-700">3 connections per week</span>
                </li>
              </ul>
              <Button 
                variant="outline" 
                className="w-full border-2 border-fight-red text-fight-red hover:bg-fight-red hover:text-white"
                onClick={() => setSelectedPlan("basic")}
              >
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative transform scale-105 bg-fight-red">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Badge className="bg-white text-fight-red">Most Popular</Badge>
            </div>
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white mb-4">Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$19</span>
                <span className="text-white/80">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="text-white mr-3" size={20} />
                  <span className="text-white">Unlimited connections</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-white mr-3" size={20} />
                  <span className="text-white">Advanced filtering</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-white mr-3" size={20} />
                  <span className="text-white">Priority matching</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-white mr-3" size={20} />
                  <span className="text-white">Direct messaging</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-white text-fight-red hover:bg-gray-100"
                onClick={() => setSelectedPlan("pro")}
              >
                {selectedPlan === "pro" ? "Selected" : "Choose Pro"}
              </Button>
            </CardContent>
          </Card>

          {/* Elite Plan */}
          <Card className="relative">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-fight-black mb-4">Elite</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-fight-black">$39</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="text-green-500 mr-3" size={20} />
                  <span className="text-gray-700">Everything in Pro</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-green-500 mr-3" size={20} />
                  <span className="text-gray-700">Video call integration</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-green-500 mr-3" size={20} />
                  <span className="text-gray-700">Training analytics</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-green-500 mr-3" size={20} />
                  <span className="text-gray-700">Professional coaching</span>
                </li>
              </ul>
              <Button 
                variant="outline" 
                className="w-full border-2 border-fight-red text-fight-red hover:bg-fight-red hover:text-white"
                onClick={() => setSelectedPlan("elite")}
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Payment Form */}
        {selectedPlan === "pro" && clientSecret && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Complete Your Pro Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Pro Monthly Subscription</span>
                  <span className="text-xl font-bold">$19.00</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Billed monthly • Cancel anytime</p>
              </div>

              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <SubscribeForm />
              </Elements>

              <p className="text-xs text-gray-500 text-center mt-4">
                By proceeding, you agree to our Terms of Service and Privacy Policy.
                Your subscription will automatically renew each month.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
