BEGIN;
ALTER TABLE cita ADD COLUMN google_event_id TEXT;

-- Un solo barbero: no puede haber dos citas activas a la misma hora
CREATE UNIQUE INDEX cita_horario_unico ON cita (fecha, hora) WHERE estado <> 'cancelada';
COMMIT;