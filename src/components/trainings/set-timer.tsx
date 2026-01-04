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
  restingSetId?: string | null; // ID de la serie actualmente en descanso
  defaultRestTime?: number; // Tiempo predeterminado de descanso para el countdown
  targetTut?: number | null; // Tiempo bajo tensión objetivo (cuenta regresiva al iniciar)
  targetRest?: number | null; // Descanso específico para esta serie (prioridad sobre defaultRestTime)
  weight?: number | null; // Peso de la serie
  reps?: number | null; // Repeticiones de la serie
  rir?: number | null; // RIR de la serie
  onExerciseTimeUpdate?: (seconds: number) => void;
  onRestTimeUpdate?: (seconds: number) => void;
  onTutStateUpdate?: (isTutMode: boolean, countdown: number) => void; // Callback para el estado del TUT
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
  restingSetId,
  defaultRestTime = 60,
  targetTut,
  targetRest,
  weight,
  reps,
  rir,
  onExerciseTimeUpdate,
  onRestTimeUpdate,
  onTutStateUpdate,
  onStart,
  onRest,
  onComplete,
  className,
}: SetTimerProps) {
  // Estado principal: idle -> tut_countdown -> exercising -> resting -> completed
  const [state, setState] = useState<'idle' | 'tut_countdown' | 'exercising' | 'resting' | 'completed'>('idle');
  const [exerciseSeconds, setExerciseSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  
  // Estados para cuenta regresiva TUT (Tiempo Bajo Tensión)
  const [tutCountdown, setTutCountdown] = useState(0);
  const [tutEnabled, setTutEnabled] = useState(false);
  
  // Estados para cuenta regresiva de descanso
  const [restCountdownEnabled, setRestCountdownEnabled] = useState(false);
  // Usar targetRest si está disponible, sino defaultRestTime
  const effectiveRestTime = targetRest ?? defaultRestTime;
  const [restCountdownTarget, setRestCountdownTarget] = useState(effectiveRestTime);
  const [restCountdown, setRestCountdown] = useState(0);
  const [hasCustomRestTime, setHasCustomRestTime] = useState(false);
  
  // Inicializar TUT enabled si hay targetTut definido
  useEffect(() => {
    if (targetTut && targetTut > 0) {
      setTutEnabled(true);
      setTutCountdown(targetTut);
    } else {
      setTutEnabled(false);
      setTutCountdown(0);
    }
  }, [targetTut]);
  
  // Actualizar el target de descanso cuando cambian los props
  useEffect(() => {
    if (!hasCustomRestTime) {
      const newRestTime = targetRest ?? defaultRestTime;
      setRestCountdownTarget(newRestTime);
      // Auto-enable countdown si hay targetRest
      if (targetRest && targetRest > 0) {
        setRestCountdownEnabled(true);
      }
    }
  }, [defaultRestTime, targetRest, hasCustomRestTime]);
  
  const exerciseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tutIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs para callbacks para evitar recrear intervalos cuando cambian
  const onExerciseTimeUpdateRef = useRef(onExerciseTimeUpdate);
  const onRestTimeUpdateRef = useRef(onRestTimeUpdate);
  const onTutStateUpdateRef = useRef(onTutStateUpdate);
  const onRestRef = useRef(onRest);
  const onCompleteRef = useRef(onComplete);
  
  // Mantener refs actualizados
  useEffect(() => {
    onExerciseTimeUpdateRef.current = onExerciseTimeUpdate;
    onRestTimeUpdateRef.current = onRestTimeUpdate;
    onTutStateUpdateRef.current = onTutStateUpdate;
    onRestRef.current = onRest;
    onCompleteRef.current = onComplete;
  });

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
      if (tutIntervalRef.current) {
        clearInterval(tutIntervalRef.current);
        tutIntervalRef.current = null;
      }
    }
  }, [isCompleted, state]);

  // Sincronizar estado de descanso cuando se detiene desde el modal
  useEffect(() => {
    // Si esta serie está marcada como en descanso globalmente y está ejercitándose,
    // cambiar automáticamente a estado de descanso
    if (restingSetId === setId && (state === 'exercising' || state === 'tut_countdown')) {
      // Guardar tiempo de ejercicio antes de cambiar a descanso
      if (state === 'exercising') {
        onExerciseTimeUpdateRef.current?.(exerciseSeconds);
      } else if (state === 'tut_countdown' && targetTut) {
        // Si estaba en TUT, el tiempo de ejercicio es el targetTut
        onExerciseTimeUpdateRef.current?.(targetTut);
      }
      
      // Cambiar a estado de descanso
      setState('resting');
      
      // Detener intervalos de ejercicio
      if (exerciseIntervalRef.current) {
        clearInterval(exerciseIntervalRef.current);
        exerciseIntervalRef.current = null;
      }
      if (tutIntervalRef.current) {
        clearInterval(tutIntervalRef.current);
        tutIntervalRef.current = null;
      }
      
      // Iniciar countdown si está habilitado
      if (restCountdownEnabled) {
        setRestCountdown(restCountdownTarget);
      }
      
      // Resetear tiempo de ejercicio
      setExerciseSeconds(0);
      setTutCountdown(0);
      
      // Llamar callback de descanso
      onRestRef.current();
    }
  }, [restingSetId, setId, state, exerciseSeconds, targetTut, restCountdownEnabled, restCountdownTarget]);

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
      onRestTimeUpdateRef.current?.(restSeconds);
    }
  }, [activeSetId, setId, state, restSeconds]);

  // Notificar estado del TUT al padre cuando cambia el modo (solo al entrar/salir, no cada segundo)
  useEffect(() => {
    if (state === 'tut_countdown') {
      // Notificar entrada al modo TUT con el valor inicial
      onTutStateUpdateRef.current?.(true, tutCountdown);
    } else {
      onTutStateUpdateRef.current?.(false, 0);
    }
    // Solo ejecutar cuando cambia el estado, el countdown se actualiza desde el interval
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Cuenta regresiva TUT (Tiempo Bajo Tensión)
  useEffect(() => {
    if (state === 'tut_countdown') {
      // Solo crear el interval si no existe ya
      if (!tutIntervalRef.current) {
        tutIntervalRef.current = setInterval(() => {
          setTutCountdown((prev) => {
            const newValue = prev - 1;
            
            if (newValue <= 0) {
              // TUT terminó, reproducir alerta y cambiar a estado de descanso
              playAlarm();
              // Guardar tiempo de ejercicio (el TUT es el tiempo de ejercicio)
              onExerciseTimeUpdateRef.current?.(targetTut || 0);
              // Notificar que TUT terminó
              onTutStateUpdateRef.current?.(false, 0);
              if (isLastSet) {
                setState('completed');
                onCompleteRef.current?.();
              } else {
                // Automáticamente pasar a descanso
                setState('resting');
                if (restCountdownEnabled) {
                  setRestCountdown(restCountdownTarget);
                }
                onRestRef.current();
              }
              return 0;
            }
            
            // Notificar el nuevo valor del countdown al padre
            onTutStateUpdateRef.current?.(true, newValue);
            // Actualizar tiempo de ejercicio mientras corre el TUT
            onExerciseTimeUpdateRef.current?.(targetTut ? targetTut - newValue : 0);
            return newValue;
          });
        }, 1000);
      }
    } else {
      if (tutIntervalRef.current) {
        clearInterval(tutIntervalRef.current);
        tutIntervalRef.current = null;
      }
    }

    return () => {
      if (tutIntervalRef.current) {
        clearInterval(tutIntervalRef.current);
        tutIntervalRef.current = null;
      }
    };
  }, [state, playAlarm, targetTut, isLastSet, restCountdownEnabled, restCountdownTarget]);


  // Cronómetro de ejercicio (cuando está corriendo)
  useEffect(() => {
    if (state === 'exercising') {
      exerciseIntervalRef.current = setInterval(() => {
        setExerciseSeconds((prev) => {
          const newValue = prev + 1;
          onExerciseTimeUpdateRef.current?.(newValue);
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
  }, [state]);

  // Cronómetro de descanso (siempre corre cuando está en descanso)
  useEffect(() => {
    if (state === 'resting') {
      // El descanso siempre cuenta, incluso si hay countdown
      // El countdown es solo visual, el tiempo real sigue corriendo
      restIntervalRef.current = setInterval(() => {
        setRestSeconds((prev) => {
          const newValue = prev + 1;
          onRestTimeUpdateRef.current?.(newValue);
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
  }, [state]);

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
    // No permitir iniciar si hay otra serie activa (ejercitando)
    const hasOtherActiveSet = activeSetId !== null && activeSetId !== setId;
    if (hasOtherActiveSet) {
      return;
    }
    if (state === 'idle' && canStart && canStartExercise()) {
      onStart();
      
      // Verificar directamente targetTut además de tutEnabled para mayor robustez
      // Si TUT está habilitado y hay un objetivo, usar cuenta regresiva
      const shouldUseTut = (tutEnabled || (targetTut != null && targetTut > 0)) && targetTut != null && targetTut > 0;
      
      if (shouldUseTut) {
        setState('tut_countdown');
        setTutCountdown(targetTut);
      } else {
        // Sin TUT, usar cronómetro normal
        setState('exercising');
        setExerciseSeconds(0);
      }
    }
  };

  const handleStartRest = () => {
    if (state === 'exercising' && canStartRest()) {
      // Guardar tiempo de ejercicio
      onExerciseTimeUpdateRef.current?.(exerciseSeconds);
      // Cambiar a estado de descanso (el botón mostrará "Completado")
      setState('resting');
      // Iniciar countdown si está habilitado
      if (restCountdownEnabled) {
        setRestCountdown(restCountdownTarget);
      }
      onRestRef.current();
    }
  };

  const handleComplete = () => {
    if (state === 'exercising' && canStartRest()) {
      setState('completed');
      // Guardar tiempo de ejercicio
      onExerciseTimeUpdateRef.current?.(exerciseSeconds);
      onCompleteRef.current?.();
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
    if (state === 'tut_countdown') {
      return 'TUT en curso...';
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
    if (state === 'tut_countdown') {
      return 'destructive' as const;
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
        if (canStartRest()) {
          handleComplete();
        }
      } else {
        if (canStartRest()) {
          handleStartRest();
        }
      }
    }
  };

  const getDisabledReason = () => {
    // Verificar si hay otra serie activa (ejercitando)
    const hasOtherActiveSet = activeSetId !== null && activeSetId !== setId;
    if (state === 'idle' && hasOtherActiveSet) {
      return 'Hay otra serie en curso. Completa o detén la serie activa antes de iniciar una nueva';
    }
    if (state === 'idle' && !canStartExercise()) {
      return 'Ingresa el peso para comenzar';
    }
    if (state === 'exercising' && !canStartRest()) {
      const missing = [];
      if (!reps || reps <= 0) missing.push('repeticiones');
      if (rir === null || rir === undefined) missing.push('RIR');
      if (isLastSet) {
        return `Ingresa ${missing.join(' y ')} para terminar el entrenamiento`;
      } else {
        return `Ingresa ${missing.join(' y ')} para activar el descanso`;
      }
    }
    return null;
  };

  const isButtonDisabled = () => {
    if (state === 'completed' || state === 'resting' || state === 'tut_countdown') {
      return true;
    }
    if (state === 'idle') {
      // Deshabilitar si hay otra serie activa (ejercitando), o si no cumple las condiciones para iniciar
      const hasOtherActiveSet = activeSetId !== null && activeSetId !== setId;
      return hasOtherActiveSet || !canStart || !canStartExercise();
    }
    if (state === 'exercising') {
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
                  ) : state === 'tut_countdown' ? (
                    <>
                      <Pause className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1 animate-pulse" />
                      <span className="hidden sm:inline">{getButtonText()}</span>
                      <span className="sm:hidden">⏱</span>
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
          {state === 'tut_countdown' ? (
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs text-muted-foreground">TUT</span>
              <span className={cn(
                'text-xs sm:text-sm font-mono font-semibold',
                tutCountdown <= 5 ? 'text-destructive animate-pulse' : 'text-orange-500'
              )}>
                {formatTime(tutCountdown)}
              </span>
            </div>
          ) : state === 'exercising' ? (
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
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {targetTut != null && targetTut > 0 ? 'TUT objetivo' : 'Esperando'}
              </span>
              <span className={cn(
                "text-xs sm:text-sm font-mono font-semibold",
                targetTut != null && targetTut > 0 ? "text-orange-500" : "text-muted-foreground"
              )}>
                {targetTut != null && targetTut > 0 ? formatTime(targetTut) : '00:00'}
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
