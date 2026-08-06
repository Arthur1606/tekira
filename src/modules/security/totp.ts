import crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Genera un secreto aleatorio individual en formato Base32.
 * Por defecto genera 32 caracteres Base32 (160 bits = 20 bytes exactos),
 * garantizando compatibilidad perfecta con Google Authenticator, Authy y Microsoft Authenticator.
 */
export function generateBase32Secret(length = 32): string {
  const bytes = crypto.randomBytes(length);
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += BASE32_ALPHABET[bytes[i] % 32];
  }
  return secret;
}

function base32ToBuffer(base32: string): Buffer {
  const cleanBase32 = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (let i = 0; i < cleanBase32.length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleanBase32[i]);
    if (val !== -1) {
      bits += val.toString(2).padStart(5, '0');
    }
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }

  return Buffer.from(bytes);
}

export function generateTotpCode(secret: string, timeStep = Math.floor(Date.now() / 1000 / 30)): string {
  const key = base32ToBuffer(secret);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeUInt32BE(0, 0);
  timeBuffer.writeUInt32BE(timeStep, 4);

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(timeBuffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0xf;
  const binaryCode =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = (binaryCode % 1000000).toString().padStart(6, '0');
  return otp;
}

/**
 * Valida un código TOTP de 6 dígitos contra el secreto individual del usuario.
 * Utiliza una ventana de tolerancia de ±2 pasos de tiempo (±60 segundos) para compensar desfases de reloj.
 */
export function verifyTotpCode(secret: string, code: string, window = 2): boolean {
  const cleanCode = code.trim();
  if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
    return false;
  }

  const currentStep = Math.floor(Date.now() / 1000 / 30);
  for (let i = -window; i <= window; i++) {
    const expectedOtp = generateTotpCode(secret, currentStep + i);
    if (crypto.timingSafeEqual(Buffer.from(cleanCode), Buffer.from(expectedOtp))) {
      return true;
    }
  }

  return false;
}

export function buildOtpAuthUri(issuer: string, label: string, secret: string): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedLabel = encodeURIComponent(label);
  return `otpauth://totp/${encodedIssuer}:${encodedLabel}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}
