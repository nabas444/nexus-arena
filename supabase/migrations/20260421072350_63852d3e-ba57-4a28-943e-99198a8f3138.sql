-- Allow any authenticated user to register a team to an OPEN tournament that isn't full and has no bracket yet.
-- The existing "Organizer can add teams" policy still allows the organizer to add teams in any state.
CREATE POLICY "Public can register teams to open tournaments"
ON public.tournament_teams
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.tournaments t
    WHERE t.id = tournament_teams.tournament_id
      AND t.status = 'open'
      AND t.registered_teams < t.max_teams
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.matches m WHERE m.tournament_id = tournament_teams.tournament_id
  )
);