-- ============================================================
-- Proyecto · Backend GraphQL · Base de datos PostgreSQL
-- Modela el DER: Usuario, Pedido, DetallePedido, Producto,
-- Categoria, Servicio, Cita
-- ============================================================

CREATE TABLE usuario (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(255)              NOT NULL,
  telefono    VARCHAR(10)               NOT NULL,
  correo      VARCHAR(128)              NOT NULL UNIQUE,
  contrasena  TEXT                      NOT NULL,
  rol         VARCHAR(10)               NOT NULL DEFAULT 'cliente'
              CHECK (rol IN ('cliente', 'admin'))
);

CREATE TABLE categoria (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(255) NOT NULL,
  descripcion TEXT
);

CREATE TABLE producto (
  id            SERIAL        PRIMARY KEY,
  nombre        VARCHAR(255)  NOT NULL,
  descripcion   TEXT,
  precio        FLOAT         NOT NULL,
  stock         INT           NOT NULL DEFAULT 0,
  categoria_id  INT           NOT NULL,
  imagen        TEXT,
  FOREIGN KEY (categoria_id) REFERENCES categoria(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE pedido (
  id          SERIAL PRIMARY KEY,
  fecha       DATE  NOT NULL,
  total       FLOAT NOT NULL DEFAULT 0,
  estado      VARCHAR(10) NOT NULL DEFAULT 'pendiente'
              CHECK (estado IN ('pendiente', 'en_proceso', 'realizado')),
  metodo_pago VARCHAR(12)
              CHECK (metodo_pago IN ('mercadopago', 'paypal')),
  estado_pago VARCHAR(12) NOT NULL DEFAULT 'pendiente'
              CHECK (estado_pago IN ('pendiente', 'pagado')),
  pago_ref    TEXT,
  cliente_id  INT   NOT NULL,
  FOREIGN KEY (cliente_id) REFERENCES usuario(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE detalle_pedido (
  id              SERIAL PRIMARY KEY,
  cantidad        INT   NOT NULL,
  precio_unitario FLOAT NOT NULL,
  pedido_id       INT   NOT NULL,
  producto_id     INT   NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedido(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES producto(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);


CREATE TABLE servicio (
  id          SERIAL        PRIMARY KEY,
  nombre      VARCHAR(255)  NOT NULL,
  descripcion TEXT,
  precio      FLOAT         NOT NULL,
  duracion    VARCHAR(128)  NOT NULL
);

CREATE TABLE cita (
  id          SERIAL PRIMARY KEY,
  fecha       DATE  NOT NULL,
  hora        TIME  NOT NULL,
  estado      VARCHAR(10) NOT NULL DEFAULT 'pendiente'
              CHECK (estado IN ('pendiente', 'completada', 'cancelada')),
  precio      FLOAT NOT NULL,
  cliente_id  INT   NOT NULL,
  servicio_id INT   NOT NULL,
  FOREIGN KEY (cliente_id) REFERENCES usuario(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (servicio_id) REFERENCES servicio(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);


INSERT INTO usuario (nombre, telefono, correo, contrasena, rol) VALUES
  ('Admin Demo',   '3312345678', 'admin@demo.com',   'admin123',   'admin'),
  ('Cliente Uno',  '3387654321', 'cliente1@demo.com','cliente123', 'cliente'),
  ('Cliente Dos',  '3311122334', 'cliente2@demo.com','cliente123', 'cliente');

INSERT INTO categoria (nombre, descripcion) VALUES
  ('Cuidado de barba', 'Aceites, balsamos y cera para barba'),
  ('Cuidado de cabello', 'Shampoos, pomadas y tratamientos'),
  ('Accesorios', 'Peines, tijeras y navajas');

INSERT INTO producto (nombre, descripcion, precio, stock, categoria_id, imagen) VALUES
  ('Aceite para barba premium', 'Hidrata y suaviza la barba', 189.00, 40, 1, 'aceite-barba.jpg'),
  ('Cera moldeadora',           'Fijacion fuerte sin brillo',  149.00, 60, 1, 'cera.jpg'),
  ('Shampoo anticaida',         'Formula fortalecedora',       179.00, 35, 2, 'shampoo.jpg'),
  ('Pomada mate',               'Acabado natural todo el dia',  159.00, 50, 2, 'pomada.jpg'),
  ('Peine de madera',           'Peine artesanal antiestatico', 99.00, 80, 3, 'peine.jpg'),
  ('Navaja clasica',            'Navaja de barbero acero inox', 349.00, 20, 3, 'navaja.jpg');

INSERT INTO servicio (nombre, descripcion, precio, duracion) VALUES
  ('Corte de cabello', 'Corte clasico o a la moda', 150.00, '30 min'),
  ('Arreglo de barba',  'Perfilado y afeitado',      120.00, '25 min'),
  ('Corte + barba',     'Paquete completo',          240.00, '50 min');
