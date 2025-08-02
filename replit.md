# FightFinder

## Overview

FightFinder is a martial arts networking platform designed to connect fighters, sparring partners, and martial arts enthusiasts. The application enables users to find training partners based on discipline, experience level, and location, discover local gyms, and manage connections within the fighting community. Built as a full-stack web application with authentication, subscription management, and real-time features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Single-page application using React 18 with TypeScript for type safety
- **Component Library**: Shadcn/ui components built on Radix UI primitives for consistent design
- **Styling**: Tailwind CSS with custom CSS variables for theming and responsive design
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for client-side routing with conditional rendering based on authentication
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Node.js + Express**: REST API server with TypeScript support
- **Database ORM**: Drizzle ORM for type-safe database operations and migrations
- **Authentication**: Replit Auth integration with OpenID Connect and session management
- **Session Storage**: PostgreSQL-based session store using connect-pg-simple
- **API Design**: RESTful endpoints with consistent error handling and request logging

### Database Design
- **PostgreSQL**: Primary database with Neon serverless hosting
- **Schema Structure**: 
  - Users table for authentication and profile data
  - Fighter profiles with martial arts specific information (discipline, experience, weight class)
  - Gyms table with location and facility details
  - Connections system for partner requests and networking
  - Messages table for communication between users
  - Sessions table for authentication state
- **Geolocation Support**: Latitude/longitude fields for location-based searches
- **Data Validation**: Zod schemas shared between client and server for consistency

### Authentication & Security
- **Replit Auth**: Integrated OpenID Connect flow with automatic user provisioning
- **Session Management**: Secure HTTP-only cookies with 7-day expiration
- **Route Protection**: Middleware-based authentication checks for protected endpoints
- **CORS Configuration**: Configured for cross-origin requests with credentials

### Real-time Features
- **Connection Requests**: Instant notifications for sparring partner requests
- **Message System**: Real-time messaging between connected users
- **Online Status**: User presence indicators

## External Dependencies

### Payment Processing
- **Stripe**: Subscription management and payment processing
- **React Stripe.js**: Frontend integration for payment forms and checkout flows

### Database & Hosting
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Replit Deployment**: Development and production hosting environment

### UI & Design
- **Radix UI**: Accessible component primitives for complex UI interactions
- **Lucide React**: Icon library for consistent visual elements
- **Tailwind CSS**: Utility-first CSS framework with design system integration

### Development Tools
- **Vite**: Frontend build tool with hot module replacement
- **ESBuild**: Backend bundling for production deployment
- **Drizzle Kit**: Database migration and schema management tools
- **TypeScript**: Static type checking across the entire application stack

### Location Services
- **Geolocation API**: Browser-based location detection for user positioning
- **Distance Calculation**: Mathematical distance calculations for partner matching

### Form & Validation
- **React Hook Form**: Performance-optimized form handling
- **Zod**: Runtime type validation with TypeScript integration
- **Hookform Resolvers**: Bridge between React Hook Form and Zod validation