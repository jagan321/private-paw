import { useState } from 'react';
import { 
  Copy, 
  Check, 
  ExternalLink, 
  MoreVertical,
  Pencil,
  Trash2,
  Star,
  Eye,
  EyeOff,
  Users,
  CreditCard,
  Briefcase,
  ShoppingBag,
  Film,
  Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Credential, CATEGORY_INFO, CredentialCategory } from '@/lib/vault';
import { calculatePasswordStrength } from '@/lib/crypto';
import { toast } from 'sonner';

interface CredentialCardProps {
  credential: Credential;
  onEdit: (credential: Credential) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const CATEGORY_ICONS: Record<CredentialCategory, React.ElementType> = {
  social: Users,
  finance: CreditCard,
  work: Briefcase,
  shopping: ShoppingBag,
  entertainment: Film,
  other: Key,
};

export function CredentialCard({ credential, onEdit, onDelete, onToggleFavorite }: CredentialCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const categoryInfo = CATEGORY_INFO[credential.category];
  const CategoryIcon = CATEGORY_ICONS[credential.category];
  const strength = calculatePasswordStrength(credential.password);

  const getStrengthColor = () => {
    switch (strength.label) {
      case 'weak': return 'bg-destructive';
      case 'fair': return 'bg-warning';
      case 'good': return 'bg-primary';
      case 'strong': return 'bg-success';
    }
  };

  const handleCopy = async (field: 'username' | 'password', value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast.success(`${field === 'username' ? 'Username' : 'Password'} copied`);
    
    if (field === 'password') {
      setTimeout(() => {
        navigator.clipboard.writeText('');
      }, 30000);
    }
    
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getFaviconUrl = (url?: string) => {
    if (!url) return null;
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return null;
    }
  };

  const faviconUrl = getFaviconUrl(credential.url);

  return (
    <div className="glass-card rounded-xl p-4 hover:border-primary/30 transition-all duration-200 group animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
          {faviconUrl ? (
            <img 
              src={faviconUrl} 
              alt="" 
              className="w-8 h-8"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = `<span class="${categoryInfo.color}"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg></span>`;
              }}
            />
          ) : (
            <CategoryIcon className={`w-6 h-6 ${categoryInfo.color}`} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{credential.name}</h3>
            {credential.favorite && (
              <Star className="w-4 h-4 text-warning fill-warning flex-shrink-0" />
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full bg-secondary ${categoryInfo.color}`}>
              {categoryInfo.label}
            </span>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${getStrengthColor()}`} />
              <span className="text-xs text-muted-foreground capitalize">{strength.label}</span>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(credential)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleFavorite(credential.id)}>
              <Star className="w-4 h-4 mr-2" />
              {credential.favorite ? 'Remove from favorites' : 'Add to favorites'}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(credential.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
          <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Username</span>
          <span className="flex-1 text-sm font-mono truncate">{credential.username}</span>
          <Button 
            variant="ghost" 
            size="icon-sm"
            onClick={() => handleCopy('username', credential.username)}
          >
            {copiedField === 'username' ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
          <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Password</span>
          <span className="flex-1 text-sm font-mono truncate">
            {showPassword ? credential.password : '•'.repeat(12)}
          </span>
          <Button 
            variant="ghost" 
            size="icon-sm"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon-sm"
            onClick={() => handleCopy('password', credential.password)}
          >
            {copiedField === 'password' ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>

        {credential.url && (
          <a 
            href={credential.url.startsWith('http') ? credential.url : `https://${credential.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg text-sm text-primary hover:bg-secondary/50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="truncate">{credential.url}</span>
          </a>
        )}
      </div>
    </div>
  );
}
