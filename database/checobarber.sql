CREATE TABLE usuario (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre      VARCHAR(255) NOT NULL,
  telefono    VARCHAR(10)  NOT NULL,
  correo      VARCHAR(128) NOT NULL UNIQUE,
  contrasena  TEXT         NOT NULL,
  rol         VARCHAR(10)  NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin'))
);

CREATE TABLE categoria (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre      VARCHAR(255) NOT NULL,
  descripcion TEXT
);

CREATE TABLE producto (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre        VARCHAR(255)  NOT NULL,
  descripcion   TEXT,
  precio        NUMERIC(10,2) NOT NULL,
  stock         INTEGER       NOT NULL DEFAULT 0 CHECK (stock >= 0),
  categoria_id  INTEGER       NOT NULL REFERENCES categoria(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  imagen        TEXT
);

CREATE TABLE pedido (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fecha       DATE          NOT NULL DEFAULT CURRENT_DATE,
  total       NUMERIC(10,2) NOT NULL DEFAULT 0,
  estado      VARCHAR(12)   NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'en_proceso', 'realizado')),
  cliente_id  INTEGER       NOT NULL REFERENCES usuario(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE detalle_pedido (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cantidad        INTEGER       NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,2) NOT NULL,
  pedido_id       INTEGER       NOT NULL REFERENCES pedido(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  producto_id     INTEGER       NOT NULL REFERENCES producto(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE servicio (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre      VARCHAR(255)  NOT NULL,
  descripcion TEXT,
  precio      NUMERIC(10,2) NOT NULL,
  duracion    VARCHAR(128)  NOT NULL
);

CREATE TABLE cita (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fecha       DATE          NOT NULL,
  hora        TIME          NOT NULL,
  estado      VARCHAR(12)   NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'completada', 'cancelada')),
  precio      NUMERIC(10,2) NOT NULL,
  cliente_id  INTEGER       NOT NULL REFERENCES usuario(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  servicio_id INTEGER       NOT NULL REFERENCES servicio(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO categoria (nombre, descripcion) VALUES
  ('Cuidado de barba', 'Aceites, balsamos y cera para barba'),
  ('Cuidado de cabello', 'Shampoos, pomadas y tratamientos'),
  ('Accesorios', 'Peines, tijeras y navajas');

INSERT INTO producto (nombre, descripcion, precio, stock, categoria_id, imagen) VALUES
  ('Aceite para barba premium', 'Hidrata y suaviza la barba', 189.00, 40, 1, 'aceite-barba.jpg'),
  ('Cera moldeadora',           'Fijacion fuerte sin brillo',  149.00, 60, 1, 'cera.jpg'),
  ('Shampoo anticaida',         'Formula fortalecedora',       179.00, 35, 2, 'shampoo.jpg'),
  ('Pomada mate',               'Acabado natural todo el dia', 159.00, 50, 2, 'pomada.jpg'),
  ('Peine de madera',           'Peine artesanal antiestatico', 99.00, 80, 3, 'peine.jpg'),
  ('Navaja clasica',            'Navaja de barbero acero inox', 349.00, 20, 3, 'navaja.jpg');

INSERT INTO servicio (nombre, descripcion, precio, duracion) VALUES
  ('Corte de cabello', 'Corte clasico o a la moda', 150.00, '30 min'),
  ('Arreglo de barba',  'Perfilado y afeitado',      120.00, '25 min'),
  ('Corte + barba',     'Paquete completo',          240.00, '50 min');