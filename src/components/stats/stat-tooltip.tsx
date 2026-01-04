'use client';

import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface StatTooltipProps {
    description: string;
    className?: string;
}

export function StatTooltip({ description, className }: StatTooltipProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            'inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors',
                            className
                        )}
                        aria-label="Información sobre esta estadística"
                    >
                        <Info className="h-3.5 w-3.5" />
                    </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                    <p className="text-sm">{description}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

