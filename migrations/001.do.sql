CREATE TABLE users (
  id SERIAL4 PRIMARY KEY,
  username VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(128) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE goals (
  id SERIAL8 PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  planned TIMESTAMPTZ,
  description TEXT,
  parent INT8 REFERENCES goals(id),
  user_id INT4 NOT NULL REFERENCES users(id)
);

CREATE TABLE tasks (
  id SERIAL8 PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  planned TIMESTAMPTZ,
  target INT2,
  performance INT2,
  done TIMESTAMPTZ,
  description TEXT,
  performance_history JSONB,
  group_id VARCHAR(40),
  goal INT8 REFERENCES goals(id),
  user_id INT4 NOT NULL REFERENCES users(id)
);
