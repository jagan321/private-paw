import { useState, useEffect } from 'react';
import { MasterPassword } from '@/components/MasterPassword';
import { VaultDashboard } from '@/components/VaultDashboard';
import { Credential } from '@/lib/vault';

const Index = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [masterPassword, setMasterPassword] = useState('');

  useEffect(() => {
    document.title = 'SecureVault - Password Manager';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Zero-knowledge encrypted password manager. Store your credentials securely with AES-256 encryption.');
    }
  }, []);

  const handleUnlock = (creds: Credential[], password: string) => {
    setCredentials(creds);
    setMasterPassword(password);
    setIsUnlocked(true);
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setCredentials([]);
    setMasterPassword('');
  };

  return isUnlocked ? (
    <VaultDashboard
      credentials={credentials}
      masterPassword={masterPassword}
      onLock={handleLock}
      onUpdate={setCredentials}
    />
  ) : (
    <MasterPassword onUnlock={handleUnlock} />
  );
};

export default Index;
