import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertFighterProfileSchema, insertConnectionSchema, insertMessageSchema } from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Fighter profile routes
  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getFighterProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = insertFighterProfileSchema.parse({
        ...req.body,
        userId,
      });
      
      const existingProfile = await storage.getFighterProfile(userId);
      let profile;
      
      if (existingProfile) {
        profile = await storage.updateFighterProfile(userId, profileData);
      } else {
        profile = await storage.createFighterProfile(profileData);
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error creating/updating profile:", error);
      res.status(400).json({ message: "Failed to save profile" });
    }
  });

  // Partner search routes
  app.get('/api/partners', async (req, res) => {
    try {
      const { discipline, experienceLevel, location, latitude, longitude, radius } = req.query;
      
      const filters: any = {};
      if (discipline) filters.discipline = discipline as string;
      if (experienceLevel) filters.experienceLevel = experienceLevel as string;
      if (location) filters.location = location as string;
      if (latitude && longitude) {
        filters.latitude = parseFloat(latitude as string);
        filters.longitude = parseFloat(longitude as string);
        filters.radius = radius ? parseFloat(radius as string) : 25; // default 25 miles
      }

      const profiles = await storage.searchFighterProfiles(filters);
      res.json(profiles);
    } catch (error) {
      console.error("Error searching partners:", error);
      res.status(500).json({ message: "Failed to search partners" });
    }
  });

  // Gym routes
  app.get('/api/gyms', async (req, res) => {
    try {
      const { latitude, longitude, radius } = req.query;
      
      let gyms;
      if (latitude && longitude) {
        gyms = await storage.getGymsByLocation(
          parseFloat(latitude as string),
          parseFloat(longitude as string),
          radius ? parseFloat(radius as string) : 25
        );
      } else {
        gyms = await storage.getAllGyms();
      }
      
      res.json(gyms);
    } catch (error) {
      console.error("Error fetching gyms:", error);
      res.status(500).json({ message: "Failed to fetch gyms" });
    }
  });

  // Connection routes
  app.post('/api/connections', isAuthenticated, async (req: any, res) => {
    try {
      const requesterId = req.user.claims.sub;
      const connectionData = insertConnectionSchema.parse({
        ...req.body,
        requesterId,
      });

      const connection = await storage.createConnection(connectionData);
      res.json(connection);
    } catch (error) {
      console.error("Error creating connection:", error);
      res.status(400).json({ message: "Failed to create connection" });
    }
  });

  app.get('/api/connections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connections = await storage.getConnectionsByUser(userId);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching connections:", error);
      res.status(500).json({ message: "Failed to fetch connections" });
    }
  });

  app.patch('/api/connections/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const connection = await storage.updateConnectionStatus(id, status);
      res.json(connection);
    } catch (error) {
      console.error("Error updating connection:", error);
      res.status(400).json({ message: "Failed to update connection" });
    }
  });

  // Message routes
  app.get('/api/connections/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const messages = await storage.getMessagesByConnection(id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/connections/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const senderId = req.user.claims.sub;
      
      const messageData = insertMessageSchema.parse({
        ...req.body,
        connectionId: id,
        senderId,
      });

      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  // Stripe subscription route
  app.post('/api/get-or-create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      let user = req.user;
      const userId = user.claims.sub;
      const userData = await storage.getUser(userId);

      if (userData?.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(userData.stripeSubscriptionId);
        
        const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
        const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent;
        
        res.json({
          subscriptionId: subscription.id,
          clientSecret: paymentIntent?.client_secret,
        });
        return;
      }

      if (!userData?.email) {
        throw new Error('No user email on file');
      }

      const customer = await stripe.customers.create({
        email: userData.email,
        name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
      });

      if (!process.env.STRIPE_PRICE_ID) {
        throw new Error('STRIPE_PRICE_ID environment variable is required');
      }

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: process.env.STRIPE_PRICE_ID,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(userId, customer.id, subscription.id);

      const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent;
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
      });
    } catch (error: any) {
      console.error("Subscription error:", error);
      res.status(400).json({ error: { message: error.message } });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
