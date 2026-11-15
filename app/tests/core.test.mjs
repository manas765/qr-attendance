import test from "node:test";
import assert from "node:assert/strict";

process.env.QR_SECRET = "unit-test-secret";
const { makeToken, verifyToken } = await import("../lib/qr.js");
const { metres } = await import("../lib/geo.js");

test("fresh token verifies to its session id", () => {
  assert.equal(verifyToken(makeToken(42)), 42);
});

test("token is still valid one window (30s) later", (t) => {
  const now = Date.now();
  const token = makeToken(7);
  t.mock.method(Date, "now", () => now + 30_000);
  assert.equal(verifyToken(token), 7);
});

test("token expires after about 90 seconds", (t) => {
  const now = Date.now();
  const token = makeToken(7);
  t.mock.method(Date, "now", () => now + 90_000);
  assert.equal(verifyToken(token), null);
});

test("token from the future is rejected", (t) => {
  const now = Date.now();
  const token = makeToken(7);
  t.mock.method(Date, "now", () => now - 60_000);
  assert.equal(verifyToken(token), null);
});

test("tampered signature is rejected", () => {
  const token = makeToken(5);
  const last = token.slice(-1);
  const bad = token.slice(0, -1) + (last === "0" ? "1" : "0");
  assert.equal(verifyToken(bad), null);
});

test("signature cannot be reused for another session", () => {
  const [id, w, sig] = makeToken(5).split(".");
  assert.equal(verifyToken(`${Number(id) + 1}.${w}.${sig}`), null);
});

test("garbage input is rejected", () => {
  for (const x of ["", "abc", "1.2", "1.2.3", null, undefined])
    assert.equal(verifyToken(x), null);
});

test("distance between identical points is zero", () => {
  assert.equal(Math.round(metres(11.0, 77.0, 11.0, 77.0)), 0);
});

test("0.001 degrees of latitude is about 111 m", () => {
  const d = metres(11.0, 77.0, 11.001, 77.0);
  assert.ok(Math.abs(d - 111.2) < 1, `got ${d}`);
});

test("distance is symmetric", () => {
  const a = metres(11.0, 77.0, 11.01, 77.02);
  const b = metres(11.01, 77.02, 11.0, 77.0);
  assert.ok(Math.abs(a - b) < 0.001);
});