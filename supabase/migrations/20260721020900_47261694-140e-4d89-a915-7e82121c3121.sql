
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-assign roles: first user = admin, rest = moderator
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  SELECT count(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'moderator')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Partidas: add user_id
ALTER TABLE public.partidas ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_partidas_user_id ON public.partidas(user_id);

-- RLS policies for partidas (owner-only)
CREATE POLICY "Users manage their own partidas"
  ON public.partidas FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS for partida_preguntas (via parent partida)
CREATE POLICY "Users manage rondas of their partidas"
  ON public.partida_preguntas FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.partidas p WHERE p.id = partida_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.partidas p WHERE p.id = partida_id AND p.user_id = auth.uid()));

-- Preguntas: shared read, admin-only write
GRANT SELECT ON public.preguntas TO authenticated;

CREATE POLICY "Any authenticated user can read preguntas"
  ON public.preguntas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert preguntas"
  ON public.preguntas FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update preguntas"
  ON public.preguntas FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete preguntas"
  ON public.preguntas FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
