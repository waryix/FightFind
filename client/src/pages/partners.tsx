import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Navigation } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PartnerCard } from "@/components/partner-card";
import { SearchFilter } from "@/components/search-filter";
import { Users } from "lucide-react";

export default function Partners() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [searchFilters, setSearchFilters] = useState({});

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

  const { data: partners, isLoading: partnersLoading, error: partnersError } = useQuery({
    queryKey: ["/api/partners", searchFilters],
    enabled: !!user,
  });

  const connectMutation = useMutation({
    mutationFn: async (data: { receiverId: string; message?: string }) => {
      const response = await apiRequest("POST", "/api/connections", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection Sent",
        description: "Your connection request has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
        description: "Failed to send connection request. Please try again.",
        variant: "destructive",
      });
    },
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

  const handleConnect = (partnerId: string) => {
    connectMutation.mutate({
      receiverId: partnerId,
      message: "Hi! I'd like to connect for sparring. Let me know if you're interested!",
    });
  };

  const handleSearch = (filters: any) => {
    setSearchFilters(filters);
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-fight-black">Find Sparring Partners</h1>
          <p className="mt-2 text-gray-600">
            Connect with fighters in your area and skill level
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <SearchFilter onSearch={handleSearch} />
        </div>

        {/* Partners Grid */}
        <div className="mb-8">
          {partnersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-64 bg-gray-200"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : partners?.length > 0 ? (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Found {partners.length} sparring partner{partners.length !== 1 ? 's' : ''}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {partners.map((partner: any) => (
                  <PartnerCard 
                    key={partner.id} 
                    partner={{
                      id: partner.id,
                      user: partner.user,
                      discipline: partner.discipline,
                      experienceLevel: partner.experienceLevel,
                      location: partner.location,
                      weightClass: partner.weightClass,
                      bio: partner.bio,
                      rating: partner.rating || "0.0",
                      isOnline: Math.random() > 0.5, // Mock online status
                      isPro: partner.experienceLevel === "professional",
                    }}
                    onConnect={() => handleConnect(partner.user.id)}
                    disabled={connectMutation.isPending}
                  />
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No partners found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search filters or check back later for new fighters in your area.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchFilters({})}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Load More */}
        {partners && partners.length > 0 && (
          <div className="text-center">
            <Button 
              variant="outline" 
              size="lg"
              className="bg-fight-black text-white hover:bg-gray-800"
            >
              Load More Partners
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
