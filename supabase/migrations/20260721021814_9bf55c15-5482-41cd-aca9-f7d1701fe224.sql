GRANT SELECT, INSERT, UPDATE, DELETE ON public.partidas TO authenticated;
GRANT ALL ON public.partidas TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partida_preguntas TO authenticated;
GRANT ALL ON public.partida_preguntas TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.preguntas TO authenticated;
GRANT ALL ON public.preguntas TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;