// Web Crypto API based encryption utilities for zero-knowledge password vault

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_ITERATIONS = 100000;

// Convert string to Uint8Array
function stringToBuffer(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert ArrayBuffer to string
function bufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer);
}

// Convert Uint8Array to base64
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Derive encryption key from master password using PBKDF2
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const passwordBuffer = stringToBuffer(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: KEY_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt data with AES-256-GCM
export async function encrypt(plaintext: string, masterPassword: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(masterPassword, salt);

  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    stringToBuffer(plaintext) as BufferSource
  );

  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + encryptedData.byteLength);
  combined.set(salt, 0);
  combined.set(iv, SALT_LENGTH);
  combined.set(new Uint8Array(encryptedData), SALT_LENGTH + IV_LENGTH);

  return uint8ArrayToBase64(combined);
}

// Decrypt data with AES-256-GCM
export async function decrypt(ciphertext: string, masterPassword: string): Promise<string> {
  const combined = base64ToUint8Array(ciphertext);
  
  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const encryptedData = combined.slice(SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(masterPassword, salt);

  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    encryptedData as BufferSource
  );

  return bufferToString(decryptedData);
}

// Hash password for verification (not for encryption key)
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const passwordBuffer = stringToBuffer(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer as BufferSource,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: KEY_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const combined = new Uint8Array(SALT_LENGTH + derivedBits.byteLength);
  combined.set(salt, 0);
  combined.set(new Uint8Array(derivedBits), SALT_LENGTH);

  return uint8ArrayToBase64(combined);
}

// Verify password against stored hash
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const combined = base64ToUint8Array(storedHash);
    const salt = combined.slice(0, SALT_LENGTH);
    
    const passwordBuffer = stringToBuffer(password);
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer as BufferSource,
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: KEY_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    const storedBits = combined.slice(SALT_LENGTH);
    const newBits = new Uint8Array(derivedBits);

    if (storedBits.length !== newBits.length) return false;
    
    for (let i = 0; i < storedBits.length; i++) {
      if (storedBits[i] !== newBits[i]) return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

// Generate a secure random password
export function generatePassword(
  length: number = 16,
  options: {
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    symbols?: boolean;
  } = {}
): string {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
  } = options;

  let charset = '';
  if (uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) charset += '0123456789';
  if (symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (charset.length === 0) {
    charset = 'abcdefghijklmnopqrstuvwxyz';
  }

  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }

  return password;
}

// Calculate password strength (0-100)
export function calculatePasswordStrength(password: string): {
  score: number;
  label: 'weak' | 'fair' | 'good' | 'strong';
  suggestions: string[];
} {
  let score = 0;
  const suggestions: string[] = [];

  // Length scoring
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 15;
  if (password.length >= 16) score += 15;
  if (password.length >= 20) score += 10;

  if (password.length < 8) {
    suggestions.push('Use at least 8 characters');
  }

  // Character variety
  if (/[a-z]/.test(password)) score += 10;
  else suggestions.push('Add lowercase letters');
  
  if (/[A-Z]/.test(password)) score += 10;
  else suggestions.push('Add uppercase letters');
  
  if (/[0-9]/.test(password)) score += 10;
  else suggestions.push('Add numbers');
  
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;
  else suggestions.push('Add special characters');

  // Bonus for mixing character types
  const varietyCount = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/]
    .filter(regex => regex.test(password)).length;
  score += varietyCount * 5;

  // Penalty for common patterns
  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
    suggestions.push('Avoid repeated characters');
  }
  if (/^[a-zA-Z]+$/.test(password) || /^[0-9]+$/.test(password)) {
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));

  let label: 'weak' | 'fair' | 'good' | 'strong';
  if (score < 30) label = 'weak';
  else if (score < 50) label = 'fair';
  else if (score < 75) label = 'good';
  else label = 'strong';

  return { score, label, suggestions };
}
