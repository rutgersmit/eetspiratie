-- =============================================
-- Eetspiratie Database Schema
-- =============================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- RECIPES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    ingredients TEXT NOT NULL,
    image_path TEXT,
    source_url TEXT,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON public.recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_slug ON public.recipes(slug);

-- =============================================
-- TRIGGER: Auto-update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS set_updated_at ON public.recipes;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on recipes table
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only SELECT their own recipes
DROP POLICY IF EXISTS "Users can view own recipes" ON public.recipes;
CREATE POLICY "Users can view own recipes"
    ON public.recipes
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Anyone can view public recipes
DROP POLICY IF EXISTS "Anyone can view public recipes" ON public.recipes;
CREATE POLICY "Anyone can view public recipes"
    ON public.recipes
    FOR SELECT
    USING (is_public = true);

-- Policy: Users can only INSERT their own recipes
DROP POLICY IF EXISTS "Users can insert own recipes" ON public.recipes;
CREATE POLICY "Users can insert own recipes"
    ON public.recipes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only UPDATE their own recipes
DROP POLICY IF EXISTS "Users can update own recipes" ON public.recipes;
CREATE POLICY "Users can update own recipes"
    ON public.recipes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only DELETE their own recipes
DROP POLICY IF EXISTS "Users can delete own recipes" ON public.recipes;
CREATE POLICY "Users can delete own recipes"
    ON public.recipes
    FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- STORAGE BUCKET SETUP
-- Run this in the Supabase Dashboard SQL Editor
-- =============================================

-- Create the storage bucket (if not exists via dashboard)
-- Note: Bucket creation is typically done via dashboard or CLI
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('recipe-images', 'recipe-images', false)
-- ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STORAGE POLICIES
-- Run these after creating the bucket in the dashboard
-- =============================================

-- Policy: Users can upload their own images
-- Path format: user_id/filename.ext
DROP POLICY IF EXISTS "Users can upload own images" ON storage.objects;
CREATE POLICY "Users can upload own images"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'recipe-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Users can view their own images
DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;
CREATE POLICY "Users can view own images"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'recipe-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Anyone can view images of public recipes
DROP POLICY IF EXISTS "Anyone can view public recipe images" ON storage.objects;
CREATE POLICY "Anyone can view public recipe images"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'recipe-images'
        AND EXISTS (
            SELECT 1 FROM public.recipes
            WHERE recipes.image_path = name
            AND recipes.is_public = true
        )
    );

-- Policy: Users can update their own images
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
CREATE POLICY "Users can update own images"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'recipe-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Users can delete their own images
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
CREATE POLICY "Users can delete own images"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'recipe-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
