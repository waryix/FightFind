import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Express } from 'express';
import { storage } from './storage';
import dotenv from 'dotenv';
import { Session } from 'express-session';

// Extend express-session types
declare module 'express-session' {
  interface SessionData {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      provider: string;
      emailVerified: boolean;
    };
    passport: {
      user: any;
    };
  }
}
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the server directory
dotenv.config({ path: join(__dirname, '.env') });

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = 'http://localhost:5000/api/auth/google/callback';

export function configureAuth(app: Express) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('❌ [OAuth Error] Missing Google OAuth credentials in environment variables');
    return;
  }

  // Add error handling middleware for auth routes
  app.use('/api/auth/*', (err: any, req: any, res: any, next: any) => {
    console.error('❌ [OAuth Error] Unhandled error:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      statusCode: err.statusCode
    });
    
    // If it's a JSON parsing error, send appropriate error response
    if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    // For API endpoints, send JSON response
    if (req.path.startsWith('/api/')) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    // For OAuth flow, redirect to frontend with error
    res.redirect('http://localhost:5173/auth?error=server_error');
  });

  // Serialize the entire user object to session
  passport.serializeUser((user: any, done) => {
    console.log('🔍 [Auth Debug] Serializing user:', { id: user.id, email: user.email });
    // Store the whole user object in session
    done(null, user);
  });

  // Deserialize user directly from session
  passport.deserializeUser((user: any, done) => {
    try {
      console.log('🔍 [Auth Debug] Deserializing user:', { id: user.id });
      if (!user || !user.id) {
        console.log('❌ [Auth Debug] No valid user in session');
        return done(null, false);
      }

      // User object is already complete from serialization
      console.log('✅ [Auth Debug] User deserialized:', { 
        id: user.id, 
        email: user.email,
        provider: user.provider
      });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Configure Google Strategy
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔍 [OAuth Debug] Google Strategy Callback:', {
        accessTokenPresent: !!accessToken,
        refreshTokenPresent: !!refreshToken,
        profile: {
          id: profile.id,
          displayName: profile.displayName,
          emails: profile.emails?.map(e => e.value.substring(0, 3) + '...'),
          photos: profile.photos?.length,
          name: profile.name
        }
      });

      // Check if user exists
      let user = await storage.getUserByEmail(profile.emails?.[0]?.value ?? '');

      if (!user) {
        // Create new user
        user = await storage.createUser({
          firstName: profile.name?.givenName ?? '',
          lastName: profile.name?.familyName ?? '',
          email: profile.emails?.[0]?.value ?? '',
          provider: 'google',
          googleId: profile.id,
          emailVerified: true,
          profileImageUrl: profile.photos?.[0]?.value,
        });
        console.log('✅ [OAuth] New user created:', user.id);
      } else {
        // Update existing user's Google info if needed
        if (user.googleId !== profile.id) {
          user = await storage.upsertUser({
            ...user,
            googleId: profile.id,
            emailVerified: true,
            provider: 'google'
          });
        }
      }

      // Create session data
      return done(null, {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        provider: user.provider,
        emailVerified: user.emailVerified,
        profileImageUrl: user.profileImageUrl
      });
    } catch (error) {
      console.error('❌ [OAuth Error]', error);
      return done(error as Error, undefined);
    }
  }));

  // Auth routes
  app.get('/api/auth/google',
    (req, res, next) => {
      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        console.error('❌ [OAuth Error] Missing Google OAuth credentials');
        return res.redirect('http://localhost:5173/auth?error=oauth_config_missing');
      }
      console.log('🔍 [OAuth Debug] Google OAuth initiated');
      console.log('🔍 [OAuth Debug] Client ID:', GOOGLE_CLIENT_ID.substring(0, 8) + '...');
      console.log('🔍 [OAuth Debug] Redirect URI:', GOOGLE_CALLBACK_URL);
      next();
    },
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      prompt: 'select_account'
    })
  );

  app.get('/api/auth/google/callback',
    (req, res, next) => {
      // Debug logging for the callback
      console.log('🔍 [OAuth Debug] Callback received:', {
        query: req.query,
        code: req.query.code ? '✅ Present' : '❌ Missing',
        error: req.query.error || 'None'
      });

      // Validate the code is present
      if (!req.query.code) {
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth?error=no_auth_code`);
      }

      next();
    },
    (req, res, next) => {
      passport.authenticate('google', (err: any, user: any, info: any) => {
        if (err) {
          console.error('❌ [OAuth Error] Authentication error:', err);
          return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth?error=auth_error`);
        }

        if (!user) {
          console.error('❌ [OAuth Error] No user:', info);
          return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth?error=no_user`);
        }

        req.logIn(user, (err) => {
          if (err) {
            console.error('❌ [OAuth Error] Login error:', err);
            return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth?error=login_error`);
          }
          next();
        });
      })(req, res, next);
    },
    async (req, res) => {
      try {
        console.log('🔍 [OAuth Debug] Passport authentication successful');
        
        const user = req.user as any;
        console.log('🔍 [OAuth Debug] User object:', {
          present: !!user,
          fields: user ? Object.keys(user) : [],
          id: user?.id,
          email: user?.email ? `${user.email.substring(0, 3)}...` : undefined,
          provider: user?.provider
        });

        // Login was successful
        req.logIn(user, async (err) => {
          if (err) {
            console.error('❌ [OAuth Error] Session login failed:', err);
            return res.redirect('http://localhost:5173/auth?error=session_error');
          }

          try {
            // Create JWT token
            const token = storage.createToken(user);

            // Store the complete user object in both req.user and session
            req.user = user;
            req.session.passport = { user: user };
            req.session.user = {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              provider: user.provider,
              emailVerified: user.emailVerified
            };

            // Log session state before save
            console.log('🔍 [Auth Debug] Session before save:', {
              sessionID: req.sessionID,
              passport: req.session.passport,
              user: req.session.user,
              cookie: req.session.cookie
            });

            // Use logIn to properly set up the session
            await new Promise<void>((resolve, reject) => {
              req.logIn(user, (err) => {
                if (err) {
                  console.error('❌ [OAuth Error] Failed to log in user:', err);
                  reject(err);
                } else {
                  console.log('✅ [OAuth Debug] User logged in successfully');
                  resolve();
                }
              });
            });

            // Save session to ensure it's persisted
            await new Promise<void>((resolve, reject) => {
              req.session.save((err) => {
                if (err) {
                  console.error('❌ [OAuth Error] Failed to save session:', err);
                  reject(err);
                } else {
                  console.log('✅ [OAuth Debug] Session saved successfully');
                  resolve();
                }
              });
            });

            console.log('✅ [OAuth] Session and cookies set:', {
              sessionID: req.sessionID,
              hasSession: !!req.session,
              user: req.user ? { id: (req.user as any).id } : null
            });

            // Redirect to frontend with success
            res.redirect('http://localhost:5173/auth?oauth=success&provider=google');
          } catch (error) {
            console.error('❌ [OAuth Error] Cookie/session setup failed:', error);
            res.redirect('http://localhost:5173/auth?error=session_setup_failed');
          }
        });
      } catch (error) {
        console.error('❌ [OAuth Error] Callback failed:', error);
        res.redirect('http://localhost:5173/auth?error=google_oauth_failed');
      }
    }
  );
}
