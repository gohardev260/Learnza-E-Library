-- ===================================================================
-- Learnza 2.0 - Database Setup
-- Clean schema with proper tag handling for Supabase
-- ===================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================================================
-- NOTES TABLE
-- ===================================================================

CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Core fields
    title VARCHAR(255) NOT NULL,
    description TEXT,
    class VARCHAR(100),
    tags TEXT[] DEFAULT '{}',  -- Store tags WITHOUT quotes
    file_url VARCHAR(500),
    
    -- Meta
    published BOOLEAN DEFAULT false,
    views INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Auth
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author VARCHAR(255),
    content_type VARCHAR(50) DEFAULT 'document',
    language VARCHAR(10) DEFAULT 'en'
);

-- ===================================================================
-- INDEXES
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title);
CREATE INDEX IF NOT EXISTS idx_notes_class ON notes(class);
CREATE INDEX IF NOT EXISTS idx_notes_published ON notes(published);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_views ON notes(views DESC);
CREATE INDEX IF NOT EXISTS idx_notes_downloads ON notes(downloads DESC);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);

-- ===================================================================
-- FUNCTIONS
-- ===================================================================

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Increment views
CREATE OR REPLACE FUNCTION inc_views(note_id UUID)
RETURNS INTEGER AS $$
DECLARE
    new_views INTEGER;
BEGIN
    UPDATE notes 
    SET views = views + 1 
    WHERE id = note_id
    RETURNING views INTO new_views;
    
    RETURN COALESCE(new_views, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment downloads
CREATE OR REPLACE FUNCTION inc_downloads(note_id UUID)
RETURNS INTEGER AS $$
DECLARE
    new_downloads INTEGER;
BEGIN
    UPDATE notes 
    SET downloads = downloads + 1 
    WHERE id = note_id
    RETURNING downloads INTO new_downloads;
    
    RETURN COALESCE(new_downloads, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get stats
CREATE OR REPLACE FUNCTION get_note_stats()
RETURNS TABLE(
    total_notes INTEGER,
    published_notes INTEGER,
    total_downloads BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_notes,
        COUNT(*) FILTER (WHERE published = true)::INTEGER as published_notes,
        COALESCE(SUM(downloads), 0)::BIGINT as total_downloads
    FROM notes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- TRIGGERS
-- ===================================================================

DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at 
    BEFORE UPDATE ON notes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- RLS POLICIES
-- ===================================================================

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Public can read published notes
DROP POLICY IF EXISTS "Public can read published notes" ON notes;
CREATE POLICY "Public can read published notes" ON notes
    FOR SELECT 
    USING (published = true);

-- Authenticated users can read all notes
DROP POLICY IF EXISTS "Authenticated users can read all notes" ON notes;
CREATE POLICY "Authenticated users can read all notes" ON notes
    FOR SELECT 
    TO authenticated
    USING (true);

-- Authenticated users can create notes
DROP POLICY IF EXISTS "Authenticated users can create notes" ON notes;
CREATE POLICY "Authenticated users can create notes" ON notes
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Users can update their own notes
DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
CREATE POLICY "Users can update their own notes" ON notes
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Users can delete their own notes
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;
CREATE POLICY "Users can delete their own notes" ON notes
    FOR DELETE 
    TO authenticated
    USING (auth.uid() = created_by);

-- ===================================================================
-- PERMISSIONS
-- ===================================================================

GRANT ALL ON notes TO authenticated;
GRANT SELECT ON notes TO anon;
GRANT EXECUTE ON FUNCTION inc_views TO authenticated;
GRANT EXECUTE ON FUNCTION inc_views TO anon;
GRANT EXECUTE ON FUNCTION inc_downloads TO authenticated;
GRANT EXECUTE ON FUNCTION inc_downloads TO anon;
GRANT EXECUTE ON FUNCTION get_note_stats TO authenticated;

-- ===================================================================
-- IMPORTANT NOTES
-- ===================================================================

/*
1. Tags Storage:
   - Store tags as plain text in array: ['math', 'science']
   - NOT with quotes: ['"math"', '"science"']
   
2. Supabase Configuration:
   - Update js/config.js with your Supabase URL and anon key
   - Create a user in Supabase Auth for admin access
   
3. Testing:
   - Insert sample note: 
     INSERT INTO notes (title, description, class, tags, published, author)
     VALUES ('Test Note', 'This is a test', 'Math', ARRAY['test', 'math'], true, 'Admin');
*/
