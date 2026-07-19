
CREATE TABLE public.preguntas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pregunta text NOT NULL,
  respuesta text NOT NULL,
  explicacion text,
  categoria text NOT NULL,
  subcategoria text,
  nivel text NOT NULL CHECK (nivel IN ('muy_facil','facil','media','dificil','experto')),
  tipo text NOT NULL DEFAULT 'abierta' CHECK (tipo IN ('opcion_multiple','verdadero_falso','abierta','completar','imagen','audio')),
  opciones jsonb NOT NULL DEFAULT '[]'::jsonb,
  imagen text,
  fuente text,
  tags text[] NOT NULL DEFAULT '{}',
  nivel_confianza int NOT NULL DEFAULT 80 CHECK (nivel_confianza BETWEEN 0 AND 100),
  vigencia text,
  fecha_actualizacion date NOT NULL DEFAULT CURRENT_DATE,
  origen text NOT NULL DEFAULT 'seed' CHECK (origen IN ('seed','manual','ia','sync')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_preguntas_categoria ON public.preguntas(categoria);
CREATE INDEX idx_preguntas_nivel ON public.preguntas(nivel);
CREATE INDEX idx_preguntas_tipo ON public.preguntas(tipo);
CREATE INDEX idx_preguntas_created_at ON public.preguntas(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.preguntas TO anon, authenticated;
GRANT ALL ON public.preguntas TO service_role;
ALTER TABLE public.preguntas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura publica preguntas" ON public.preguntas FOR SELECT USING (true);
CREATE POLICY "Insercion publica preguntas" ON public.preguntas FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizacion publica preguntas" ON public.preguntas FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Borrado publico preguntas" ON public.preguntas FOR DELETE USING (true);

CREATE TABLE public.partidas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text,
  categoria text,
  nivel text,
  cantidad int NOT NULL DEFAULT 10,
  tiempo_segundos int NOT NULL DEFAULT 10,
  estado text NOT NULL DEFAULT 'en_curso' CHECK (estado IN ('en_curso','finalizada','abandonada')),
  correctas int NOT NULL DEFAULT 0,
  incorrectas int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_partidas_created_at ON public.partidas(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partidas TO anon, authenticated;
GRANT ALL ON public.partidas TO service_role;
ALTER TABLE public.partidas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura publica partidas" ON public.partidas FOR SELECT USING (true);
CREATE POLICY "Insercion publica partidas" ON public.partidas FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizacion publica partidas" ON public.partidas FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Borrado publico partidas" ON public.partidas FOR DELETE USING (true);

CREATE TABLE public.partida_preguntas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partida_id uuid NOT NULL REFERENCES public.partidas(id) ON DELETE CASCADE,
  pregunta_id uuid NOT NULL REFERENCES public.preguntas(id) ON DELETE CASCADE,
  orden int NOT NULL,
  resultado text CHECK (resultado IN ('correcta','incorrecta','omitida','sin_marcar')),
  segundos_usados int,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pp_partida ON public.partida_preguntas(partida_id);
CREATE INDEX idx_pp_pregunta ON public.partida_preguntas(pregunta_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partida_preguntas TO anon, authenticated;
GRANT ALL ON public.partida_preguntas TO service_role;
ALTER TABLE public.partida_preguntas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura publica pp" ON public.partida_preguntas FOR SELECT USING (true);
CREATE POLICY "Insercion publica pp" ON public.partida_preguntas FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizacion publica pp" ON public.partida_preguntas FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Borrado publico pp" ON public.partida_preguntas FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER trg_preguntas_updated BEFORE UPDATE ON public.preguntas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_partidas_updated BEFORE UPDATE ON public.partidas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.preguntas (pregunta, respuesta, explicacion, categoria, nivel, tipo, opciones, fuente, tags) VALUES
('¿Cuál es el idioma más hablado del mundo por número de hablantes nativos?', 'Chino mandarín', 'El mandarín supera los mil millones de hablantes nativos.', 'cultura_general', 'facil', 'opcion_multiple', '["Inglés","Español","Chino mandarín","Hindi"]'::jsonb, 'Ethnologue', ARRAY['idiomas']),
('¿Cuántos continentes hay tradicionalmente?', '7', 'África, América, Antártida, Asia, Europa, Oceanía y algunos modelos separan América.', 'cultura_general', 'muy_facil', 'opcion_multiple', '["5","6","7","8"]'::jsonb, NULL, ARRAY['geografia']),
('El agua hierve a 100°C al nivel del mar. Verdadero o falso.', 'Verdadero', 'A presión atmosférica estándar el punto de ebullición del agua es 100°C.', 'cultura_general', 'muy_facil', 'verdadero_falso', '["Verdadero","Falso"]'::jsonb, NULL, ARRAY['ciencia']),
('¿Quién pintó "La Mona Lisa"?', 'Leonardo da Vinci', 'Pintada entre 1503 y 1519, se exhibe en el Museo del Louvre.', 'cultura_general', 'facil', 'abierta', '[]'::jsonb, 'Louvre', ARRAY['arte']),
('Completa: "Ser o no ser, esa es la ___".', 'pregunta', 'Frase de Hamlet, de William Shakespeare.', 'cultura_general', 'facil', 'completar', '[]'::jsonb, NULL, ARRAY['literatura']),
('¿En qué año cayó el Muro de Berlín?', '1989', 'La caída ocurrió el 9 de noviembre de 1989.', 'historia', 'media', 'opcion_multiple', '["1987","1989","1991","1993"]'::jsonb, NULL, ARRAY['siglo_xx']),
('¿Quién fue el primer emperador romano?', 'Augusto', 'Cayo Julio César Octaviano, Augusto, reinó del 27 a.C. al 14 d.C.', 'historia', 'media', 'abierta', '[]'::jsonb, NULL, ARRAY['roma']),
('¿En qué siglo ocurrió la Revolución Francesa?', 'Siglo XVIII', 'La Revolución Francesa inició en 1789.', 'historia', 'facil', 'opcion_multiple', '["Siglo XVII","Siglo XVIII","Siglo XIX","Siglo XX"]'::jsonb, NULL, ARRAY['revolucion']),
('La Primera Guerra Mundial terminó en 1918. Verdadero o falso.', 'Verdadero', 'Terminó el 11 de noviembre de 1918 con el armisticio.', 'historia', 'facil', 'verdadero_falso', '["Verdadero","Falso"]'::jsonb, NULL, ARRAY['guerra_mundial']),
('¿En qué año se consumó la Independencia de México?', '1821', 'El Ejército Trigarante entró a la CDMX el 27 de septiembre de 1821.', 'historia_mexico', 'media', 'opcion_multiple', '["1810","1815","1821","1824"]'::jsonb, NULL, ARRAY['independencia']),
('¿Quién fue el "Padre de la Patria" mexicana?', 'Miguel Hidalgo', 'Miguel Hidalgo dio el Grito de Dolores el 16 de septiembre de 1810.', 'historia_mexico', 'facil', 'abierta', '[]'::jsonb, NULL, ARRAY['independencia']),
('¿Qué presidente inició la Reforma Agraria en México?', 'Lázaro Cárdenas', 'Cárdenas repartió cerca de 18 millones de hectáreas entre 1934 y 1940.', 'historia_mexico', 'dificil', 'abierta', '[]'::jsonb, NULL, ARRAY['siglo_xx']),
('¿Cómo se llamó la última capital mexica antes de la conquista?', 'Tenochtitlán', 'Fundada en 1325 en el lago de Texcoco.', 'historia_mexico', 'facil', 'abierta', '[]'::jsonb, NULL, ARRAY['prehispanico']),
('¿Cuál es el país con mayor población del mundo?', 'India', 'India superó a China como país más poblado en 2023 según la ONU.', 'geografia', 'media', 'opcion_multiple', '["China","India","Estados Unidos","Indonesia"]'::jsonb, 'ONU 2023', ARRAY['poblacion']),
('¿Cuál es el río más largo del mundo?', 'Amazonas', 'Con aprox. 6,992 km, supera al Nilo según mediciones recientes.', 'geografia', 'media', 'opcion_multiple', '["Nilo","Amazonas","Yangtsé","Misisipi"]'::jsonb, NULL, ARRAY['rios']),
('¿Cuál es la capital de Australia?', 'Canberra', 'No es Sídney: la capital planificada es Canberra.', 'geografia', 'media', 'abierta', '[]'::jsonb, NULL, ARRAY['capitales']),
('¿En qué continente está Egipto?', 'África', 'Egipto está en el noreste de África.', 'geografia', 'muy_facil', 'opcion_multiple', '["África","Asia","Europa","Oceanía"]'::jsonb, NULL, ARRAY['continentes']),
('El Everest está en la frontera entre Nepal y ___.', 'China', 'Su cima marca la frontera entre Nepal y el Tíbet, China.', 'geografia', 'media', 'completar', '[]'::jsonb, NULL, ARRAY['montanas']),
('¿Cuál es la unidad básica de la vida?', 'La célula', 'Todos los organismos vivos están compuestos por células.', 'biologia', 'muy_facil', 'abierta', '[]'::jsonb, NULL, ARRAY['celula']),
('¿Cuántos cromosomas tiene un ser humano?', '46', 'Los humanos tenemos 23 pares de cromosomas.', 'biologia', 'media', 'opcion_multiple', '["23","44","46","48"]'::jsonb, NULL, ARRAY['genetica']),
('La fotosíntesis convierte luz solar en energía química. V o F.', 'Verdadero', 'Las plantas transforman CO₂ y agua en glucosa y oxígeno usando luz.', 'biologia', 'facil', 'verdadero_falso', '["Verdadero","Falso"]'::jsonb, NULL, ARRAY['plantas']),
('¿Cuál es el símbolo químico del oro?', 'Au', 'Del latín "aurum".', 'quimica', 'facil', 'opcion_multiple', '["Or","Au","Ag","Go"]'::jsonb, NULL, ARRAY['tabla_periodica']),
('¿Cuántos elementos tiene la tabla periódica actual?', '118', 'Del hidrógeno al oganesón.', 'quimica', 'media', 'opcion_multiple', '["108","112","118","120"]'::jsonb, 'IUPAC', ARRAY['tabla_periodica']),
('El pH del agua pura es 7. Verdadero o falso.', 'Verdadero', 'Un pH de 7 indica neutralidad a 25°C.', 'quimica', 'facil', 'verdadero_falso', '["Verdadero","Falso"]'::jsonb, NULL, ARRAY['ph']),
('¿Quién formuló la teoría de la relatividad?', 'Albert Einstein', 'Publicó la relatividad especial en 1905 y la general en 1915.', 'fisica', 'facil', 'abierta', '[]'::jsonb, NULL, ARRAY['relatividad']),
('¿Cuál es la velocidad de la luz en el vacío (aprox)?', '300,000 km/s', 'Exactamente 299,792,458 m/s.', 'fisica', 'media', 'opcion_multiple', '["30,000 km/s","300,000 km/s","3,000,000 km/s","3,000 km/s"]'::jsonb, NULL, ARRAY['luz']),
('Un objeto en caída libre acelera ~9.8 m/s². V o F.', 'Verdadero', 'La aceleración de la gravedad terrestre es ~9.81 m/s².', 'fisica', 'media', 'verdadero_falso', '["Verdadero","Falso"]'::jsonb, NULL, ARRAY['gravedad']),
('¿Cuántos huesos tiene el cuerpo humano adulto?', '206', 'Los recién nacidos tienen ~270 que se fusionan.', 'medicina', 'media', 'opcion_multiple', '["186","206","216","226"]'::jsonb, NULL, ARRAY['anatomia']),
('¿Cuál es el órgano más grande del cuerpo humano?', 'La piel', 'La piel puede pesar hasta 4 kg en un adulto.', 'medicina', 'facil', 'abierta', '[]'::jsonb, NULL, ARRAY['anatomia']),
('¿Cuál es el resultado de 7 x 8?', '56', 'Tabla del 7.', 'matematicas', 'muy_facil', 'opcion_multiple', '["54","56","58","64"]'::jsonb, NULL, ARRAY['aritmetica']),
('¿Cuál es el valor aproximado de π (pi)?', '3.1416', 'Los primeros dígitos son 3.14159265…', 'matematicas', 'facil', 'opcion_multiple', '["3.1416","3.1618","2.7182","1.6180"]'::jsonb, NULL, ARRAY['constantes']),
('La suma de los ángulos internos de un triángulo es 180°. V o F.', 'Verdadero', 'En geometría euclidiana siempre suman 180°.', 'matematicas', 'facil', 'verdadero_falso', '["Verdadero","Falso"]'::jsonb, NULL, ARRAY['geometria']),
('¿Cuál es el planeta más grande del Sistema Solar?', 'Júpiter', 'Su masa es más de 300 veces la de la Tierra.', 'astronomia', 'facil', 'opcion_multiple', '["Saturno","Júpiter","Neptuno","Urano"]'::jsonb, 'NASA', ARRAY['planetas']),
('¿Cuántos planetas tiene el Sistema Solar?', '8', 'Plutón fue reclasificado como planeta enano en 2006.', 'astronomia', 'facil', 'opcion_multiple', '["7","8","9","10"]'::jsonb, 'IAU', ARRAY['planetas']),
('El Sol es una estrella. Verdadero o falso.', 'Verdadero', 'El Sol es una estrella de tipo espectral G2V.', 'astronomia', 'muy_facil', 'verdadero_falso', '["Verdadero","Falso"]'::jsonb, NULL, ARRAY['estrellas']),
('¿Quién fundó Microsoft junto con Paul Allen?', 'Bill Gates', 'Fundada en 1975 en Albuquerque, Nuevo México.', 'tecnologia', 'facil', 'abierta', '[]'::jsonb, NULL, ARRAY['empresas']),
('¿Qué significa "CPU"?', 'Central Processing Unit', 'Es la unidad central de procesamiento.', 'tecnologia', 'media', 'opcion_multiple', '["Central Processing Unit","Computer Personal Unit","Control Program Utility","Central Program Unit"]'::jsonb, NULL, ARRAY['hardware']),
('HTML es un lenguaje de programación. V o F.', 'Falso', 'HTML es un lenguaje de marcado, no de programación.', 'tecnologia', 'media', 'verdadero_falso', '["Verdadero","Falso"]'::jsonb, NULL, ARRAY['web']),
('¿Quién escribió "Cien años de soledad"?', 'Gabriel García Márquez', 'Publicada en 1967, obra cumbre del realismo mágico.', 'literatura', 'facil', 'abierta', '[]'::jsonb, NULL, ARRAY['nobel']),
('¿Autor de "Don Quijote de la Mancha"?', 'Miguel de Cervantes', 'Primera parte publicada en 1605.', 'literatura', 'facil', 'abierta', '[]'::jsonb, NULL, ARRAY['clasicos']),
('¿Qué película ganó el Óscar a Mejor Película en 2020?', 'Parásitos', 'Dirigida por Bong Joon-ho.', 'cine', 'dificil', 'opcion_multiple', '["1917","Parásitos","Joker","Once Upon a Time in Hollywood"]'::jsonb, 'Academy Awards', ARRAY['oscar']),
('¿Quién dirigió "Titanic" (1997)?', 'James Cameron', 'Ganó 11 Óscares.', 'cine', 'media', 'abierta', '[]'::jsonb, NULL, ARRAY['directores']),
('¿De qué país es la banda The Beatles?', 'Reino Unido', 'Originarios de Liverpool, Inglaterra.', 'musica', 'muy_facil', 'opcion_multiple', '["Estados Unidos","Reino Unido","Australia","Canadá"]'::jsonb, NULL, ARRAY['rock']),
('¿Quién compuso la "Novena Sinfonía"?', 'Ludwig van Beethoven', 'Estrenada en 1824, incluye la "Oda a la Alegría".', 'musica', 'media', 'abierta', '[]'::jsonb, NULL, ARRAY['clasica']),
('¿Quién pintó "La noche estrellada"?', 'Vincent van Gogh', 'Pintada en 1889 desde Saint-Rémy-de-Provence.', 'arte', 'facil', 'abierta', '[]'::jsonb, 'MoMA', ARRAY['postimpresionismo']),
('¿Qué movimiento fundó Picasso junto con Braque?', 'Cubismo', 'Iniciado alrededor de 1907.', 'arte', 'media', 'opcion_multiple', '["Surrealismo","Cubismo","Fauvismo","Dadaísmo"]'::jsonb, NULL, ARRAY['vanguardias']),
('¿Cada cuántos años se celebran los Juegos Olímpicos de verano?', '4', 'Con excepciones por guerras y pandemia.', 'deportes', 'muy_facil', 'opcion_multiple', '["2","3","4","5"]'::jsonb, 'COI', ARRAY['olimpicos']),
('¿Qué país ha ganado más Copas del Mundo de futbol?', 'Brasil', 'Brasil suma 5 títulos (1958, 62, 70, 94, 2002).', 'deportes', 'facil', 'opcion_multiple', '["Alemania","Argentina","Brasil","Italia"]'::jsonb, 'FIFA', ARRAY['futbol']),
('En baloncesto, un triple vale 3 puntos. V o F.', 'Verdadero', 'Un tiro desde más allá de la línea de tres puntos vale 3.', 'deportes', 'muy_facil', 'verdadero_falso', '["Verdadero","Falso"]'::jsonb, NULL, ARRAY['basquet']),
('¿Quién es el rey de los dioses en la mitología griega?', 'Zeus', 'Equivalente al Júpiter romano.', 'mitologia', 'facil', 'opcion_multiple', '["Ares","Poseidón","Zeus","Hades"]'::jsonb, NULL, ARRAY['griega']),
('¿Qué dios azteca era el "colibrí del sur", dios de la guerra?', 'Huitzilopochtli', 'Deidad tutelar de los mexicas.', 'mitologia', 'dificil', 'abierta', '[]'::jsonb, NULL, ARRAY['azteca']),
('¿Cuál es el ingrediente principal del guacamole?', 'Aguacate', 'Del náhuatl "ahuacatl".', 'gastronomia', 'muy_facil', 'abierta', '[]'::jsonb, NULL, ARRAY['mexico']),
('¿En qué estado mexicano se originó el mole poblano?', 'Puebla', 'Atribuido a las monjas del Convento de Santa Rosa.', 'cultura_mexicana', 'media', 'abierta', '[]'::jsonb, NULL, ARRAY['comida']),
('¿Qué día se celebra principalmente el Día de Muertos?', '2 de noviembre', 'El 1 se dedica a los niños y el 2 a los adultos.', 'cultura_mexicana', 'facil', 'opcion_multiple', '["31 de octubre","1 de noviembre","2 de noviembre","5 de noviembre"]'::jsonb, 'UNESCO', ARRAY['tradiciones']),
('"Pienso, luego existo" es una frase atribuida a…', 'René Descartes', 'Formulada en 1637 en "Discurso del Método".', 'filosofia', 'media', 'abierta', '[]'::jsonb, NULL, ARRAY['racionalismo']),
('¿Quién fue maestro de Platón?', 'Sócrates', 'Y Platón a su vez fue maestro de Aristóteles.', 'filosofia', 'media', 'opcion_multiple', '["Aristóteles","Pitágoras","Sócrates","Heráclito"]'::jsonb, NULL, ARRAY['griega']);
