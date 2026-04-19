-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_handle TEXT;
  final_handle TEXT;
  suffix INT := 0;
BEGIN
  base_handle := COALESCE(
    NEW.raw_user_meta_data->>'handle',
    NEW.raw_user_meta_data->>'preferred_username',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'player'
  );
  base_handle := regexp_replace(lower(base_handle), '[^a-z0-9_]', '', 'g');
  IF base_handle = '' THEN base_handle := 'player'; END IF;

  final_handle := base_handle;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE handle = final_handle) LOOP
    suffix := suffix + 1;
    final_handle := base_handle || suffix::text;
  END LOOP;

  INSERT INTO public.profiles (user_id, handle, display_name, avatar_url)
  VALUES (
    NEW.id,
    final_handle,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', final_handle),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tighten tournaments: organizer_id required, only authed users can create
ALTER TABLE public.tournaments ALTER COLUMN organizer_id SET NOT NULL;

DROP POLICY IF EXISTS "Anyone can create tournaments" ON public.tournaments;

CREATE POLICY "Authenticated users can create tournaments"
  ON public.tournaments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = organizer_id);