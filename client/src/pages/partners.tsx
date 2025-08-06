import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
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
    queryFn: async () => {
      console.log('🔍 [Partners] Fetching partners from backend...');
      const response = await fetch('http://localhost:5000/api/partners', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch partners');
      }
      const data = await response.json();
      console.log('✅ [Partners] Received', data.length, 'partners from backend');
      return data;
    },
    enabled: !!user,
  });

  const connectMutation = useMutation({
    mutationFn: async (data: { receiverId: string; message?: string }) => {
      console.log('🔍 [Partners] Sending connection request:', data);
      const response = await fetch('http://localhost:5000/api/connections', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to send connection request');
      }
      const result = await response.json();
      console.log('✅ [Partners] Connection request sent successfully');
      return result;
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

  const handleConnect = (partnerId: string) => {
    connectMutation.mutate({
      receiverId: partnerId,
      message: "Hi! I'd like to connect for sparring. Let me know if you're interested!",
    });
  };

  const handleMessage = (partnerId: string) => {
    // Create a connection for messaging and redirect to messages page
    connectMutation.mutate({
      receiverId: partnerId,
      message: "Hi! I'd like to start a conversation with you.",
    }, {
      onSuccess: () => {
        // Redirect to messages page after connection is created
        setTimeout(() => {
          window.location.href = "/messages";
        }, 1000);
      }
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
                {partners.map((partner: any) => {
                  // Add debugging and null checks
                  console.log('🔍 [Partners] Rendering partner:', partner);
                  
                  // Ensure user object exists
                  const user = partner.user || {
                    id: partner.id,
                    firstName: partner.firstName || 'Unknown',
                    lastName: partner.lastName || 'User',
                    profileImageUrl: null
                  };
                  
                  return (
                    <PartnerCard 
                      key={partner.id} 
                      partner={{
                        id: partner.id,
                        user: user,
                        discipline: partner.discipline || 'Mixed Martial Arts',
                        experienceLevel: partner.experienceLevel || 'Beginner',
                        location: partner.location || 'Unknown Location',
                        weightClass: partner.weightClass,
                        bio: partner.bio,
                        rating: partner.rating || "4.5",
                        isOnline: partner.isOnline || Math.random() > 0.5,
                        isPro: partner.isPro || partner.experienceLevel === "professional",
                      }}
                      onConnect={() => handleConnect(user.id)}
                      onMessage={() => handleMessage(user.id)}
                      disabled={connectMutation.isPending}
                    />
                  );
                })}
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
