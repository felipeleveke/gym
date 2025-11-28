'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatDate, formatTime, formatDateRelative, cn } from '@/lib/utils';
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

interface SportTrainingCardProps {
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
  showDateHeader?: boolean;
  isSelected?: boolean;
  onSelectChange?: (selected: boolean) => void;
}

export function SportTrainingCard({ 
  training, 
  showDateHeader = false,
  isSelected = false,
  onSelectChange
}: SportTrainingCardProps) {
  
  const sportLabel = training.sport_type ? (sportTypeLabels[training.sport_type] || training.sport_type) : 'Deporte';

  const handleCheckboxChange = (checked: boolean) => {
    onSelectChange?.(checked);
  };

  return (
    <Card className={cn(
      "hover:shadow-md transition-shadow",
      isSelected && "ring-2 ring-primary"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {onSelectChange && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleCheckboxChange}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0"
              />
            )}
            <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold">{sportLabel}</h3>
              {showDateHeader && (
                <p className="text-sm text-muted-foreground">
                  {formatDateRelative(training.date)} a las {formatTime(training.date)}
                </p>
              )}
            </div>
          </div>
          {!showDateHeader && (
            <div className="text-right">
              <p className="text-sm font-medium">{formatDateRelative(training.date)}</p>
              <p className="text-xs text-muted-foreground">{formatTime(training.date)}</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          {training.duration && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{training.duration} min</span>
            </div>
          )}
          {training.distance && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{training.distance} km</span>
            </div>
          )}
          {training.avg_speed && (
            <div className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              <span>{training.avg_speed} km/h</span>
            </div>
          )}
          {training.avg_heart_rate && (
            <div className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              <span>{training.avg_heart_rate} bpm</span>
            </div>
          )}
        </div>

        {(training.elevation || training.terrain || training.weather || training.temperature) && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
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

        {training.tags && training.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {training.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {training.notes && (
          <div className="line-clamp-3">
            <MarkdownNotes content={training.notes} />
          </div>
        )}
      </CardContent>

    </Card>
  );
}




