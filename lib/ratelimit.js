import { sql } from "./db";

export function clientIp(req) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
}

export async function tooMany(bucket, max, windowSec) {
  const [{ n }] = await sql`
    SELECT COUNT(*)::int AS n FROM rate_hits
    WHERE bucket = ${bucket} AND created_at > now() - make_interval(secs => ${windowSec}::float8)`;
  return n >= max;
}

export async function hit(bucket) {
  await sql`INSERT INTO rate_hits (bucket) VALUES (${bucket})`;
  if (Math.random() < 0.02)
    await sql`DELETE FROM rate_hits WHERE created_at < now() - interval '1 day'`;
}

export async function clear(bucket) {
  await sql`DELETE FROM rate_hits WHERE bucket = ${bucket}`;
}