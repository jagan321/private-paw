import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Credential, CredentialCategory, CATEGORY_INFO, generateId } from '@/lib/vault';
import { PasswordGenerator } from './PasswordGenerator';
import { calculatePasswordStrength } from '@/lib/crypto';

interface CredentialFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (credential: Credential) => void;
  credential?: Credential | null;
}

export function CredentialForm({ open, onClose, onSave, credential }: CredentialFormProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<CredentialCategory>('other');
  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  const strength = calculatePasswordStrength(password);

  useEffect(() => {
    if (credential) {
      setName(credential.name);
      setUsername(credential.username);
      setPassword(credential.password);
      setUrl(credential.url || '');
      setNotes(credential.notes || '');
      setCategory(credential.category);
    } else {
      setName('');
      setUsername('');
      setPassword('');
      setUrl('');
      setNotes('');
      setCategory('other');
    }
    setShowPassword(false);
    setShowGenerator(false);
  }, [credential, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newCredential: Credential = {
      id: credential?.id || generateId(),
      name,
      username,
      password,
      url: url || undefined,
      notes: notes || undefined,
      category,
      createdAt: credential?.createdAt || Date.now(),
      updatedAt: Date.now(),
      favorite: credential?.favorite || false,
    };

    onSave(newCredential);
    onClose();
  };

  const getStrengthColor = () => {
    switch (strength.label) {
      case 'weak': return 'bg-destructive';
      case 'fair': return 'bg-warning';
      case 'good': return 'bg-primary';
      case 'strong': return 'bg-success';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {credential ? 'Edit Credential' : 'Add New Credential'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Gmail, Twitter"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={(v) => setCategory(v as CredentialCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <span className={info.color}>{info.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Username / Email *</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Password *</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowGenerator(!showGenerator)}
              >
                <Wand2 className="w-4 h-4 mr-1" />
                Generate
              </Button>
            </div>
            
            {showGenerator ? (
              <div className="p-4 bg-secondary/30 rounded-lg border border-border">
                <PasswordGenerator 
                  onSelect={(p) => {
                    setPassword(p);
                    setShowGenerator(false);
                  }}
                  compact
                />
              </div>
            ) : (
              <>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="pr-10 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      strength.label === 'weak' ? 'text-destructive' :
                      strength.label === 'fair' ? 'text-warning' :
                      strength.label === 'good' ? 'text-primary' :
                      'text-success'
                    }`}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Website URL</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              type="url"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {credential ? 'Save Changes' : 'Add Credential'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
