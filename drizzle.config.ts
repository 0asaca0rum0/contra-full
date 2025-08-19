// drizzle-kit 0.18.x minimal config: schema + out. Connection URL supplied via env (DATABASE_URL) when running CLI.
import type { Config } from 'drizzle-kit';

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations'
} satisfies Config;
