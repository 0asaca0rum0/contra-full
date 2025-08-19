-- Default permissions based on role on INSERT
CREATE OR REPLACE FUNCTION public.set_default_permissions()
RETURNS trigger AS $$
BEGIN
  IF NEW.permissions IS NULL OR array_length(NEW.permissions, 1) IS NULL OR array_length(NEW.permissions, 1) = 0 THEN
    IF NEW.role = 'ADMIN' THEN
      NEW.permissions := ARRAY['*']::text[];
    ELSIF NEW.role = 'MOD' THEN
      NEW.permissions := ARRAY[
        'projects:read',
        'reports:read',
        'suppliers:write',
        'warehouse:write',
        'attendance:write',
        'transactions:write'
      ]::text[];
    ELSE
      -- PM default
      NEW.permissions := ARRAY[
        'projects:read',
        'attendance:write',
        'transactions:write',
        'warehouse:read'
      ]::text[];
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_default_permissions ON users;
CREATE TRIGGER users_default_permissions
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION public.set_default_permissions();
