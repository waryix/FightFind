import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/ui/navigation";
import { PartnerCard } from "@/components/partner-card";
import { SearchFilter } from "@/components/search-filter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Users, MessageSquare, Calendar, Settings } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

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

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  const { data: recentPartners, isLoading: partnersLoading, error: partnersError } = useQuery({
    queryKey: ["/api/partners"],
    enabled: !!user,
  });

  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ["/api/connections"],
    enabled: !!user,
  });

  useEffect(() => {
    if (partnersError && isUnauthorizedError(partnersError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [partnersError, toast]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onLogout={handleLogout} />
      
      {/* Welcome Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-fight-black">
                Welcome back, {user?.firstName || 'Fighter'}!
              </h1>
              <p className="mt-2 text-gray-600">
                Ready to find your next sparring partner?
              </p>
            </div>
            {!profile && (
              <Link href="/profile">
                <Button className="bg-fight-red hover:bg-fight-red-dark">
                  Complete Your Profile
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-fight-red" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Partners</p>
                    <p className="text-2xl font-bold text-fight-black">
                      {connectionsLoading ? '...' : connections?.filter((c: any) => c.status === 'accepted').length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <MessageSquare className="h-8 w-8 text-fight-red" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">New Messages</p>
                    <p className="text-2xl font-bold text-fight-black">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-fight-red" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">This Week</p>
                    <p className="text-2xl font-bold text-fight-black">3</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Settings className="h-8 w-8 text-fight-red" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Profile</p>
                    <p className="text-sm font-bold text-fight-black">
                      {profile ? 'Complete' : 'Incomplete'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SearchFilter />
        </div>
      </section>

      {/* Recent Partners */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-fight-black">Recent Partners</h2>
            <Link href="/partners">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          
          {partnersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-64 bg-gray-200"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentPartners?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentPartners.slice(0, 3).map((partner: any) => (
                <PartnerCard 
                  key={partner.id} 
                  partner={partner} 
                  onConnect={() => {
                    // Handle connection logic
                  }} 
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No partners found</h3>
                <p className="text-gray-600 mb-4">Start searching for sparring partners in your area</p>
                <Link href="/partners">
                  <Button className="bg-fight-red hover:bg-fight-red-dark">
                    Find Partners
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
