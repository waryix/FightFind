import { db } from "../server/db";
import { users, fighterProfiles, gyms } from "../shared/schema";

const sampleUsers = [
  {
    id: "user1",
    email: "marcus.rodriguez@email.com",
    firstName: "Marcus",
    lastName: "Rodriguez",
    profileImageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
  },
  {
    id: "user2", 
    email: "sarah.chen@email.com",
    firstName: "Sarah",
    lastName: "Chen",
    profileImageUrl: "https://images.unsplash.com/photo-1594737626072-90dc274bc2bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
  },
  {
    id: "user3",
    email: "jake.thompson@email.com", 
    firstName: "Jake",
    lastName: "Thompson",
    profileImageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
  },
  {
    id: "user4",
    email: "maria.santos@email.com",
    firstName: "Maria", 
    lastName: "Santos",
    profileImageUrl: "https://images.unsplash.com/photo-1594737626072-90dc274bc2bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
  },
  {
    id: "user5",
    email: "alex.kim@email.com",
    firstName: "Alex",
    lastName: "Kim", 
    profileImageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
  },
];

const sampleProfiles = [
  {
    userId: "user1",
    discipline: "boxing",
    experienceLevel: "intermediate", 
    weightClass: "Welterweight (170 lbs)",
    weight: 170,
    location: "Los Angeles, CA",
    latitude: "34.0522",
    longitude: "-118.2437",
    bio: "Looking for technical sparring partners. Focus on footwork and combinations. Available weekday evenings.",
    availability: "Weekday evenings 6-8 PM",
    rating: "4.9",
    totalRatings: 12,
  },
  {
    userId: "user2",
    discipline: "mma", 
    experienceLevel: "advanced",
    weightClass: "Flyweight (125 lbs)",
    weight: 125,
    location: "Los Angeles, CA", 
    latitude: "34.0522",
    longitude: "-118.2437",
    bio: "Former amateur competitor. Enjoy working on ground game and striking. Prefer morning sessions.",
    availability: "Weekend mornings 8-10 AM",
    rating: "4.8",
    totalRatings: 8,
  },
  {
    userId: "user3",
    discipline: "boxing",
    experienceLevel: "professional",
    weightClass: "Middleweight (160 lbs)", 
    weight: 160,
    location: "Los Angeles, CA",
    latitude: "34.0522", 
    longitude: "-118.2437",
    bio: "Professional boxer with 15+ years experience. Mentor-style sparring for intermediate to advanced partners.",
    availability: "Flexible schedule",
    rating: "5.0",
    totalRatings: 25,
    verified: true,
  },
  {
    userId: "user4",
    discipline: "muay-thai",
    experienceLevel: "intermediate",
    weightClass: "Bantamweight (135 lbs)",
    weight: 135,
    location: "San Diego, CA",
    latitude: "32.7157",
    longitude: "-117.1611", 
    bio: "Traditional Muay Thai practitioner. Love working on clinch and elbow techniques. Very respectful training partner.",
    availability: "Tuesday/Thursday evenings",
    rating: "4.7",
    totalRatings: 15,
  },
  {
    userId: "user5",
    discipline: "bjj",
    experienceLevel: "advanced", 
    weightClass: "Lightweight (155 lbs)",
    weight: 155,
    location: "San Francisco, CA",
    latitude: "37.7749",
    longitude: "-122.4194",
    bio: "Brown belt with competition experience. Always looking to roll and learn new techniques. Open to all skill levels.",
    availability: "Weekend afternoons",
    rating: "4.9", 
    totalRatings: 18,
  },
];

const sampleGyms = [
  {
    name: "Elite Boxing Academy",
    address: "1234 Boxing Blvd, Los Angeles, CA 90028",
    city: "Los Angeles",
    state: "CA", 
    zipCode: "90028",
    latitude: "34.0522",
    longitude: "-118.2437",
    phone: "(323) 555-0123",
    website: "https://eliteboxingacademy.com",
    description: "Full-service boxing gym with professional trainers and sparring programs. State-of-the-art equipment and experienced coaching staff.",
    disciplines: JSON.stringify(["boxing", "fitness"]),
    amenities: JSON.stringify(["heavy bags", "speed bags", "ring", "showers", "parking"]),
    rating: "4.8",
    totalRatings: 127,
    verified: true,
  },
  {
    name: "Iron MMA Gym", 
    address: "5678 Fighter Ave, Los Angeles, CA 90210",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90210", 
    latitude: "34.0736",
    longitude: "-118.4004",
    phone: "(310) 555-0456", 
    website: "https://ironmmagym.com",
    description: "Mixed martial arts training with ground game and striking programs. Professional coaching for all levels.",
    disciplines: JSON.stringify(["mma", "bjj", "boxing", "muay-thai"]),
    amenities: JSON.stringify(["mats", "cage", "heavy bags", "grappling area", "strength training"]),
    rating: "4.9",
    totalRatings: 89,
    verified: true,
  },
  {
    name: "Warriors Muay Thai",
    address: "9012 Warrior Way, Los Angeles, CA 90036", 
    city: "Los Angeles",
    state: "CA",
    zipCode: "90036",
    latitude: "34.0754",
    longitude: "-118.3629",
    phone: "(323) 555-0789",
    website: "https://warriorsmuaythai.com", 
    description: "Traditional Muay Thai training with authentic techniques and sparring. Experienced Thai trainers and traditional atmosphere.",
    disciplines: JSON.stringify(["muay-thai", "kickboxing"]),
    amenities: JSON.stringify(["thai pads", "heavy bags", "ring", "traditional music", "authentic training"]),
    rating: "4.7",
    totalRatings: 156,
    verified: true,
  },
  {
    name: "Gracie Jiu-Jitsu Academy",
    address: "3456 Grappling St, San Diego, CA 92101",
    city: "San Diego", 
    state: "CA",
    zipCode: "92101",
    latitude: "32.7157",
    longitude: "-117.1611",
    phone: "(619) 555-0234",
    website: "https://graciejiujitsu-sd.com",
    description: "Traditional Brazilian Jiu-Jitsu training with lineage to the Gracie family. Focus on self-defense and sport BJJ.",
    disciplines: JSON.stringify(["bjj", "self-defense"]),
    amenities: JSON.stringify(["mats", "grappling dummies", "changing rooms", "kids classes"]),
    rating: "4.9", 
    totalRatings: 203,
    verified: true,
  },
  {
    name: "Bay Area Combat Sports",
    address: "7890 Fighter Blvd, San Francisco, CA 94102",
    city: "San Francisco",
    state: "CA",
    zipCode: "94102", 
    latitude: "37.7749",
    longitude: "-122.4194",
    phone: "(415) 555-0567",
    website: "https://bayareacombat.com",
    description: "Comprehensive combat sports facility offering multiple disciplines under one roof. Professional instruction and modern facilities.",
    disciplines: JSON.stringify(["mma", "boxing", "muay-thai", "bjj", "wrestling"]),
    amenities: JSON.stringify(["ring", "cage", "mats", "heavy bags", "strength training", "sauna"]),
    rating: "4.8",
    totalRatings: 94,
    verified: true,
  },
];

async function seedDatabase() {
  try {
    console.log("🌱 Seeding database...");
    
    // Insert users
    console.log("Adding sample users...");
    for (const user of sampleUsers) {
      await db.insert(users).values(user).onConflictDoNothing();
    }
    
    // Insert fighter profiles
    console.log("Adding fighter profiles...");
    for (const profile of sampleProfiles) {
      await db.insert(fighterProfiles).values(profile).onConflictDoNothing();
    }
    
    // Insert gyms
    console.log("Adding sample gyms...");
    for (const gym of sampleGyms) {
      await db.insert(gyms).values(gym).onConflictDoNothing();
    }
    
    console.log("✅ Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();