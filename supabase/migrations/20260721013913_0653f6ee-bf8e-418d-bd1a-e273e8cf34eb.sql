
-- Drop all existing permissive public policies
DROP POLICY IF EXISTS "Actualizacion publica pp" ON public.partida_preguntas;
DROP POLICY IF EXISTS "Borrado publico pp" ON public.partida_preguntas;
DROP POLICY IF EXISTS "Insercion publica pp" ON public.partida_preguntas;
DROP POLICY IF EXISTS "Lectura publica pp" ON public.partida_preguntas;

DROP POLICY IF EXISTS "Actualizacion publica partidas" ON public.partidas;
DROP POLICY IF EXISTS "Borrado publico partidas" ON public.partidas;
DROP POLICY IF EXISTS "Insercion publica partidas" ON public.partidas;
DROP POLICY IF EXISTS "Lectura publica partidas" ON public.partidas;

DROP POLICY IF EXISTS "Actualizacion publica preguntas" ON public.preguntas;
DROP POLICY IF EXISTS "Borrado publico preguntas" ON public.preguntas;
DROP POLICY IF EXISTS "Insercion publica preguntas" ON public.preguntas;
DROP POLICY IF EXISTS "Lectura publica preguntas" ON public.preguntas;

-- Revoke Data API access from anon and authenticated roles.
-- All access happens through server functions using the service_role key,
-- which bypasses RLS. With no grants and no policies, direct browser
-- access via the Data API is fully blocked (default deny).
REVOKE ALL ON public.preguntas FROM anon, authenticated;
REVOKE ALL ON public.partidas FROM anon, authenticated;
REVOKE ALL ON public.partida_preguntas FROM anon, authenticated;

-- Ensure service_role retains full access for server functions
GRANT ALL ON public.preguntas TO service_role;
GRANT ALL ON public.partidas TO service_role;
GRANT ALL ON public.partida_preguntas TO service_role;

-- Keep RLS enabled (default deny for any remaining role)
ALTER TABLE public.preguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partida_preguntas ENABLE ROW LEVEL SECURITY;
