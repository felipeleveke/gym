// Grupos musculares comunes predefinidos
export const COMMON_MUSCLE_GROUPS = [
  'pecho',
  'espalda',
  'hombros',
  'bíceps',
  'tríceps',
  'piernas',
  'glúteos',
  'cuádriceps',
  'isquiotibiales',
  'gemelos',
  'abdominales',
  'antebrazos',
  'trapecio',
  'deltoides',
  'pectorales',
  'dorsales',
  'lumbares',
  'cardio',
  'flexibilidad',
  'general',
] as const;

export type MuscleGroup = typeof COMMON_MUSCLE_GROUPS[number] | string;

// Función para obtener grupos musculares únicos de los ejercicios existentes
export async function getExistingMuscleGroups(): Promise<string[]> {
  try {
    const response = await fetch('/api/exercises');
    if (!response.ok) return [];
    
    const result = await response.json();
    const exercises = result.data || [];
    
    // Extraer todos los grupos musculares únicos
    const muscleGroupsSet = new Set<string>();
    exercises.forEach((exercise: { muscle_groups?: string[]; muscle_groups_json?: any[] }) => {
      // Priorizar muscle_groups_json (nueva estructura)
      if (exercise.muscle_groups_json && Array.isArray(exercise.muscle_groups_json)) {
        exercise.muscle_groups_json.forEach((mg: any) => {
          if (mg.name) {
            muscleGroupsSet.add(mg.name.toLowerCase());
          }
        });
      }
      // Fallback a muscle_groups (formato antiguo)
      else if (exercise.muscle_groups) {
        exercise.muscle_groups.forEach((mg) => muscleGroupsSet.add(mg.toLowerCase()));
      }
    });
    
    return Array.from(muscleGroupsSet).sort();
  } catch (error) {
    console.error('Error fetching muscle groups:', error);
    return [];
  }
}

