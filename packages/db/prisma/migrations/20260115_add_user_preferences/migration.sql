-- Add user preferences JSON field for storing sidebar state and other user settings
ALTER TABLE "users" ADD COLUMN "preferences" JSONB;
