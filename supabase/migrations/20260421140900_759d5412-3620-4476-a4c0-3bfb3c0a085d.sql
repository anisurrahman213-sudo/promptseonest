-- Move pg_net out of the public schema to address the
-- "Extension in Public" linter warning. pg_net does not support
-- ALTER EXTENSION ... SET SCHEMA, so we drop + recreate it in the
-- dedicated `extensions` schema. The HTTP functions live in their
-- own `net` schema, so application code is unaffected.
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;