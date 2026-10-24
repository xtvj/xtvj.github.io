export const PASSWORD_ITERATIONS = 10_000;
export const SESSION_SECONDS = 12 * 60 * 60;

export function validPassword(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 128;
}

export function randomHex(bytes = 16) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexBytes(value) {
  return Uint8Array.from(value.match(/.{2}/g), (pair) => parseInt(pair, 16));
}

function bytesHex(value) {
  return Array.from(new Uint8Array(value), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function passwordHash(password, salt, iterations = PASSWORD_ITERATIONS) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: hexBytes(salt), iterations, hash: 'SHA-256' }, key, 256);
  return bytesHex(bits);
}

export function equalHex(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

async function signature(secret, payload) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return bytesHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`admin-session:${payload}`)));
}

export async function createSession(secret, version) {
  const payload = `${version}.${Math.floor(Date.now() / 1000) + SESSION_SECONDS}.${randomHex()}`;
  return `${payload}.${await signature(secret, payload)}`;
}

export async function verifySession(secret, version, token) {
  if (!secret || typeof token !== 'string') return false;
  const match = token.match(/^(\d+)\.(\d+)\.([0-9a-f]{32})\.([0-9a-f]{64})$/);
  if (!match || Number(match[1]) !== version || Number(match[2]) <= Math.floor(Date.now() / 1000)) return false;
  const payload = `${match[1]}.${match[2]}.${match[3]}`;
  return equalHex(match[4], await signature(secret, payload));
}
