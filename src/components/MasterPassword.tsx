import { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { calculatePasswordStrength } from '@/lib/crypto';
import { createVault, vaultExists, unlockVault, Credential } from '@/lib/vault';
import { toast } from 'sonner';

interface MasterPasswordProps {
  onUnlock: (credentials: Credential[], masterPassword: string) => void;
}

export function MasterPassword({ onUnlock }: MasterPasswordProps) {
  const [isNewVault, setIsNewVault] = useState(!vaultExists());
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = calculatePasswordStrength(password);

  const getStrengthColor = () => {
    switch (strength.label) {
      case 'weak': return 'bg-destructive';
      case 'fair': return 'bg-warning';
      case 'good': return 'bg-primary';
      case 'strong': return 'bg-success';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isNewVault) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters');
          setIsLoading(false);
          return;
        }
        await createVault(password);
        toast.success('Vault created successfully');
        onUnlock([], password);
      } else {
        const credentials = await unlockVault(password);
        if (credentials === null) {
          setError('Invalid master password');
          setIsLoading(false);
          return;
        }
        toast.success('Vault unlocked');
        onUnlock(credentials, password);
      }
    } catch {
      setError('An error occurred. Please try again.');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative w-full max-w-md animate-fade-in">
        <div className="glass-card rounded-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 glow-primary">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">SecureVault</h1>
            <p className="text-muted-foreground mt-2 text-center">
              {isNewVault 
                ? 'Create a master password to secure your vault' 
                : 'Enter your master password to unlock'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Master Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your master password"
                  className="pl-11 pr-11"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isNewVault && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your master password"
                      className="pl-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Password strength</span>
                    <span className={`font-medium ${
                      strength.label === 'weak' ? 'text-destructive' :
                      strength.label === 'fair' ? 'text-warning' :
                      strength.label === 'good' ? 'text-primary' :
                      'text-success'
                    }`}>
                      {strength.label.charAt(0).toUpperCase() + strength.label.slice(1)}
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full"
              size="lg"
              disabled={isLoading || !password}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : isNewVault ? (
                'Create Vault'
              ) : (
                'Unlock Vault'
              )}
            </Button>
          </form>

          {isNewVault && (
            <div className="mt-6 p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Important</p>
                  <p className="text-muted-foreground mt-1">
                    Your master password cannot be recovered. If you forget it, all your data will be lost forever.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isNewVault && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              Need a new vault?{' '}
              <button
                type="button"
                onClick={() => setIsNewVault(true)}
                className="text-primary hover:underline"
              >
                Create one
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
