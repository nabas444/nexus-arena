
-- Tournaments table for organizer-created tournaments
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID NULL,
  title TEXT NOT NULL,
  game TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('single-elim', 'double-elim')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'ongoing', 'completed')),
  max_teams INT NOT NULL CHECK (max_teams BETWEEN 2 AND 256),
  registered_teams INT NOT NULL DEFAULT 0,
  prize_pool BIGINT NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  region TEXT NOT NULL DEFAULT 'Global',
  organizer TEXT NOT NULL,
  banner_hue INT NOT NULL DEFAULT 270 CHECK (banner_hue BETWEEN 0 AND 360),
  rules TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Public read (tournaments are discoverable by everyone)
CREATE POLICY "Tournaments are viewable by everyone"
  ON public.tournaments FOR SELECT
  USING (true);

-- Anyone can create a tournament (no auth yet); organizer_id captured if logged in
CREATE POLICY "Anyone can create tournaments"
  ON public.tournaments FOR INSERT
  WITH CHECK (true);

-- Only the organizer (when logged in) can update/delete; rows with null organizer remain immutable from clients
CREATE POLICY "Organizers can update their tournaments"
  ON public.tournaments FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their tournaments"
  ON public.tournaments FOR DELETE
  USING (auth.uid() IS NOT NULL AND auth.uid() = organizer_id);

-- Reusable timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tournaments_status ON public.tournaments(status);
CREATE INDEX idx_tournaments_start_date ON public.tournaments(start_date DESC);
