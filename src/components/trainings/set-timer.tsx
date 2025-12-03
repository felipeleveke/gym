'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Play, Pause, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SetTimerProps {
  setId: string;
  isLastSet: boolean;
  isCompleted: boolean;
  canStart: boolean; // Si puede iniciar (la serie anterior está en descanso o es la primera)
  activeSetId?: string | null; // ID de la serie actualmente activa
  defaultRestTime?: number; // Tiempo predeterminado de descanso para el countdown
  weight?: number | null; // Peso de la serie
  reps?: number | null; // Repeticiones de la serie
  rir?: number | null; // RIR de la serie
  onExerciseTimeUpdate?: (seconds: number) => void;
  onRestTimeUpdate?: (seconds: number) => void;
  onStart: () => void; // Callback cuando se inicia el ejercicio
  onRest: () => void; // Callback cuando se inicia el descanso
  onComplete?: () => void; // Callback cuando se completa (última serie)
  className?: string;
}

export function SetTimer({
  setId,
  isLastSet,
  isCompleted,
  canStart,
  activeSetId,
  defaultRestTime = 60,
  weight,
  reps,
  rir,
  onExerciseTimeUpdate,
  onRestTimeUpdate,
  onStart,
  onRest,
  onComplete,
  className,
}: SetTimerProps) {
  const [state, setState] = useState<'idle' | 'exercising' | 'resting' | 'completed'>('idle');
  const [exerciseSeconds, setExerciseSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  
  // Estados para cuenta regresiva de descanso
  const [restCountdownEnabled, setRestCountdownEnabled] = useState(false);
  const [restCountdownTarget, setRestCountdownTarget] = useState(defaultRestTime); // segundos - usa el valor predeterminado
  const [restCountdown, setRestCountdown] = useState(0);
  const [hasCustomRestTime, setHasCustomRestTime] = useState(false); // Para saber si el usuario ha configurado un valor personalizado
  
  // Actualizar el target cuando cambia el defaultRestTime solo si no hay un valor personalizado
  useEffect(() => {
    if (!hasCustomRestTime) {
      setRestCountdownTarget(defaultRestTime);
    }
  }, [defaultRestTime, hasCustomRestTime]);
  
  const exerciseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función para reproducir alarma
  const playAlarm = useCallback(() => {
    try {
      // Usar Web Audio API para generar beep
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Reproducir 3 beeps
      [0, 200, 400].forEach((delay) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        }, delay);
      });
    } catch (error) {
      console.error('Error playing alarm:', error);
    }
  }, []);

  // Sincronizar estado con props
  useEffect(() => {
    if (isCompleted && state !== 'completed') {
      setState('completed');
      // Detener todos los intervalos
      if (exerciseIntervalRef.current) {
        clearInterval(exerciseIntervalRef.current);
        exerciseIntervalRef.current = null;
      }
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }
  }, [isCompleted, state]);

  // Detener descanso cuando otra serie inicia
  useEffect(() => {
    if (state === 'resting' && activeSetId !== null && activeSetId !== setId) {
      setState('completed');
      // Detener todos los intervalos de descanso
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      // Guardar tiempo de descanso final
      onRestTimeUpdate?.(restSeconds);
    }
  }, [activeSetId, setId, state, restSeconds, onRestTimeUpdate]);

  // Cronómetro de ejercicio (cuando está corriendo)
  useEffect(() => {
    if (state === 'exercising') {
      exerciseIntervalRef.current = setInterval(() => {
        setExerciseSeconds((prev) => {
          const newValue = prev + 1;
          onExerciseTimeUpdate?.(newValue);
          return newValue;
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
  }, [state, onExerciseTimeUpdate]);

  // Cronómetro de descanso (siempre corre cuando está en descanso)
  useEffect(() => {
    if (state === 'resting') {
      // El descanso siempre cuenta, incluso si hay countdown
      // El countdown es solo visual, el tiempo real sigue corriendo
      restIntervalRef.current = setInterval(() => {
        setRestSeconds((prev) => {
          const newValue = prev + 1;
          onRestTimeUpdate?.(newValue);
          return newValue;
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
  }, [state, onRestTimeUpdate]);

  // Countdown de descanso
  useEffect(() => {
    if (state === 'resting' && restCountdownEnabled && restCountdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setRestCountdown((prev) => {
          if (prev <= 1) {
            // Cuando llega a 0, reproducir alarma
            playAlarm();
            // El countdown llega a 0 pero el descanso sigue corriendo normalmente
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [state, restCountdownEnabled, restCountdown, playAlarm]);

  // Validaciones
  const canStartExercise = () => {
    return weight !== null && weight !== undefined && weight > 0;
  };

  const canStartRest = () => {
    return reps !== null && reps !== undefined && reps > 0 && 
           rir !== null && rir !== undefined;
  };

  const handleStartExercise = () => {
    if (state === 'idle' && canStart && canStartExercise()) {
      setState('exercising');
      setExerciseSeconds(0);
      onStart();
    }
  };

  const handleStartRest = () => {
    if (state === 'exercising' && canStartRest()) {
      // Guardar tiempo de ejercicio
      onExerciseTimeUpdate?.(exerciseSeconds);
      // Cambiar a estado de descanso (el botón mostrará "Completado")
      setState('resting');
      // Iniciar countdown si está habilitado
      if (restCountdownEnabled) {
        setRestCountdown(restCountdownTarget);
      }
      onRest();
    }
  };

  const handleComplete = () => {
    if (state === 'exercising') {
      setState('completed');
      // Guardar tiempo de ejercicio
      onExerciseTimeUpdate?.(exerciseSeconds);
      onComplete?.();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getButtonText = () => {
    if (state === 'completed') {
      return 'Completado';
    }
    if (state === 'exercising') {
      if (isLastSet) {
        return 'Terminar entrenamiento';
      }
      return 'Descansar';
    }
    if (state === 'resting') {
      return 'Completado';
    }
    return 'Iniciar';
  };

  const getButtonVariant = () => {
    if (state === 'completed' || state === 'resting') {
      return 'outline' as const;
    }
    if (state === 'exercising') {
      if (isLastSet) {
        return 'default' as const;
      }
      return 'secondary' as const;
    }
    return 'default' as const;
  };

  const handleButtonClick = () => {
    if (state === 'idle') {
      if (canStartExercise()) {
        handleStartExercise();
      }
    } else if (state === 'exercising') {
      if (isLastSet) {
        handleComplete();
      } else {
        if (canStartRest()) {
          handleStartRest();
        }
      }
    }
  };

  const getDisabledReason = () => {
    if (state === 'idle' && !canStartExercise()) {
      return 'Ingresa el peso para comenzar';
    }
    if (state === 'exercising' && !isLastSet && !canStartRest()) {
      const missing = [];
      if (!reps || reps <= 0) missing.push('repeticiones');
      if (rir === null || rir === undefined) missing.push('RIR');
      return `Ingresa ${missing.join(' y ')} para activar el descanso`;
    }
    return null;
  };

  const isButtonDisabled = () => {
    if (state === 'completed' || state === 'resting') {
      return true;
    }
    if (state === 'idle') {
      return !canStart || !canStartExercise();
    }
    if (state === 'exercising' && !isLastSet) {
      return !canStartRest();
    }
    return false;
  };

  const disabledReason = getDisabledReason();
  const buttonDisabled = isButtonDisabled();

  return (
    <TooltipProvider>
      <div className={cn('flex flex-col gap-1.5 sm:gap-2', className)}>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block">
                <Button
                  type="button"
                  onClick={handleButtonClick}
                  size="sm"
                  variant={getButtonVariant()}
                  className="h-8 sm:h-9 min-w-[100px] sm:min-w-[120px] text-xs sm:text-sm"
                  disabled={buttonDisabled}
                >
                  {state === 'completed' || state === 'resting' ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                      <span className="hidden sm:inline">{getButtonText()}</span>
                      <span className="sm:hidden">✓</span>
                    </>
                  ) : state === 'exercising' ? (
                    <>
                      <Pause className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                      <span className="hidden sm:inline">{getButtonText()}</span>
                      <span className="sm:hidden">⏸</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                      <span className="hidden sm:inline">{getButtonText()}</span>
                      <span className="sm:hidden">▶</span>
                    </>
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            {disabledReason && (
              <TooltipContent>
                <p className="text-xs">{disabledReason}</p>
              </TooltipContent>
            )}
          </Tooltip>
        <div className="flex-1 min-w-[60px] sm:min-w-[80px] text-center">
          {state === 'exercising' ? (
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs text-muted-foreground">Ejercicio</span>
              <span className="text-xs sm:text-sm font-mono font-semibold text-primary">
                {formatTime(exerciseSeconds)}
              </span>
            </div>
          ) : state === 'resting' && restCountdownEnabled && restCountdown > 0 ? (
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs text-muted-foreground">Countdown</span>
              <span className={cn(
                'text-xs sm:text-sm font-mono font-semibold',
                restCountdown <= 10 ? 'text-destructive animate-pulse' : 'text-orange-500'
              )}>
                {formatTime(restCountdown)}
              </span>
            </div>
          ) : state === 'resting' ? (
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs text-muted-foreground">Descanso</span>
              <span className="text-xs sm:text-sm font-mono font-semibold text-muted-foreground">
                {formatTime(restSeconds)}
              </span>
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs text-muted-foreground">Esperando</span>
              <span className="text-xs sm:text-sm font-mono font-semibold text-muted-foreground">
                00:00
              </span>
            </div>
          )}
        </div>
      </div>
      
      {(state === 'resting' || state === 'idle') && (
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <div className="flex items-center gap-1 sm:gap-2">
            <Switch
              id={`rest-countdown-${setId}`}
              checked={restCountdownEnabled}
              onCheckedChange={(checked) => {
                setRestCountdownEnabled(checked);
                if (checked && state === 'resting') {
                  setRestCountdown(restCountdownTarget);
                } else {
                  setRestCountdown(0);
                }
              }}
              className="scale-75 sm:scale-100"
            />
            <Label htmlFor={`rest-countdown-${setId}`} className="text-[10px] sm:text-xs cursor-pointer">
              Countdown
            </Label>
          </div>
          {restCountdownEnabled && (
            <Input
              type="number"
              min="1"
              max="600"
              value={restCountdownTarget}
              onChange={(e) => {
                const value = parseInt(e.target.value) || defaultRestTime;
                setRestCountdownTarget(value);
                setHasCustomRestTime(true);
                if (state === 'resting' && restCountdown > 0) {
                  setRestCountdown(value);
                }
              }}
              className="h-6 sm:h-7 w-14 sm:w-16 text-xs"
              placeholder={defaultRestTime.toString()}
            />
          )}
        </div>
      )}
      </div>
    </TooltipProvider>
  );
}
