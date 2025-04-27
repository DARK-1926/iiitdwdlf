-- Add a JSONB column named "comments" to the items table 
-- This allows storing structured comment data
ALTER TABLE items ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb;

-- Grant permissions to use the column
GRANT ALL ON items TO authenticated;
GRANT ALL ON items TO service_role;

-- Add an index to improve query performance on the new column
CREATE INDEX IF NOT EXISTS idx_items_comments ON items USING gin (comments);

-- For backwards compatibility, also add a text column that could be used 
ALTER TABLE items ADD COLUMN IF NOT EXISTS comment_data TEXT DEFAULT '[]'; 