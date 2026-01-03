'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';

export type DateRangePreset = '7d' | '30d' | '90d' | '1y' | 'all';

export interface DateRange {
    startDate: string;
    endDate: string;
}

interface DateRangeFilterProps {
    value: DateRangePreset;
    onChange: (preset: DateRangePreset, range: DateRange) => void;
    className?: string;
}

const presets: Array<{ value: DateRangePreset; label: string; days: number | null }> = [
    { value: '7d', label: '7 días', days: 7 },
    { value: '30d', label: '30 días', days: 30 },
    { value: '90d', label: '90 días', days: 90 },
    { value: '1y', label: '1 año', days: 365 },
    { value: 'all', label: 'Todo', days: null },
];

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
    const handlePresetChange = (preset: DateRangePreset) => {
        const presetConfig = presets.find(p => p.value === preset);
        if (!presetConfig) return;

        let startDate: Date;
        const endDate = endOfDay(new Date());

        if (presetConfig.days === null) {
            // "Todo" - usar una fecha muy antigua
            startDate = new Date(2020, 0, 1);
        } else {
            startDate = startOfDay(subDays(new Date(), presetConfig.days));
        }

        onChange(preset, {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        });
    };

    return (
        <div className={cn('flex flex-wrap gap-2', className)}>
            {presets.map((preset) => (
                <Button
                    key={preset.value}
                    variant={value === preset.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePresetChange(preset.value)}
                    className="text-xs sm:text-sm"
                >
                    {preset.label}
                </Button>
            ))}
        </div>
    );
}








