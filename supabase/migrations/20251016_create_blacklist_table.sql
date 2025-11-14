-- Create blacklist table for managing user restrictions
CREATE TABLE blacklist (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id BIGINT REFERENCES programs(id) ON DELETE SET NULL,
  reason TEXT NOT NULL DEFAULT '연속 결석',
  blacklisted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  blacklisted_until TIMESTAMPTZ NOT NULL,
  blacklisted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own blacklist records
CREATE POLICY "Users can view their own blacklist records" ON blacklist
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for admins and super_admins to manage blacklist
CREATE POLICY "Admins can manage blacklist" ON blacklist
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Add indexes for better performance
CREATE INDEX idx_blacklist_user_id ON blacklist(user_id);
CREATE INDEX idx_blacklist_active ON blacklist(is_active);
CREATE INDEX idx_blacklist_until ON blacklist(blacklisted_until);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_blacklist_updated_at 
  BEFORE UPDATE ON blacklist 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();