import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigation } from "@/components/ui/navigation";
import { Shield, Users, MessageSquare } from "lucide-react";

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  provider: string;
  emailVerified: boolean;
}

const API_BASE_URL = 'http://localhost:5000';

async function callApi(path: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
}

async function fetchOAuthUserData(): Promise<UserData> {
  return callApi('/api/auth/oauth/user');
}

function Auth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const oauth = params.get('oauth');
        const errorParam = params.get('error');
        const provider = params.get('provider');

        console.log('🔍 [OAuth Debug] Auth page loaded with params:', { oauth, provider, error: errorParam });

        if (errorParam) {
          let errorMessage = "Failed to authenticate with Google.";
          
          switch (errorParam) {
            case 'google_email_not_verified':
              errorMessage = "Your Google email is not verified. Please verify your email with Google first.";
              break;
            case 'google_oauth_denied':
              errorMessage = "Google authentication was cancelled or denied.";
              break;
            case 'google_token_exchange_failed':
              errorMessage = "Failed to exchange Google authorization code. Please try again.";
              break;
            case 'google_user_info_failed':
              errorMessage = "Failed to retrieve your Google profile information.";
              break;
            case 'oauth_config_missing':
              errorMessage = "Google OAuth is not properly configured. Please contact support.";
              break;
            default:
              errorMessage = `Authentication error: ${errorParam.replace(/_/g, ' ')}`;
          }
          
          toast({
            title: "Authentication Error",
            description: errorMessage,
            variant: "destructive",
          });
          
          // Clean up URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }

        if (oauth === 'success' && provider === 'google') {
          setIsLoading(true);
          try {
            const userData = await fetchOAuthUserData();
            
            if (!userData) {
              throw new Error('No user data received');
            }
            
            console.log('✅ [OAuth] User data received:', { ...userData, email: userData.email.substring(0, 3) + '...' });
            
            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('isAuthenticated', 'true');
            
            toast({
              title: "Login Successful",
              description: `Welcome ${userData.firstName}! You've been successfully logged in.`,
            });

            // Clean up URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Redirect to home page
            setTimeout(() => {
              setLocation('/');
            }, 1500);
          } catch (error) {
            console.error('❌ [OAuth] Error:', error);
            toast({
              title: "Authentication Error",
              description: "Failed to process login data. Please try again.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('❌ [OAuth] Error:', error);
        toast({
          title: "Authentication Error",
          description: "An unexpected error occurred during authentication. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    handleAuthCallback();
  }, [toast, setLocation]);

  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to login');
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('isAuthenticated', 'true');

      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });

      setLocation('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to login',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign up');
      }

      toast({
        title: 'Success',
        description: 'Account created successfully',
      });

      // Automatically log in after successful registration
      await handleLogin(e);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sign up',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fight-black via-fight-gray to-fight-black">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Join FightFind
            </h1>
            <p className="text-gray-300 text-lg">
              Connect with fighters worldwide
            </p>
          </div>

          <Card className="bg-fight-gray border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-center">Get Started</CardTitle>
              <CardDescription className="text-center text-gray-300">
                Sign up or log in to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signup" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-fight-black">
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  <TabsTrigger value="login">Log In</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signup" className="space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">Create Account</h2>
                    <p className="text-fight-gray-light">Join the FightFind community</p>
                  </div>
                  
                  <div className="space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="w-full bg-white/10 border-fight-gray hover:bg-white/20 text-white"
                    >
                      <GoogleIcon />
                      <span className="ml-2">Continue with Google</span>
                    </Button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-fight-gray" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-fight-black px-2 text-fight-gray-light">Or continue with email</span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName" className="text-white">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="bg-fight-black border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-white">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="bg-fight-black border-gray-600 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-white">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="bg-fight-black border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password" className="text-white">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="bg-fight-black border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="bg-fight-black border-gray-600 text-white"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-fight-red hover:bg-fight-red-dark text-white"
                    >
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="login" className="space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                    <p className="text-fight-gray-light">Sign in to your account</p>
                  </div>
                  
                  <div className="space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="w-full bg-white/10 border-fight-gray hover:bg-white/20 text-white"
                    >
                      <GoogleIcon />
                      <span className="ml-2">Continue with Google</span>
                    </Button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-fight-gray" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-fight-black px-2 text-fight-gray-light">Or continue with email</span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="loginEmail" className="text-white">Email</Label>
                      <Input
                        id="loginEmail"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="bg-fight-black border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="loginPassword" className="text-white">Password</Label>
                      <Input
                        id="loginPassword"
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="bg-fight-black border-gray-600 text-white"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-fight-red hover:bg-fight-red-dark text-white"
                    >
                      {isLoading ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <div className="flex items-center justify-center space-x-6 text-fight-gray-light">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Secure</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Community</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Connect</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
