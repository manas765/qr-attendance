import crypto from "crypto";

const STEP = 30; // seconds per QR window

const sign = (id, w) =>
  crypto.createHmac("sha256", process.env.QR_SECRET)
    .update(`${id}.${w}`).digest("hex").slice(0, 16);

export function makeToken(sessionId) {
  const w = Math.floor(Date.now() / 1000 / STEP);
  return `${sessionId}.${w}.${sign(sessionId, w)}`;
}

// returns sessionId if valid (current or previous window), else null
export function verifyToken(token) {
  const [id, w, sig] = String(token).split(".");
  if (!id || !w || !sig) return null;
  const win = Number(w);
  const now = Math.floor(Date.now() / 1000 / STEP);
  if (!Number.isInteger(win) || win > now || now - win > 1) return null;
  const expected = sign(id, win);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return Number(id);
}