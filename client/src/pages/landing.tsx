import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/ui/navigation";
import { SearchFilter } from "@/components/search-filter";
import { PartnerCard } from "@/components/partner-card";
import { GymCard } from "@/components/gym-card";
import { Shield, Users, MessageSquare, MapPin, Star, CheckCircle } from "lucide-react";

const mockPartners = [
  {
    id: "1",
    user: {
      id: "1",
      firstName: "Marcus",
      lastName: "Rodriguez",
      profileImageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    },
    discipline: "boxing",
    experienceLevel: "intermediate",
    location: "Los Angeles, CA",
    weightClass: "Welterweight (170 lbs)",
    bio: "Looking for technical sparring partners. Focus on footwork and combinations. Available weekday evenings.",
    rating: "4.9",
    isOnline: true,
  },
  {
    id: "2",
    user: {
      id: "2",
      firstName: "Sarah",
      lastName: "Chen",
      profileImageUrl: "https://images.unsplash.com/photo-1594737626072-90dc274bc2bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    },
    discipline: "mma",
    experienceLevel: "advanced",
    location: "Los Angeles, CA",
    weightClass: "Flyweight (125 lbs)",
    bio: "Former amateur competitor. Enjoy working on ground game and striking. Prefer morning sessions.",
    rating: "4.8",
    isOnline: false,
  },
  {
    id: "3",
    user: {
      id: "3",
      firstName: "Jake",
      lastName: "Thompson",
      profileImageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    },
    discipline: "boxing",
    experienceLevel: "professional",
    location: "Los Angeles, CA",
    weightClass: "Middleweight (160 lbs)",
    bio: "Professional boxer with 15+ years experience. Mentor-style sparring for intermediate to advanced partners.",
    rating: "5.0",
    isOnline: true,
    isPro: true,
  },
];

const mockGyms = [
  {
    id: "1",
    name: "Elite Boxing Academy",
    rating: "4.8",
    reviewCount: 127,
    distance: "1.2 miles away",
    description: "Full-service boxing gym with professional trainers and sparring programs.",
  },
  {
    id: "2",
    name: "Iron MMA Gym",
    rating: "4.9",
    reviewCount: 89,
    distance: "2.8 miles away",
    description: "Mixed martial arts training with ground game and striking programs.",
  },
  {
    id: "3",
    name: "Warriors Muay Thai",
    rating: "4.7",
    reviewCount: 156,
    distance: "3.5 miles away",
    description: "Traditional Muay Thai training with authentic techniques and sparring.",
  },
];

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation onLogin={handleLogin} />
      
      {/* Hero Section */}
      <section className="relative bg-fight-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-fight-black via-fight-black/80 to-transparent z-10"></div>
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')", 
            backgroundSize: "cover", 
            backgroundPosition: "center" 
          }}
        />
        
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
                Find Your Perfect
                <span className="text-fight-red"> Sparring Partner</span>
              </h1>
              <p className="mt-6 text-xl text-gray-300 max-w-lg">
                Connect with fighters in your area. Train safely, improve together, and build lasting partnerships in boxing, MMA, and martial arts.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-fight-red hover:bg-fight-red-dark text-white px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all"
                  onClick={handleLogin}
                >
                  Start Matching
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-2 border-white text-white px-8 py-4 text-lg font-semibold hover:bg-white hover:text-fight-black transition-all"
                >
                  Learn More
                </Button>
              </div>
              <div className="mt-8 flex items-center space-x-6 text-gray-300">
                <div className="flex items-center">
                  <Users className="text-fight-red mr-2" size={20} />
                  <span>10,000+ Active Fighters</span>
                </div>
                <div className="flex items-center">
                  <Shield className="text-fight-red mr-2" size={20} />
                  <span>Verified Profiles</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="bg-white py-12 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SearchFilter />
        </div>
      </section>

      {/* Partner Profiles Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-fight-black">Available Sparring Partners</h2>
            <p className="mt-4 text-xl text-gray-600">Connect with verified fighters in your area</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockPartners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} onConnect={handleLogin} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg" 
              className="bg-fight-black text-white hover:bg-gray-800 px-8 py-3"
              onClick={handleLogin}
            >
              Load More Partners
            </Button>
          </div>
        </div>
      </section>

      {/* Gym Finder Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-fight-black">Find Training Locations</h2>
            <p className="mt-4 text-xl text-gray-600">Discover gyms and training facilities near you</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div 
                className="rounded-xl overflow-hidden shadow-lg h-96"
                style={{ 
                  backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600')", 
                  backgroundSize: "cover", 
                  backgroundPosition: "center" 
                }}
              />
            </div>
            <div className="space-y-6">
              {mockGyms.map((gym) => (
                <GymCard key={gym.id} gym={gym} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Premium Features Section */}
      <section className="py-16 bg-fight-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Upgrade to Premium</h2>
            <p className="mt-4 text-xl text-gray-300">Unlock advanced features for serious fighters</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                  onClick={handleLogin}
                >
                  Get Started
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
                  onClick={handleLogin}
                >
                  Start Pro Trial
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
                  onClick={handleLogin}
                >
                  Choose Elite
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Safety Guidelines Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-fight-black">Safety First</h2>
            <p className="mt-4 text-xl text-gray-600">Your safety is our top priority</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-fight-red rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="text-white" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-fight-black mb-2">Verified Profiles</h3>
              <p className="text-gray-600">All members undergo identity verification and background checks</p>
            </div>
            <div className="text-center">
              <div className="bg-fight-red rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="text-white" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-fight-black mb-2">Safe Communication</h3>
              <p className="text-gray-600">In-app messaging keeps your personal information private</p>
            </div>
            <div className="text-center">
              <div className="bg-fight-red rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-white" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-fight-black mb-2">Public Venues</h3>
              <p className="text-gray-600">Meet at verified gyms and public training facilities</p>
            </div>
            <div className="text-center">
              <div className="bg-fight-red rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="text-white" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-fight-black mb-2">Report System</h3>
              <p className="text-gray-600">Easy reporting tools for inappropriate behavior</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-fight-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-fight-red mb-4">FightFinder</h3>
              <p className="text-gray-300">Connecting fighters worldwide for safe, productive sparring sessions.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><button className="text-gray-300 hover:text-white" onClick={handleLogin}>Find Partners</button></li>
                <li><button className="text-gray-300 hover:text-white" onClick={handleLogin}>Browse Gyms</button></li>
                <li><button className="text-gray-300 hover:text-white">Safety Guidelines</button></li>
                <li><button className="text-gray-300 hover:text-white">Community</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><button className="text-gray-300 hover:text-white">Help Center</button></li>
                <li><button className="text-gray-300 hover:text-white">Contact Us</button></li>
                <li><button className="text-gray-300 hover:text-white">Report Issue</button></li>
                <li><button className="text-gray-300 hover:text-white">Training Tips</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><button className="text-gray-300 hover:text-white">Terms of Service</button></li>
                <li><button className="text-gray-300 hover:text-white">Privacy Policy</button></li>
                <li><button className="text-gray-300 hover:text-white">Cookie Policy</button></li>
                <li><button className="text-gray-300 hover:text-white">Disclaimer</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-300">&copy; 2024 FightFinder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
