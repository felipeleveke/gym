'use client';

import { formatDateRelative, formatTime, cn } from '@/lib/utils';
import { Activity, Clock, Tag, MapPin, Thermometer, Wind } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MarkdownNotes } from '@/components/ui/markdown-notes';

const sportTypeLabels: Record<string, string> = {
  running: 'Running',
  cycling: 'Ciclismo',
  swimming: 'Natación',
  football: 'Fútbol',
  basketball: 'Baloncesto',
  tennis: 'Tenis',
  other: 'Otro',
};

interface SportTrainingListItemProps {
  training: {
    id: string;
    date: string;
    duration?: number | null;
    sport_type?: string | null;
    distance?: number | null;
    avg_speed?: number | null;
    max_speed?: number | null;
    avg_heart_rate?: number | null;
    max_heart_rate?: number | null;
    elevation?: number | null;
    terrain?: string | null;
    weather?: string | null;
    temperature?: number | null;
    notes?: string | null;
    tags?: string[] | null;
  };
  isLast?: boolean;
  isSelected?: boolean;
  onSelectChange?: (selected: boolean) => void;
}

export function SportTrainingListItem({ 
  training, 
  isLast = false,
  isSelected = false,
  onSelectChange
}: SportTrainingListItemProps) {
  const sportLabel = training.sport_type ? (sportTypeLabels[training.sport_type] || training.sport_type) : 'Deporte';

  const handleCheckboxChange = (checked: boolean) => {
    onSelectChange?.(checked);
  };

  return (
    <div className={cn(
      "py-4 hover:bg-accent/50 transition-colors",
      !isLast && "border-b border-border",
      isSelected && "bg-accent/30"
    )}>
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        {/* Información principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-2">
            {onSelectChange && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleCheckboxChange}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 mt-0.5"
              />
            )}
            <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0 mt-0.5">
              <Activity className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base">{sportLabel}</h3>
                <div className="text-sm text-muted-foreground">
                  {formatDateRelative(training.date)} a las {formatTime(training.date)}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                {training.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{training.duration} min</span>
                  </div>
                )}
                {training.distance && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{training.distance} km</span>
                  </div>
                )}
                {training.avg_speed && (
                  <div className="flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5" />
                    <span>{training.avg_speed} km/h</span>
                  </div>
                )}
                {training.avg_heart_rate && (
                  <div className="flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5" />
                    <span>{training.avg_heart_rate} bpm</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Información adicional */}
          {(training.elevation || training.terrain || training.weather || training.temperature) && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground ml-8 mt-2 flex-wrap">
              {training.elevation && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{training.elevation}m elevación</span>
                </div>
              )}
              {training.terrain && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{training.terrain}</span>
                </div>
              )}
              {training.weather && (
                <div className="flex items-center gap-1">
                  <Wind className="h-3 w-3" />
                  <span>{training.weather}</span>
                </div>
              )}
              {training.temperature && (
                <div className="flex items-center gap-1">
                  <Thermometer className="h-3 w-3" />
                  <span>{training.temperature}°C</span>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {training.tags && training.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 ml-8 mt-2">
              {training.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Notas */}
          {training.notes && (
            <div className="mt-2 ml-8 line-clamp-3">
              <MarkdownNotes content={training.notes} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

