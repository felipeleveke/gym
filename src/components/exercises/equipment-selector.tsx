'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export const EQUIPMENT_CATEGORIES = [
  {
    name: 'Sin Equipamiento',
    items: [
      { name: 'Sin Equipamiento', description: '' },
      { name: 'Peso corporal', description: 'ejercicios que solo usan el propio cuerpo' },
    ],
  },
  {
    name: 'Peso Libre',
    items: [
      { name: 'Mancuernas', description: 'pesas de mano individuales' },
      { name: 'Barra', description: 'barra olímpica o estándar con discos' },
      { name: 'Kettlebell', description: 'pesa rusa' },
      { name: 'Discos/Plates', description: 'para usar solos o en barra' },
      { name: 'Balón medicinal', description: 'para lanzamientos y trabajo de core' },
      { name: 'Sandbag', description: 'saco de arena' },
    ],
  },
  {
    name: 'Resistencia Elástica',
    items: [
      { name: 'Banda elástica', description: 'bandas de resistencia (loops o con mangos)' },
      { name: 'Tubo de resistencia', description: 'con asas intercambiables' },
    ],
  },
  {
    name: 'Máquinas y Estructuras',
    items: [
      { name: 'Máquina de poleas/Cable', description: 'polea alta, baja, cruzada' },
      { name: 'Máquina guiada (Smith)', description: 'barra con guías verticales' },
      { name: 'Máquina específica', description: 'leg press, prensa de pecho, extensión de cuádriceps, curl femoral, etc.' },
      { name: 'Rack/Jaula', description: 'estructura para sentadillas y press' },
      { name: 'Barra de dominadas', description: 'para pull-ups y colgarse' },
      { name: 'Paralelas/Dip station', description: 'para fondos y trabajo de tríceps' },
    ],
  },
  {
    name: 'Bancos y Soportes',
    items: [
      { name: 'Banco plano', description: 'superficie horizontal' },
      { name: 'Banco inclinado/declinado', description: 'con ángulo ajustable' },
      { name: 'Banco de hiperextensiones', description: 'para trabajo lumbar y glúteos' },
      { name: 'Caja/Step', description: 'para saltos y escalones' },
    ],
  },
  {
    name: 'Cardio y Funcional',
    items: [
      { name: 'Cuerda de saltar', description: 'para cardio y coordinación' },
      { name: 'Battle ropes', description: 'cuerdas gruesas para ondulaciones' },
      { name: 'TRX/Suspensión', description: 'sistema de correas para peso corporal' },
      { name: 'Rueda abdominal', description: 'ab wheel' },
      { name: 'Bosu', description: 'semiesfera de equilibrio' },
      { name: 'Fitball/Pelota suiza', description: 'para estabilidad y core' },
      { name: 'Slider discs', description: 'discos deslizantes' },
    ],
  },
  {
    name: 'Accesorios',
    items: [
      { name: 'Barra hexagonal/Trap bar', description: 'para peso muerto' },
      { name: 'Barra EZ', description: 'barra curva para bíceps/tríceps' },
      { name: 'Agarres/Fat grips', description: 'para engrosar barras' },
      { name: 'Correas/Straps', description: 'para agarre en peso muerto' },
      { name: 'Cinturón de lastre', description: 'para añadir peso en dominadas/fondos' },
    ],
  },
];

interface EquipmentSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function EquipmentSelector({ value, onChange, error }: EquipmentSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="equipment">Equipo</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger 
          id="equipment"
          className={error ? 'border-destructive' : ''}
        >
          <SelectValue placeholder="Selecciona el equipo..." />
        </SelectTrigger>
        <SelectContent className="max-h-[80vh]">
          {EQUIPMENT_CATEGORIES.map((category) => (
            <SelectGroup key={category.name}>
              <SelectLabel>{category.name}</SelectLabel>
              {category.items.map((item) => (
                <SelectItem key={item.name} value={item.name}>
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    {item.description && (
                      <span className="text-[10px] text-muted-foreground font-normal">
                        {item.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
