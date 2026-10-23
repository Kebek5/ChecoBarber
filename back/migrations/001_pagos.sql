BEGIN;
ALTER TABLE pedido
ADD COLUMN tipo_entrega    VARCHAR(10) NOT NULL DEFAULT 'envio'
            CHECK (tipo_entrega IN ('envio', 'recoger')),
ADD COLUMN direccion       TEXT,
ADD COLUMN metodo_pago     VARCHAR(12) NOT NULL DEFAULT 'efectivo'
            CHECK (metodo_pago IN ('mercadopago', 'link', 'paypal', 'terminal', 'efectivo')),
ADD COLUMN estado_pago     VARCHAR(12) NOT NULL DEFAULT 'pendiente'
            CHECK (estado_pago IN ('pendiente', 'aprobado', 'rechazado', 'cancelado', 'reembolsado')),
ADD COLUMN referencia      VARCHAR(64) UNIQUE,
ADD COLUMN proveedor_pago  VARCHAR(20),
ADD COLUMN pago_externo_id TEXT,
ADD COLUMN url_pago        TEXT,
ADD COLUMN pagado_en       TIMESTAMPTZ;
-- Los pedidos que ya existían reciben una referencia para no quedar en NULL
UPDATE pedido
   SET referencia = 'CB-' || lpad(to_hex(id), 12, '0')
WHERE referencia IS NULL;
ALTER TABLE pedido ALTER COLUMN referencia SET NOT NULL;
-- Bitácora: cada intento, notificación o cambio de estado queda registrado
CREATE TABLE pago_evento (
id         SERIAL PRIMARY KEY,
pedido_id  INT          NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
proveedor  VARCHAR(20)  NOT NULL,
evento     VARCHAR(60)  NOT NULL,
estado     VARCHAR(30),
detalle    JSONB,
creado_en  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX pago_evento_pedido_idx ON pago_evento (pedido_id);
COMMIT;