-- Add status column to programs table for manual completion
ALTER TABLE public.programs ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled'));

-- Add index for better performance
CREATE INDEX idx_programs_status ON public.programs(status);