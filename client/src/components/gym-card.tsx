import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Phone, Globe } from "lucide-react";

interface GymCardProps {
  gym: {
    id: string;
    name: string;
    rating: string;
    reviewCount: number;
    distance: string;
    description: string;
    address?: string;
    phone?: string;
    website?: string;
  };
}

export function GymCard({ gym }: GymCardProps) {
  const handleVisit = () => {
    if (gym.website) {
      window.open(gym.website, '_blank');
    }
  };

  const handleCall = () => {
    if (gym.phone) {
      window.location.href = `tel:${gym.phone}`;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-fight-black mb-2">
              {gym.name}
            </h3>
            
            <div className="flex items-center mb-3">
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="ml-1 text-sm text-gray-600">
                  {gym.rating} ({gym.reviewCount} reviews)
                </span>
              </div>
              <span className="mx-2 text-gray-300">•</span>
              <span className="text-sm text-gray-600">{gym.distance}</span>
            </div>

            {gym.address && (
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <MapPin className="w-4 h-4 text-fight-red mr-2" />
                <span>{gym.address}</span>
              </div>
            )}

            {gym.phone && (
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Phone className="w-4 h-4 text-fight-red mr-2" />
                <button 
                  onClick={handleCall}
                  className="hover:text-fight-red transition-colors"
                >
                  {gym.phone}
                </button>
              </div>
            )}

            {gym.website && (
              <div className="flex items-center text-sm text-gray-600 mb-3">
                <Globe className="w-4 h-4 text-fight-red mr-2" />
                <button 
                  onClick={handleVisit}
                  className="hover:text-fight-red transition-colors"
                >
                  Visit Website
                </button>
              </div>
            )}
            
            <p className="text-gray-600 mb-4">{gym.description}</p>
          </div>
          
          <div className="ml-4 flex flex-col space-y-2">
            <Button 
              className="bg-fight-red hover:bg-fight-red-dark text-white"
              onClick={handleVisit}
            >
              Visit
            </Button>
            {gym.phone && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCall}
              >
                Call
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
