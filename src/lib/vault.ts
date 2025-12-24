import { encrypt, decrypt, hashPassword, verifyPassword } from './crypto';

export interface Credential {
  id: string;
  name: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category: CredentialCategory;
  createdAt: number;
  updatedAt: number;
  favorite: boolean;
}

export type CredentialCategory = 
  | 'social'
  | 'finance'
  | 'work'
  | 'shopping'
  | 'entertainment'
  | 'other';

export const CATEGORY_INFO: Record<CredentialCategory, { label: string; icon: string; color: string }> = {
  social: { label: 'Social', icon: 'Users', color: 'text-blue-400' },
  finance: { label: 'Finance', icon: 'CreditCard', color: 'text-emerald-400' },
  work: { label: 'Work', icon: 'Briefcase', color: 'text-purple-400' },
  shopping: { label: 'Shopping', icon: 'ShoppingBag', color: 'text-orange-400' },
  entertainment: { label: 'Entertainment', icon: 'Film', color: 'text-pink-400' },
  other: { label: 'Other', icon: 'Key', color: 'text-muted-foreground' },
};

interface VaultData {
  credentials: Credential[];
  version: number;
}

const VAULT_STORAGE_KEY = 'encrypted_vault';
const MASTER_HASH_KEY = 'master_hash';
const VAULT_VERSION = 1;

// Check if vault exists
export function vaultExists(): boolean {
  return localStorage.getItem(MASTER_HASH_KEY) !== null;
}

// Create new vault with master password
export async function createVault(masterPassword: string): Promise<void> {
  const hash = await hashPassword(masterPassword);
  localStorage.setItem(MASTER_HASH_KEY, hash);
  
  const emptyVault: VaultData = {
    credentials: [],
    version: VAULT_VERSION,
  };
  
  const encrypted = await encrypt(JSON.stringify(emptyVault), masterPassword);
  localStorage.setItem(VAULT_STORAGE_KEY, encrypted);
}

// Unlock vault and return credentials
export async function unlockVault(masterPassword: string): Promise<Credential[] | null> {
  const storedHash = localStorage.getItem(MASTER_HASH_KEY);
  if (!storedHash) return null;

  const isValid = await verifyPassword(masterPassword, storedHash);
  if (!isValid) return null;

  const encryptedVault = localStorage.getItem(VAULT_STORAGE_KEY);
  if (!encryptedVault) {
    // Create empty vault if it doesn't exist
    await createVault(masterPassword);
    return [];
  }

  try {
    const decrypted = await decrypt(encryptedVault, masterPassword);
    const vaultData: VaultData = JSON.parse(decrypted);
    return vaultData.credentials;
  } catch {
    return null;
  }
}

// Save credentials to vault
export async function saveVault(credentials: Credential[], masterPassword: string): Promise<void> {
  const vaultData: VaultData = {
    credentials,
    version: VAULT_VERSION,
  };
  
  const encrypted = await encrypt(JSON.stringify(vaultData), masterPassword);
  localStorage.setItem(VAULT_STORAGE_KEY, encrypted);
}

// Generate unique ID
export function generateId(): string {
  return crypto.randomUUID();
}

// Delete vault completely
export function deleteVault(): void {
  localStorage.removeItem(VAULT_STORAGE_KEY);
  localStorage.removeItem(MASTER_HASH_KEY);
}

// Export vault (encrypted)
export function exportVault(): string | null {
  const encrypted = localStorage.getItem(VAULT_STORAGE_KEY);
  const hash = localStorage.getItem(MASTER_HASH_KEY);
  
  if (!encrypted || !hash) return null;
  
  return JSON.stringify({ encrypted, hash, version: VAULT_VERSION });
}

// Import vault (encrypted)
export function importVault(data: string): boolean {
  try {
    const parsed = JSON.parse(data);
    if (!parsed.encrypted || !parsed.hash) return false;
    
    localStorage.setItem(VAULT_STORAGE_KEY, parsed.encrypted);
    localStorage.setItem(MASTER_HASH_KEY, parsed.hash);
    return true;
  } catch {
    return false;
  }
}
