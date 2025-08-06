import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { configureAuth } from './auth';
import { createServer } from 'http';
import path from 'path';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db';

const PostgresStore = connectPgSimple(session);

const app = express();

// Configure CORS first
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

// Configure session middleware before any routes
app.use(session({
  store: new PostgresStore({
    pool,
    tableName: 'sessions',
    createTableIfMissing: true,
    pruneSessionInterval: 24 * 60 * 60, // Prune expired sessions every 24 hours
  }),
  secret: process.env.COOKIE_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset cookie expiration on each request
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  },
  name: 'connect.sid'
}));

// Initialize Passport after session middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure auth routes and strategies
configureAuth(app);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Register API routes first
  await registerRoutes(app);

  // Error handling middleware for API routes
  app.use('/api', (err: any, req: Request, res: Response, _next: NextFunction) => {
    console.error('❌ [Server Error]', {
      path: req.path,
      error: err.message,
      stack: err.stack
    });

    // Handle JSON parsing errors
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ 
        error: 'Invalid JSON',
        details: err.message
      });
    }

    // For API requests, always return JSON
    if (req.path.startsWith('/api/')) {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      return res.status(status).json({ error: message });
    }

    // For OAuth flow errors, redirect to frontend
    if (req.path.startsWith('/api/auth/')) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth?error=auth_failed`);
    }

    // Default error response
    res.status(500).json({ error: "Internal Server Error" });
  });

  // Create HTTP server
  const server = createServer(app);

  // Set up Vite or static file serving
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Catch-all route handler for client-side routing
  // This must be after API routes but before error handling
  app.get('*', (req, res, next) => {
    // Skip this middleware for API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }

    if (app.get("env") === "development") {
      // In development, Vite middleware handles this
      next();
    } else {
      // In production, serve the static index.html
      res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
    }
  });

  // Start the server
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on http://localhost:${port}`);
  });
  
})();
