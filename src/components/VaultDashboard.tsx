import { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Shield, 
  LogOut, 
  Lock,
  Filter,
  Star,
  Users,
  CreditCard,
  Briefcase,
  ShoppingBag,
  Film,
  Key,
  Wand2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Credential, CredentialCategory, CATEGORY_INFO, saveVault, deleteVault } from '@/lib/vault';
import { calculatePasswordStrength } from '@/lib/crypto';
import { CredentialCard } from './CredentialCard';
import { CredentialForm } from './CredentialForm';
import { PasswordGenerator } from './PasswordGenerator';
import { toast } from 'sonner';

interface VaultDashboardProps {
  credentials: Credential[];
  masterPassword: string;
  onLock: () => void;
  onUpdate: (credentials: Credential[]) => void;
}

const CATEGORY_ICONS: Record<CredentialCategory | 'all' | 'favorites', React.ElementType> = {
  all: Key,
  favorites: Star,
  social: Users,
  finance: CreditCard,
  work: Briefcase,
  shopping: ShoppingBag,
  entertainment: Film,
  other: Key,
};

export function VaultDashboard({ credentials, masterPassword, onLock, onUpdate }: VaultDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CredentialCategory | 'all' | 'favorites'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const filteredCredentials = useMemo(() => {
    return credentials.filter(cred => {
      const matchesSearch = 
        cred.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cred.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cred.url?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = 
        selectedCategory === 'all' ||
        (selectedCategory === 'favorites' && cred.favorite) ||
        cred.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [credentials, searchQuery, selectedCategory]);

  const stats = useMemo(() => {
    const total = credentials.length;
    const weak = credentials.filter(c => calculatePasswordStrength(c.password).label === 'weak').length;
    const reused = credentials.length - new Set(credentials.map(c => c.password)).size;
    
    return { total, weak, reused };
  }, [credentials]);

  const handleSave = async (credential: Credential) => {
    const exists = credentials.find(c => c.id === credential.id);
    let updated: Credential[];
    
    if (exists) {
      updated = credentials.map(c => c.id === credential.id ? credential : c);
      toast.success('Credential updated');
    } else {
      updated = [...credentials, credential];
      toast.success('Credential added');
    }

    onUpdate(updated);
    await saveVault(updated, masterPassword);
  };

  const handleDelete = async (id: string) => {
    const updated = credentials.filter(c => c.id !== id);
    onUpdate(updated);
    await saveVault(updated, masterPassword);
    setShowDeleteConfirm(null);
    toast.success('Credential deleted');
  };

  const handleToggleFavorite = async (id: string) => {
    const updated = credentials.map(c => 
      c.id === id ? { ...c, favorite: !c.favorite } : c
    );
    onUpdate(updated);
    await saveVault(updated, masterPassword);
  };

  const handleResetVault = () => {
    deleteVault();
    toast.success('Vault deleted');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-foreground">SecureVault</h1>
                <p className="text-xs text-muted-foreground">{stats.total} credentials</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setShowGenerator(true)} title="Password Generator">
                <Wand2 className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onLock} title="Lock Vault">
                <Lock className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Health Overview */}
        {(stats.weak > 0 || stats.reused > 0) && (
          <div className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded-xl animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-warning">Password Health Alert</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.weak > 0 && `${stats.weak} weak password${stats.weak > 1 ? 's' : ''}`}
                  {stats.weak > 0 && stats.reused > 0 && ' • '}
                  {stats.reused > 0 && `${stats.reused} reused password${stats.reused > 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search credentials..."
              className="pl-11"
            />
          </div>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  {selectedCategory === 'all' ? 'All' : 
                   selectedCategory === 'favorites' ? 'Favorites' :
                   CATEGORY_INFO[selectedCategory].label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedCategory('all')}>
                  <Key className="w-4 h-4 mr-2" />
                  All Credentials
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedCategory('favorites')}>
                  <Star className="w-4 h-4 mr-2 text-warning" />
                  Favorites
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {Object.entries(CATEGORY_INFO).map(([key, info]) => {
                  const Icon = CATEGORY_ICONS[key as CredentialCategory];
                  return (
                    <DropdownMenuItem 
                      key={key} 
                      onClick={() => setSelectedCategory(key as CredentialCategory)}
                    >
                      <Icon className={`w-4 h-4 mr-2 ${info.color}`} />
                      {info.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={() => { setEditingCredential(null); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </div>
        </div>

        {/* Credentials Grid */}
        {filteredCredentials.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCredentials.map((credential, index) => (
              <div key={credential.id} style={{ animationDelay: `${index * 50}ms` }}>
                <CredentialCard
                  credential={credential}
                  onEdit={(c) => { setEditingCredential(c); setShowForm(true); }}
                  onDelete={(id) => setShowDeleteConfirm(id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <Key className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {searchQuery || selectedCategory !== 'all' ? 'No matches found' : 'No credentials yet'}
            </h3>
            <p className="text-muted-foreground mt-2 max-w-sm">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Add your first credential to get started'}
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <Button onClick={() => setShowForm(true)} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Credential
              </Button>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>Your data is encrypted locally with AES-256</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-destructive hover:text-destructive"
              onClick={() => setShowResetConfirm(true)}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Delete Vault
            </Button>
          </div>
        </footer>
      </main>

      {/* Credential Form Modal */}
      <CredentialForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingCredential(null); }}
        onSave={handleSave}
        credential={editingCredential}
      />

      {/* Password Generator Modal */}
      <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Password Generator</DialogTitle>
          </DialogHeader>
          <PasswordGenerator />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Delete Credential</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this credential? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Vault Confirmation */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Entire Vault</DialogTitle>
            <DialogDescription>
              This will permanently delete all your credentials and reset the vault. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleResetVault}>
              Delete Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
