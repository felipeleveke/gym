'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface TimerProps {
  onRestTimeUpdate?: (seconds: number) => void;
  onExerciseTimeUpdate?: (seconds: number) => void;
  className?: string;
}

export function Timer({
  onRestTimeUpdate,
  onExerciseTimeUpdate,
  className,
}: TimerProps) {
  const [restSeconds, setRestSeconds] = useState(0);
  const [exerciseSeconds, setExerciseSeconds] = useState(0);
  
  // Estados para countdowns
  const [restCountdownEnabled, setRestCountdownEnabled] = useState(false);
  const [exerciseCountdownEnabled, setExerciseCountdownEnabled] = useState(false);
  const [restCountdownTarget, setRestCountdownTarget] = useState(60); // segundos
  const [exerciseCountdownTarget, setExerciseCountdownTarget] = useState(30); // segundos
  const [restCountdown, setRestCountdown] = useState(0);
  const [exerciseCountdown, setExerciseCountdown] = useState(0);
  
  // Estados para controlar qué está activo
  const [isResting, setIsResting] = useState(false);
  const [isExercising, setIsExercising] = useState(false);
  
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const exerciseIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown de descanso
  useEffect(() => {
    if (isResting && restCountdownEnabled && restCountdown > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestCountdown((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            onRestTimeUpdate?.(restSeconds);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
    }

    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
      }
    };
  }, [isResting, restCountdownEnabled, restCountdown, restSeconds, onRestTimeUpdate]);

  // Countdown de ejercicio
  useEffect(() => {
    if (isExercising && exerciseCountdownEnabled && exerciseCountdown > 0) {
      exerciseIntervalRef.current = setInterval(() => {
        setExerciseCountdown((prev) => {
          if (prev <= 1) {
            setIsExercising(false);
            onExerciseTimeUpdate?.(exerciseSeconds);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (exerciseIntervalRef.current) {
        clearInterval(exerciseIntervalRef.current);
        exerciseIntervalRef.current = null;
      }
    }

    return () => {
      if (exerciseIntervalRef.current) {
        clearInterval(exerciseIntervalRef.current);
      }
    };
  }, [isExercising, exerciseCountdownEnabled, exerciseCountdown, exerciseSeconds, onExerciseTimeUpdate]);

  // Cronómetro de descanso
  useEffect(() => {
    if (isResting && !restCountdownEnabled) {
      const restInterval = setInterval(() => {
        setRestSeconds((prev) => {
          const newValue = prev + 1;
          onRestTimeUpdate?.(newValue);
          return newValue;
        });
      }, 1000);

      return () => clearInterval(restInterval);
    }
  }, [isResting, restCountdownEnabled, onRestTimeUpdate]);

  // Cronómetro de ejercicio
  useEffect(() => {
    if (isExercising && !exerciseCountdownEnabled) {
      const exerciseInterval = setInterval(() => {
        setExerciseSeconds((prev) => {
          const newValue = prev + 1;
          onExerciseTimeUpdate?.(newValue);
          return newValue;
        });
      }, 1000);

      return () => clearInterval(exerciseInterval);
    }
  }, [isExercising, exerciseCountdownEnabled, onExerciseTimeUpdate]);


  const handleStartRest = () => {
    setIsResting(true);
    setIsExercising(false);
    if (restCountdownEnabled) {
      setRestCountdown(restCountdownTarget);
    }
  };

  const handleStopRest = () => {
    setIsResting(false);
    onRestTimeUpdate?.(restSeconds);
  };

  const handleStartExercise = () => {
    setIsExercising(true);
    setIsResting(false);
    if (exerciseCountdownEnabled) {
      setExerciseCountdown(exerciseCountdownTarget);
    }
  };

  const handleStopExercise = () => {
    setIsExercising(false);
    onExerciseTimeUpdate?.(exerciseSeconds);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Cronómetro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Control de ejercicio */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label>Ejercicio</Label>
            <span className="text-lg font-mono">
              {exerciseCountdownEnabled && exerciseCountdown > 0
                ? formatTime(exerciseCountdown)
                : formatTime(exerciseSeconds)}
            </span>
          </div>
          <div className="flex gap-2">
            {!isExercising ? (
              <Button
                type="button"
                onClick={handleStartExercise}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                Iniciar Ejercicio
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleStopExercise}
                size="sm"
                variant="destructive"
                className="flex-1"
              >
                Detener Ejercicio
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="exercise-countdown" className="text-sm">
              Countdown Ejercicio
            </Label>
            <div className="flex items-center gap-2">
              <Switch
                id="exercise-countdown"
                checked={exerciseCountdownEnabled}
                onCheckedChange={setExerciseCountdownEnabled}
              />
              {exerciseCountdownEnabled && (
                <Input
                  type="number"
                  min="1"
                  max="3600"
                  value={exerciseCountdownTarget}
                  onChange={(e) =>
                    setExerciseCountdownTarget(parseInt(e.target.value) || 30)
                  }
                  className="w-20 h-8"
                  placeholder="30"
                />
              )}
            </div>
          </div>
        </div>

        {/* Control de descanso */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label>Descanso</Label>
            <span className="text-lg font-mono">
              {restCountdownEnabled && restCountdown > 0
                ? formatTime(restCountdown)
                : formatTime(restSeconds)}
            </span>
          </div>
          <div className="flex gap-2">
            {!isResting ? (
              <Button
                type="button"
                onClick={handleStartRest}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                Iniciar Descanso
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleStopRest}
                size="sm"
                variant="secondary"
                className="flex-1"
              >
                Detener Descanso
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="rest-countdown" className="text-sm">
              Countdown Descanso
            </Label>
            <div className="flex items-center gap-2">
              <Switch
                id="rest-countdown"
                checked={restCountdownEnabled}
                onCheckedChange={setRestCountdownEnabled}
              />
              {restCountdownEnabled && (
                <Input
                  type="number"
                  min="1"
                  max="3600"
                  value={restCountdownTarget}
                  onChange={(e) =>
                    setRestCountdownTarget(parseInt(e.target.value) || 60)
                  }
                  className="w-20 h-8"
                  placeholder="60"
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}







