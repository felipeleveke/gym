import { apiFetch } from './api';

export const COMMON_MUSCLE_GROUPS = [
  'Pecho (Pectorales)',
  'Espalda',
  'Hombros (Deltoides)',
  'Bíceps',
  'Tríceps',
  'Antebrazos',
  'Cuádriceps',
  'Isquiotibiales',
  'Glúteos',
  'Aductores',
  'Abductores',
  'Pantorrillas',
  'Abdominales',
  'Lumbar / Espalda baja',
] as const;

export interface MuscleGroupDB {
  name: string;
  category: 'Tren Superior' | 'Tren Inferior' | 'Zona Media';
}

export type MuscleGroup = typeof COMMON_MUSCLE_GROUPS[number] | string;

// Función para obtener grupos musculares únicos de la base de datos
export async function getExistingMuscleGroups(): Promise<MuscleGroupDB[]> {
  try {
    const response = await apiFetch('/api/muscle-groups');
    if (!response.ok) return [];
    
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching muscle groups:', error);
    return [];
  }
}

