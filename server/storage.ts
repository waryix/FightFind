import {
  users,
  fighterProfiles,
  gyms,
  connections,
  messages,
  type User,
  type UpsertUser,
  type FighterProfile,
  type InsertFighterProfile,
  type Gym,
  type InsertGym,
  type Connection,
  type InsertConnection,
  type Message,
  type InsertMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, sql, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  
  // Fighter profile operations
  getFighterProfile(userId: string): Promise<FighterProfile | undefined>;
  createFighterProfile(profile: InsertFighterProfile): Promise<FighterProfile>;
  updateFighterProfile(userId: string, updates: Partial<InsertFighterProfile>): Promise<FighterProfile>;
  searchFighterProfiles(filters: {
    discipline?: string;
    experienceLevel?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
  }): Promise<(FighterProfile & { user: User })[]>;
  
  // Gym operations
  getAllGyms(): Promise<Gym[]>;
  getGymsByLocation(latitude: number, longitude: number, radius: number): Promise<Gym[]>;
  createGym(gym: InsertGym): Promise<Gym>;
  
  // Connection operations
  createConnection(connection: InsertConnection): Promise<Connection>;
  getConnectionsByUser(userId: string): Promise<(Connection & { requester: User; receiver: User })[]>;
  updateConnectionStatus(connectionId: string, status: string): Promise<Connection>;
  
  // Message operations
  getMessagesByConnection(connectionId: string): Promise<(Message & { sender: User })[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Fighter profile operations
  async getFighterProfile(userId: string): Promise<FighterProfile | undefined> {
    const [profile] = await db
      .select()
      .from(fighterProfiles)
      .where(eq(fighterProfiles.userId, userId));
    return profile;
  }

  async createFighterProfile(profile: InsertFighterProfile): Promise<FighterProfile> {
    const [newProfile] = await db
      .insert(fighterProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async updateFighterProfile(userId: string, updates: Partial<InsertFighterProfile>): Promise<FighterProfile> {
    const [profile] = await db
      .update(fighterProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(fighterProfiles.userId, userId))
      .returning();
    return profile;
  }

  async searchFighterProfiles(filters: {
    discipline?: string;
    experienceLevel?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
  }): Promise<(FighterProfile & { user: User })[]> {
    let query = db
      .select()
      .from(fighterProfiles)
      .innerJoin(users, eq(fighterProfiles.userId, users.id))
      .where(eq(fighterProfiles.isActive, true));

    const conditions = [];

    if (filters.discipline) {
      conditions.push(eq(fighterProfiles.discipline, filters.discipline));
    }

    if (filters.experienceLevel) {
      conditions.push(eq(fighterProfiles.experienceLevel, filters.experienceLevel));
    }

    if (filters.location) {
      conditions.push(sql`${fighterProfiles.location} ILIKE ${'%' + filters.location + '%'}`);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(fighterProfiles.rating));
    
    return results.map(row => ({
      ...row.fighter_profiles,
      user: row.users,
    }));
  }

  // Gym operations
  async getAllGyms(): Promise<Gym[]> {
    return await db.select().from(gyms).orderBy(desc(gyms.rating));
  }

  async getGymsByLocation(latitude: number, longitude: number, radius: number): Promise<Gym[]> {
    // Simple distance calculation - in production, you'd want to use PostGIS
    return await db
      .select()
      .from(gyms)
      .where(sql`
        SQRT(
          POW(69.1 * (${gyms.latitude} - ${latitude}), 2) +
          POW(69.1 * (${longitude} - ${gyms.longitude}) * COS(${gyms.latitude} / 57.3), 2)
        ) < ${radius}
      `)
      .orderBy(desc(gyms.rating));
  }

  async createGym(gym: InsertGym): Promise<Gym> {
    const [newGym] = await db.insert(gyms).values(gym).returning();
    return newGym;
  }

  // Connection operations
  async createConnection(connection: InsertConnection): Promise<Connection> {
    const [newConnection] = await db
      .insert(connections)
      .values(connection)
      .returning();
    return newConnection;
  }

  async getConnectionsByUser(userId: string): Promise<(Connection & { requester: User; receiver: User })[]> {
    const results = await db
      .select()
      .from(connections)
      .innerJoin(users, or(
        eq(connections.requesterId, users.id),
        eq(connections.receiverId, users.id)
      ))
      .where(or(
        eq(connections.requesterId, userId),
        eq(connections.receiverId, userId)
      ))
      .orderBy(desc(connections.updatedAt));

    // This is a simplified version - you'd want to properly join both requester and receiver
    return results.map(row => ({
      ...row.connections,
      requester: row.users,
      receiver: row.users, // In production, you'd need separate joins
    }));
  }

  async updateConnectionStatus(connectionId: string, status: string): Promise<Connection> {
    const [connection] = await db
      .update(connections)
      .set({ status, updatedAt: new Date() })
      .where(eq(connections.id, connectionId))
      .returning();
    return connection;
  }

  // Message operations
  async getMessagesByConnection(connectionId: string): Promise<(Message & { sender: User })[]> {
    const results = await db
      .select()
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.connectionId, connectionId))
      .orderBy(asc(messages.createdAt));

    return results.map(row => ({
      ...row.messages,
      sender: row.users,
    }));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }
}

export const storage = new DatabaseStorage();
