import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Navigation } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GymCard } from "@/components/gym-card";
import { MapPin } from "lucide-react";

export default function Gyms() {
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

  const { data: gyms, isLoading: gymsLoading, error: gymsError } = useQuery({
    queryKey: ["/api/gyms"],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/gyms', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch gyms');
      }
      
      return response.json();
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (gymsError && isUnauthorizedError(gymsError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [gymsError, toast]);

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
          <h1 className="text-3xl font-bold text-fight-black">Training Locations</h1>
          <p className="mt-2 text-gray-600">
            Find gyms and training facilities near you
          </p>
        </div>

        {/* Hero Image */}
        <div className="mb-12">
          <div 
            className="rounded-xl overflow-hidden shadow-lg h-64 md:h-96 relative"
            style={{ 
              backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600')", 
              backgroundSize: "cover", 
              backgroundPosition: "center" 
            }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="text-center text-white">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">Train at the Best Facilities</h2>
                <p className="text-xl">Professional gyms with experienced trainers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gyms List */}
        {gymsLoading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : gyms?.length > 0 ? (
          <div className="space-y-6">
            {gyms.map((gym: any) => (
              <GymCard 
                key={gym.id} 
                gym={{
                  id: gym.id,
                  name: gym.name,
                  rating: gym.rating || "4.5",
                  reviewCount: gym.totalRatings || 0,
                  distance: "2.5 miles away", // Mock distance
                  description: gym.description || "Professional training facility",
                  address: gym.address,
                  phone: gym.phone,
                  website: gym.website,
                }}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No gyms found</h3>
              <p className="text-gray-600 mb-4">
                We're working on adding more training facilities in your area.
              </p>
              <Button className="bg-fight-red hover:bg-fight-red-dark">
                Request Gym Addition
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
