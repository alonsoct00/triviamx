
CREATE TABLE public.salas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  host_id uuid NOT NULL,
  estado text NOT NULL DEFAULT 'esperando',
  categoria text,
  nivel text,
  cantidad integer NOT NULL DEFAULT 10,
  tiempo_segundos integer NOT NULL DEFAULT 20,
  pregunta_ids uuid[] NOT NULL DEFAULT '{}',
  orden_actual integer NOT NULL DEFAULT 0,
  pregunta_started_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.salas TO service_role;
ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hosts manage their salas" ON public.salas
  FOR ALL TO authenticated
  USING (host_id = auth.uid()) WITH CHECK (host_id = auth.uid());

CREATE TABLE public.sala_jugadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id uuid NOT NULL REFERENCES public.salas(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  puntos integer NOT NULL DEFAULT 0,
  correctas integer NOT NULL DEFAULT 0,
  incorrectas integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.sala_jugadores(sala_id);
GRANT ALL ON public.sala_jugadores TO service_role;
ALTER TABLE public.sala_jugadores ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sala_respuestas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id uuid NOT NULL REFERENCES public.salas(id) ON DELETE CASCADE,
  jugador_id uuid NOT NULL REFERENCES public.sala_jugadores(id) ON DELETE CASCADE,
  orden integer NOT NULL,
  respuesta text NOT NULL,
  correcta boolean NOT NULL,
  puntos integer NOT NULL DEFAULT 0,
  segundos numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (jugador_id, orden)
);
CREATE INDEX ON public.sala_respuestas(sala_id, orden);
GRANT ALL ON public.sala_respuestas TO service_role;
ALTER TABLE public.sala_respuestas ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_salas_updated BEFORE UPDATE ON public.salas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
