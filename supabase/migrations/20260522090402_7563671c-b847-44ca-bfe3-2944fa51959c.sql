
-- ============ TEAMS ============
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tag TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_color TEXT NOT NULL DEFAULT '270 80% 60%',
  bio TEXT,
  region TEXT NOT NULL DEFAULT 'Global',
  captain_id UUID NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teams viewable by everyone" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Authenticated can create teams" ON public.teams
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = captain_id);
CREATE POLICY "Captain can update team" ON public.teams
  FOR UPDATE TO authenticated USING (auth.uid() = captain_id);
CREATE POLICY "Captain can delete team" ON public.teams
  FOR DELETE TO authenticated USING (auth.uid() = captain_id);

CREATE TRIGGER teams_updated_at BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ TEAM MEMBERS ============
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'player', -- captain | player | sub
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members viewable by everyone" ON public.team_members FOR SELECT USING (true);

-- Security definer helper to avoid recursive RLS when checking captaincy
CREATE OR REPLACE FUNCTION public.is_team_captain(_team_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.teams WHERE id = _team_id AND captain_id = _user_id);
$$;

CREATE POLICY "Captain can add members" ON public.team_members
  FOR INSERT TO authenticated WITH CHECK (public.is_team_captain(team_id, auth.uid()));
CREATE POLICY "Captain can remove members" ON public.team_members
  FOR DELETE TO authenticated USING (public.is_team_captain(team_id, auth.uid()) OR auth.uid() = user_id);
CREATE POLICY "Captain can update members" ON public.team_members
  FOR UPDATE TO authenticated USING (public.is_team_captain(team_id, auth.uid()));

-- Auto-add captain as member on team creation
CREATE OR REPLACE FUNCTION public.add_captain_as_member()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role) VALUES (NEW.id, NEW.captain_id, 'captain');
  RETURN NEW;
END;
$$;
CREATE TRIGGER teams_add_captain AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.add_captain_as_member();

-- ============ TEAM INVITES ============
CREATE TABLE public.team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  invited_handle TEXT NOT NULL,
  invited_user_id UUID,
  invited_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | declined
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invites viewable by everyone" ON public.team_invites FOR SELECT USING (true);
CREATE POLICY "Captain can create invites" ON public.team_invites
  FOR INSERT TO authenticated WITH CHECK (public.is_team_captain(team_id, auth.uid()) AND auth.uid() = invited_by);
CREATE POLICY "Captain or invitee can update invite" ON public.team_invites
  FOR UPDATE TO authenticated USING (public.is_team_captain(team_id, auth.uid()) OR auth.uid() = invited_user_id);
CREATE POLICY "Captain can delete invite" ON public.team_invites
  FOR DELETE TO authenticated USING (public.is_team_captain(team_id, auth.uid()));

CREATE TRIGGER team_invites_updated_at BEFORE UPDATE ON public.team_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Resolve invited_user_id from handle on insert
CREATE OR REPLACE FUNCTION public.resolve_invite_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.invited_user_id IS NULL THEN
    SELECT user_id INTO NEW.invited_user_id FROM public.profiles
      WHERE handle = lower(NEW.invited_handle) LIMIT 1;
  END IF;
  NEW.invited_handle := lower(NEW.invited_handle);
  RETURN NEW;
END;
$$;
CREATE TRIGGER team_invites_resolve BEFORE INSERT ON public.team_invites
  FOR EACH ROW EXECUTE FUNCTION public.resolve_invite_user();

-- When invite is accepted, add as member
CREATE OR REPLACE FUNCTION public.handle_invite_accept()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status <> 'accepted' AND NEW.invited_user_id IS NOT NULL THEN
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (NEW.team_id, NEW.invited_user_id, 'player')
    ON CONFLICT (team_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER team_invites_on_accept AFTER UPDATE ON public.team_invites
  FOR EACH ROW EXECUTE FUNCTION public.handle_invite_accept();

CREATE INDEX idx_team_members_user ON public.team_members(user_id);
CREATE INDEX idx_team_members_team ON public.team_members(team_id);
CREATE INDEX idx_team_invites_user ON public.team_invites(invited_user_id);
CREATE INDEX idx_teams_slug ON public.teams(slug);
