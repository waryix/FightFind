import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js";
import { db } from "../server/db";

console.log('🔍 Starting database migration...');

const addMissingColumns = sql`
  DO $$ 
  BEGIN 
    -- Add google_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'google_id') THEN 
      ALTER TABLE users ADD COLUMN google_id VARCHAR;
    END IF;

    -- Add provider column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'provider') THEN 
      ALTER TABLE users ADD COLUMN provider VARCHAR;
    END IF;

    -- Add email_verified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified') THEN 
      ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add first_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'first_name') THEN 
      ALTER TABLE users ADD COLUMN first_name VARCHAR;
    END IF;

    -- Add last_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_name') THEN 
      ALTER TABLE users ADD COLUMN last_name VARCHAR;
    END IF;

    -- Add profile_image_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_image_url') THEN 
      ALTER TABLE users ADD COLUMN profile_image_url VARCHAR;
    END IF;
  END $$;
`;

async function runMigration() {
  try {
    await db.execute(addMissingColumns);
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
