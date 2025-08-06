import { Express, Request, Response } from "express";
import { Session } from "express-session";
import Stripe from "stripe";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { storage } from './storage';

dotenv.config();

// Initialize Stripe only if API key is provided
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_secret_key_here') {
  console.log('STRIPE KEY: Configured');
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-07-30.basil',
  });
} else {
  console.log('STRIPE KEY: Not configured - Stripe features will be disabled');
}

export async function registerRoutes(app: Express) {
  // Add middleware
  app.use(cookieParser());

  // Test endpoint to verify backend is working
  app.get('/api/test', (req: Request, res: Response) => {
    console.log('✅ Test endpoint hit');
    res.json({ status: 'ok', message: 'Backend is working' });
  });
  
  // Authentication endpoints
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, email, password } = req.body;
      
      // Validate required fields
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ 
          error: "All fields are required",
          details: "Please provide firstName, lastName, email, and password" 
        });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ 
          error: "User already exists",
          details: "An account with this email address already exists" 
        });
      }
      
      // Create new user in PostgreSQL
      const user = await storage.createUser({
        firstName,
        lastName,
        email,
        provider: 'local',
        emailVerified: true, // For now, we'll auto-verify local accounts
        profileImageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&background=random`
      });

      // Create session
      req.logIn(user, (err) => {
        if (err) {
          console.error('❌ [Auth Error] Session login failed:', err);
          return res.status(500).json({ 
            error: "Registration successful but session creation failed",
            details: "Please try logging in"
          });
        }

        // Return success response
        res.status(201).json({ 
          message: "Registration successful",
          user
        });
      });
    } catch (error) {
      console.error('❌ [Auth] Registration error:', error);
      res.status(500).json({ 
        error: "Registration failed",
        details: "An internal server error occurred" 
      });
    }
  });

  app.post("/api/auth/login", async (_req: Request, res: Response) => {
    // We only support Google OAuth now
    res.status(400).json({ 
      error: "Direct login is not supported. Please use Google Sign-In.",
      details: "This application only supports Google authentication."
    });
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy(() => {});
    }
    req.logout(() => {
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });

  // OAuth user endpoint to get the currently logged-in user's info
  app.get("/api/auth/oauth/user", async (req: Request, res: Response) => {
    try {
      console.log('🔍 [OAuth Debug] User info request:', {
        isAuthenticated: req.isAuthenticated?.(),
        hasSession: !!req.session,
        user: req.user
      });

      if (!req.isAuthenticated?.()) {
        console.log('❌ [OAuth Debug] User not authenticated');
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = req.user as any;
      if (!user) {
        console.log('❌ [OAuth Debug] No user object in session');
        return res.status(401).json({ error: "No user found in session" });
      }

      // Return user data
      res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        provider: user.provider,
        emailVerified: user.emailVerified
      });
    } catch (error) {
      console.error('❌ [OAuth Debug] Error fetching user info:', error);
      res.status(500).json({ error: "Failed to get user information" });
    }
  });

  // Profile routes
  app.get("/api/profile", async (req: Request, res: Response) => {
    try {
      console.log('🔍 [Profile Debug] Request:', {
        headers: {
          cookie: req.headers.cookie,
          authorization: req.headers.authorization
        },
        session: {
          hasSession: !!req.session,
          isAuthenticated: req.isAuthenticated?.(),
          user: req.user,
          sessionID: req.sessionID
        }
      });

      if (!req.session || !req.isAuthenticated()) {
        console.log('❌ [Profile Debug] Not authenticated:', {
          session: req.session,
          isAuthenticated: req.isAuthenticated?.(),
          sessionID: req.sessionID,
          user: req.user,
          cookies: req.cookies
        });
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = (req.user as any).id;
      if (!userId) {
        return res.status(400).json({ error: "User ID not found" });
      }

      // Get user profile from database
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get fighter profile if it exists
      const fighterProfile = await storage.getFighterProfile(userId);

      // Return combined user and fighter profile data
      res.json({
        user,
        fighterProfile
      });
    } catch (error) {
      console.error('❌ [Profile] Get error:', error);
      res.status(500).json({ error: "Failed to get profile" });
    }
  });

  app.post("/api/profile", async (req: Request, res: Response) => {
    try {
      console.log('🔍 [Profile Update] Auth check:', {
        session: req.session,
        isAuthenticated: req.isAuthenticated?.(),
        user: req.user,
        cookies: req.cookies,
        headers: {
          cookie: req.headers.cookie,
          authorization: req.headers.authorization
        }
      });

      if (!req.isAuthenticated?.()) {
        console.log('❌ [Profile Update] Not authenticated');
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = (req.user as any).id;
      if (!userId) {
        return res.status(400).json({ error: "User ID not found" });
      }

      const { 
        discipline, 
        experienceLevel, 
        weightClass, 
        weight, 
        location, 
        bio, 
        availability,
        latitude,
        longitude
      } = req.body;

      // Check if fighter profile exists
      let fighterProfile = await storage.getFighterProfile(userId);

      if (fighterProfile) {
        // Update existing profile
        fighterProfile = await storage.updateFighterProfile(userId, {
          discipline,
          experienceLevel,
          weightClass,
          weight,
          location,
          bio,
          availability,
          latitude,
          longitude
        });
      } else {
        // Create new profile
        fighterProfile = await storage.createFighterProfile({
          userId,
          discipline,
          experienceLevel,
          weightClass,
          weight,
          location,
          bio,
          availability,
          latitude,
          longitude,
          isActive: true,
          verified: false
        });
      }

      res.json({
        message: "Profile updated successfully",
        fighterProfile
      });
    } catch (error) {
      console.error('❌ [Profile] Update error:', error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Partner routes
  app.get("/api/partners", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Get all fighter profiles
      const fighterProfiles = await storage.searchFighterProfiles({});

      res.json(fighterProfiles);
    } catch (error) {
      console.error('❌ [Partners] List error:', error);
      res.status(500).json({ error: 'Failed to get partners' });
    }
  });

  // Connections routes
  app.get("/api/connections", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = (req.user as any).id;
      const connections = await storage.getConnectionsByUser(userId);
      
      res.json(connections);
    } catch (error) {
      console.error('❌ [Connections] List error:', error);
      res.status(500).json({ error: 'Failed to get connections' });
    }
  });

  app.post("/api/connections", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = (req.user as any).id;
      const { receiverId, message } = req.body;

      // Create new connection
      const connection = await storage.createConnection({
        requesterId: userId,
        receiverId,
        message,
        status: 'pending'
      });
      
      res.json(connection);
    } catch (error) {
      console.error('❌ [Connections] Create error:', error);
      res.status(500).json({ error: 'Failed to create connection' });
    }
  });

  // Gym routes
  app.get("/api/gyms", async (req: Request, res: Response) => {
    try {
      const { latitude, longitude, radius } = req.query;
      
      let gyms;
      if (latitude && longitude && radius) {
        gyms = await storage.getGymsByLocation(
          parseFloat(latitude as string), 
          parseFloat(longitude as string), 
          parseFloat(radius as string)
        );
      } else {
        gyms = await storage.getAllGyms();
      }
      
      res.json(gyms);
    } catch (error) {
      console.error('❌ [Gyms] List error:', error);
      res.status(500).json({ error: 'Failed to get gyms' });
    }
  });

  app.post("/api/gyms", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const gym = await storage.createGym(req.body);
      res.json(gym);
    } catch (error) {
      console.error('❌ [Gyms] Create error:', error);
      res.status(500).json({ error: 'Failed to create gym' });
    }
  });

  // Messages routes
  app.get("/api/messages/:connectionId", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { connectionId } = req.params;
      const messages = await storage.getMessagesByConnection(connectionId);
      
      res.json(messages);
    } catch (error) {
      console.error('❌ [Messages] List error:', error);
      res.status(500).json({ error: 'Failed to get messages' });
    }
  });

  app.post("/api/messages", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = (req.user as any).id;
      const { connectionId, content } = req.body;

      const message = await storage.createMessage({
        connectionId,
        senderId: userId,
        content,
      });
      
      res.json(message);
    } catch (error) {
      console.error('❌ [Messages] Create error:', error);
      res.status(500).json({ error: 'Failed to create message' });
    }
  });

  return app;
}
