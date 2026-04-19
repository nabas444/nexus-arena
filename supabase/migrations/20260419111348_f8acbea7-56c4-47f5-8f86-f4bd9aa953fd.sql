-- TOURNAMENT TEAMS
CREATE TABLE public.tournament_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tag TEXT NOT NULL,
  logo_color TEXT NOT NULL DEFAULT '270 80% 60%',
  seed INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tournament_teams_tour ON public.tournament_teams(tournament_id);

ALTER TABLE public.tournament_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teams viewable by everyone"
  ON public.tournament_teams FOR SELECT USING (true);

CREATE POLICY "Organizer can add teams"
  ON public.tournament_teams FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id AND t.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizer can update teams"
  ON public.tournament_teams FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id AND t.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizer can remove teams"
  ON public.tournament_teams FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id AND t.organizer_id = auth.uid()
    )
  );

-- Keep tournaments.registered_teams in sync
CREATE OR REPLACE FUNCTION public.sync_registered_teams()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.tournaments SET registered_teams = registered_teams + 1 WHERE id = NEW.tournament_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.tournaments SET registered_teams = GREATEST(registered_teams - 1, 0) WHERE id = OLD.tournament_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_tournament_teams_count
  AFTER INSERT OR DELETE ON public.tournament_teams
  FOR EACH ROW EXECUTE FUNCTION public.sync_registered_teams();

-- MATCHES
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  position INTEGER NOT NULL,
  team_a_id UUID REFERENCES public.tournament_teams(id) ON DELETE SET NULL,
  team_b_id UUID REFERENCES public.tournament_teams(id) ON DELETE SET NULL,
  score_a INTEGER,
  score_b INTEGER,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','live','completed')),
  best_of INTEGER NOT NULL DEFAULT 3,
  winner_id UUID REFERENCES public.tournament_teams(id) ON DELETE SET NULL,
  next_match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  next_slot TEXT CHECK (next_slot IN ('A','B')),
  starts_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, round, position)
);
CREATE INDEX idx_matches_tour ON public.matches(tournament_id, round, position);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Matches viewable by everyone"
  ON public.matches FOR SELECT USING (true);

CREATE POLICY "Organizer can insert matches"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id AND t.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizer can update matches"
  ON public.matches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id AND t.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizer can delete matches"
  ON public.matches FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id AND t.organizer_id = auth.uid()
    )
  );

CREATE TRIGGER trg_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();