import { useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MaskedEmailProps {
  email: string | null | undefined;
  className?: string;
}

/**
 * Masks an email address for privacy (e.g., "j***@gmail.com").
 * Click the eye to reveal full email, copy button to copy to clipboard.
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  if (local.length <= 1) return `${local}***@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 1, 3))}@${domain}`;
}

export function MaskedEmail({ email, className = '' }: MaskedEmailProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!email) {
    return <span className={`text-muted-foreground italic ${className}`}>No email</span>;
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      toast.success('Email copied');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 group ${className}`}>
      <span
        className="text-sm text-muted-foreground select-all cursor-pointer hover:text-foreground transition-colors"
        onClick={() => setRevealed((v) => !v)}
        title={revealed ? 'Click to hide' : 'Click to reveal full email'}
      >
        {revealed ? email : maskEmail(email)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 opacity-60 hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          setRevealed((v) => !v);
        }}
        title={revealed ? 'Hide email' : 'Reveal email'}
      >
        {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 opacity-60 hover:opacity-100"
        onClick={handleCopy}
        title="Copy email"
      >
        {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      </Button>
    </span>
  );
}
