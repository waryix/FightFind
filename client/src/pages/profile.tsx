import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Navigation } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Save, X, User, MapPin, Dumbbell, Award } from "lucide-react";
import { useLocation } from "wouter";
import { insertFighterProfileSchema } from "@shared/schema";
import { z } from "zod";

const profileFormSchema = insertFighterProfileSchema.extend({
  location: z.string().min(1, "Location is required"),
  discipline: z.string().min(1, "Discipline is required"),
  experienceLevel: z.string().min(1, "Experience level is required"),
}).omit({ userId: true });

type ProfileFormData = z.infer<typeof profileFormSchema>;

const disciplines = [
  { value: "boxing", label: "Boxing" },
  { value: "mma", label: "MMA" },
  { value: "muay-thai", label: "Muay Thai" },
  { value: "bjj", label: "Brazilian Jiu-Jitsu" },
];

const experienceLevels = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "professional", label: "Professional" },
];

const weightClasses = [
  "Flyweight (125 lbs)",
  "Bantamweight (135 lbs)",
  "Featherweight (145 lbs)",
  "Lightweight (155 lbs)",
  "Welterweight (170 lbs)",
  "Middleweight (185 lbs)",
  "Light Heavyweight (205 lbs)",
  "Heavyweight (265 lbs)",
];

export default function Profile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

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

  const { data: profile, isLoading: profileLoading, error } = useQuery({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      console.log('🔍 [Profile] Fetching profile from backend...');
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await fetch('http://localhost:5000/api/profile', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch profile' }));
        console.error('❌ [Profile] Fetch failed:', errorData);
        throw new Error(errorData.error || 'Failed to fetch profile');
      }
      
      const data = await response.json();
      console.log('✅ [Profile] Profile fetched successfully:', data);
      return data;
    },
    enabled: !!user,
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      discipline: "",
      experienceLevel: "",
      weightClass: "",
      weight: undefined,
      location: "",
      bio: "",
      availability: "",
    },
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profile) {
      form.reset({
        discipline: profile.discipline || "",
        experienceLevel: profile.experienceLevel || "",
        weightClass: profile.weightClass || "",
        weight: profile.weight || undefined,
        location: profile.location || "",
        bio: profile.bio || "",
        availability: profile.availability || "",
      });
    }
  }, [profile, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      console.log('📝 [Profile] Updating profile with data:', data);
      const response = await fetch("http://localhost:5000/api/profile", {
        method: "POST",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      console.log('📝 [Profile] Backend response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ [Profile] Update failed:', errorData);
        throw new Error(errorData.error || 'Profile update failed');
      }
      
      const result = await response.json();
      console.log('✅ [Profile] Update successful:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ [Profile] Profile updated successfully');
      toast({
        title: "Profile Updated",
        description: "Your fighter profile has been successfully updated.",
      });
      
      // Update localStorage with new profile data if needed
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Refresh the profile data
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
    onError: (error) => {
      console.error('❌ [Profile] Update error:', error);
      toast({
        title: "Profile Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

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

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
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
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-fight-black">Fighter Profile</h1>
          <p className="mt-2 text-gray-600">
            Complete your profile to start connecting with sparring partners
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            {profileLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : !isEditing && profile && profile.discipline ? (
              // View Mode - Show saved profile details
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Fighter Details</h3>
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Dumbbell className="w-5 h-5 text-fight-red" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Discipline</p>
                        <p className="text-lg font-semibold text-gray-900">{profile.discipline}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-fight-red" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Experience Level</p>
                        <p className="text-lg font-semibold text-gray-900">{profile.experienceLevel}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-fight-red" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Location</p>
                        <p className="text-lg font-semibold text-gray-900">{profile.location}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {profile.weightClass && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Weight Class</p>
                        <p className="text-lg font-semibold text-gray-900">{profile.weightClass}</p>
                      </div>
                    )}
                    
                    {profile.weight && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Weight</p>
                        <p className="text-lg font-semibold text-gray-900">{profile.weight} lbs</p>
                      </div>
                    )}
                    
                    {profile.availability && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Availability</p>
                        <p className="text-lg font-semibold text-gray-900">{profile.availability}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {profile.bio && (
                  <div className="mt-6">
                    <p className="text-sm font-medium text-gray-500 mb-2">Bio</p>
                    <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{profile.bio}</p>
                  </div>
                )}
              </div>
            ) : (
              // Edit Mode - Show form
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {profile && profile.discipline ? 'Edit Fighter Profile' : 'Complete Your Fighter Profile'}
                  </h3>
                  {isEditing && (
                    <Button onClick={() => setIsEditing(false)} variant="outline" className="flex items-center gap-2">
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  )}
                </div>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="discipline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discipline</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your discipline" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {disciplines.map((discipline) => (
                                <SelectItem key={discipline.value} value={discipline.value}>
                                  {discipline.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="experienceLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Experience Level</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your experience level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {experienceLevels.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="weightClass"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight Class</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your weight class" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {weightClasses.map((weightClass) => (
                                <SelectItem key={weightClass} value={weightClass}>
                                  {weightClass}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (lbs)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter your weight"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="City, State" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell potential sparring partners about yourself, your training style, and what you're looking for..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="availability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Availability</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Weekday evenings, Weekend mornings"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="submit"
                      className="bg-fight-red hover:bg-fight-red-dark"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  </div>
);
}