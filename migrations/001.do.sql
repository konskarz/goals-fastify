CREATE TABLE users (
  id SERIAL4 PRIMARY KEY,
  username VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(128) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE goals (
  id SERIAL8 PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  planned TIMESTAMPTZ,
  description TEXT NOT NULL,
  parent INT8 REFERENCES goals(id),
  user_id INT4 REFERENCES users(id)
);

CREATE TABLE tasks (
  id SERIAL8 PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  planned TIMESTAMPTZ,
  target INT2,
  performance INT2,
  done TIMESTAMPTZ,
  description TEXT NOT NULL,
  performance_history JSONB NOT NULL,
  group_id VARCHAR(40),
  goal INT8 REFERENCES goals(id),
  user_id INT4 REFERENCES users(id)
);
