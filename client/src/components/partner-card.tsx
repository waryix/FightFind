import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MapPin, Weight, MessageSquare } from "lucide-react";

interface PartnerCardProps {
  partner: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      profileImageUrl?: string;
    };
    discipline: string;
    experienceLevel: string;
    location: string;
    weightClass?: string;
    bio?: string;
    rating: string;
    isOnline?: boolean;
    isPro?: boolean;
  };
  onConnect: () => void;
  onMessage?: () => void;
  disabled?: boolean;
}

export function PartnerCard({ partner, onConnect, onMessage, disabled }: PartnerCardProps) {
  const getExperienceColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-blue-100 text-blue-800";
      case "advanced":
        return "bg-orange-100 text-orange-800";
      case "professional":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDisciplineIcon = (discipline: string) => {
    // Return appropriate emoji or icon based on discipline
    switch (discipline) {
      case "boxing":
        return "🥊";
      case "mma":
        return "🤼";
      case "muay-thai":
        return "🦵";
      case "bjj":
        return "🥋";
      default:
        return "⚔️";
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow transform hover:scale-105">
      {/* Profile Image */}
      <div className="relative h-64 bg-gradient-to-br from-gray-200 to-gray-300">
        {partner.user.profileImageUrl ? (
          <img
            src={partner.user.profileImageUrl}
            alt={`${partner.user.firstName} ${partner.user.lastName}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-fight-red to-fight-red-dark">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="text-2xl bg-white text-fight-red">
                {partner.user.firstName[0]}{partner.user.lastName[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        
        {/* Status badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {partner.isOnline !== undefined && (
            <Badge 
              variant={partner.isOnline ? "default" : "secondary"}
              className={partner.isOnline ? "bg-green-500" : "bg-yellow-500"}
            >
              {partner.isOnline ? "Online" : "Away"}
            </Badge>
          )}
          {partner.isPro && (
            <Badge className="bg-fight-red text-white">
              Pro
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-6">
        {/* Name and Rating */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-fight-black">
            {partner.user.firstName} {partner.user.lastName}
          </h3>
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm text-gray-600">{partner.rating}</span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">{getDisciplineIcon(partner.discipline)}</span>
            <span className="capitalize">{partner.discipline}</span>
            <Badge 
              variant="outline" 
              className={`ml-2 text-xs ${getExperienceColor(partner.experienceLevel)}`}
            >
              {partner.experienceLevel}
            </Badge>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-fight-red mr-2" />
            <span>{partner.location}</span>
          </div>
          
          {partner.weightClass && (
            <div className="flex items-center text-sm text-gray-600">
              <Weight className="w-4 h-4 text-fight-red mr-2" />
              <span>{partner.weightClass}</span>
            </div>
          )}
        </div>

        {/* Bio */}
        {partner.bio && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {partner.bio}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button 
            className="flex-1 bg-fight-red hover:bg-fight-red-dark text-white"
            onClick={onConnect}
            disabled={disabled}
          >
            {disabled ? "Connecting..." : "Connect"}
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            className="border-gray-300 hover:bg-gray-50"
            onClick={onMessage}
            disabled={!onMessage}
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
