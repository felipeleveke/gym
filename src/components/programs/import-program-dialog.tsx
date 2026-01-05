'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

interface ImportProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ImportProgramDialog({ open, onOpenChange, onSuccess }: ImportProgramDialogProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    if (!text.trim()) return;

    setLoading(true);
    try {
      const response = await apiFetch('/api/programs/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import program');
      }

      toast({
        title: 'Program Imported',
        description: 'The training program has been successfully created from the text.',
      });

      onSuccess();
      onOpenChange(false);
      setText('');
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Import Program with AI
          </DialogTitle>
          <DialogDescription>
            Paste your training program text below. The AI will parse it and create the structure (blocks, weeks, routines) automatically.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your program here... (e.g. 'Week 1: Monday - Chest...')"
            className="min-h-[300px] font-mono text-sm"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={loading || !text.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze & Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
