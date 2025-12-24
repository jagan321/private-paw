import { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Copy, 
  Check,
  Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { generatePassword, calculatePasswordStrength } from '@/lib/crypto';
import { toast } from 'sonner';

interface PasswordGeneratorProps {
  onSelect?: (password: string) => void;
  compact?: boolean;
}

export function PasswordGenerator({ onSelect, compact = false }: PasswordGeneratorProps) {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(!compact);

  const strength = calculatePasswordStrength(password);

  const regenerate = () => {
    const newPassword = generatePassword(length, {
      uppercase,
      lowercase,
      numbers,
      symbols,
    });
    setPassword(newPassword);
    setCopied(false);
  };

  useEffect(() => {
    regenerate();
  }, [length, uppercase, lowercase, numbers, symbols]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success('Password copied to clipboard');
    
    // Auto-clear clipboard after 30 seconds
    setTimeout(() => {
      navigator.clipboard.writeText('');
    }, 30000);
    
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(password);
      toast.success('Password applied');
    }
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
    <div className="space-y-4">
      <div className="relative">
        <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg border border-border font-mono text-sm break-all">
          <span className="flex-1 select-all">{password}</span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={regenerate}
              title="Generate new password"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        <div className="mt-2 flex items-center gap-2">
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
      </div>

      {compact && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          className="w-full"
        >
          <Settings2 className="w-4 h-4 mr-2" />
          {showSettings ? 'Hide' : 'Show'} Options
        </Button>
      )}

      {showSettings && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Length</span>
              <span className="font-mono font-medium">{length}</span>
            </div>
            <Slider
              value={[length]}
              onValueChange={(value) => setLength(value[0])}
              min={8}
              max={64}
              step={1}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
              <span className="text-sm">Uppercase (A-Z)</span>
              <Switch checked={uppercase} onCheckedChange={setUppercase} />
            </label>
            <label className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
              <span className="text-sm">Lowercase (a-z)</span>
              <Switch checked={lowercase} onCheckedChange={setLowercase} />
            </label>
            <label className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
              <span className="text-sm">Numbers (0-9)</span>
              <Switch checked={numbers} onCheckedChange={setNumbers} />
            </label>
            <label className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
              <span className="text-sm">Symbols (!@#)</span>
              <Switch checked={symbols} onCheckedChange={setSymbols} />
            </label>
          </div>
        </div>
      )}

      {onSelect && (
        <Button onClick={handleSelect} className="w-full">
          Use This Password
        </Button>
      )}
    </div>
  );
}
