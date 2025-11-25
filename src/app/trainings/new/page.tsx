'use client';

import { useState } from 'react';
import { TrainingTypeSelector } from '@/components/trainings/training-type-selector';
import { GymTrainingFormDetailed } from '@/components/trainings/gym-training-form-detailed';
import { SportTrainingForm } from '@/components/trainings/sport-training-form';
import { CardioTrainingForm } from '@/components/trainings/cardio-training-form';
import { FlexibilityTrainingForm } from '@/components/trainings/flexibility-training-form';
import { OtherTrainingForm } from '@/components/trainings/other-training-form';

type TrainingType = 'gym' | 'sport' | 'cardio' | 'flexibility' | 'other' | null;

export default function NewTrainingPage() {
  const [selectedType, setSelectedType] = useState<TrainingType>(null);

  const handleTypeSelect = (type: TrainingType) => {
    setSelectedType(type);
  };

  const handleBack = () => {
    setSelectedType(null);
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">Nuevo Entrenamiento</h1>
      <div className="space-y-4">
        {!selectedType ? (
          <TrainingTypeSelector onSelect={handleTypeSelect} />
        ) : selectedType === 'gym' ? (
          <GymTrainingFormDetailed onBack={handleBack} />
        ) : selectedType === 'sport' ? (
          <SportTrainingForm onBack={handleBack} />
        ) : selectedType === 'cardio' ? (
          <CardioTrainingForm onBack={handleBack} />
        ) : selectedType === 'flexibility' ? (
          <FlexibilityTrainingForm onBack={handleBack} />
        ) : (
          <OtherTrainingForm onBack={handleBack} />
        )}
      </div>
    </div>
  );
}

