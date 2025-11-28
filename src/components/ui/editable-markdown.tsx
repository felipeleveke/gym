import React, { useState, useEffect } from 'react';
import { MarkdownNotes } from './markdown-notes';
import { Textarea } from './textarea';
import { Button } from './button';
import { Edit2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableMarkdownProps {
  content: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  isGenerating?: boolean;
  rows?: number;
}

export function EditableMarkdown({
  content,
  onChange,
  placeholder = 'Escribe tus notas...',
  disabled = false,
  className,
  label,
  isGenerating = false,
  rows = 3,
}: EditableMarkdownProps) {
  const hasContent = content && content.trim().length > 0;
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(content);
  const [wasGenerating, setWasGenerating] = useState(isGenerating);

  // Sincronizar tempValue cuando content cambia externamente
  useEffect(() => {
    setTempValue(content);
  }, [content]);

  // Detectar cuando termina de generar - cambiar automáticamente a modo vista
  useEffect(() => {
    if (wasGenerating && !isGenerating && hasContent) {
      // Si estaba generando y ahora terminó con contenido, cambiar a modo vista
      setIsEditing(false);
    }
    setWasGenerating(isGenerating);
  }, [isGenerating, hasContent, wasGenerating]);

  const handleEdit = () => {
    setTempValue(content);
    setIsEditing(true);
  };

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(content);
    setIsEditing(false);
  };

  // Si no hay contenido o está generando, siempre mostrar modo edición
  if (!hasContent || isGenerating) {
    return (
      <Textarea
        placeholder={isGenerating ? "Generando resumen automático..." : placeholder}
        value={content || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || isGenerating}
        className={cn("text-sm", isGenerating && "opacity-70", className)}
        rows={rows}
      />
    );
  }

  // Si hay contenido pero el usuario no está editando, mostrar vista formateada
  if (!isEditing) {
    return (
      <div className="relative group">
        <div className="p-3 bg-muted/30 rounded-md border border-border min-h-[60px]">
          <MarkdownNotes content={content} />
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleEdit}
          disabled={disabled}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Edit2 className="h-3 w-3 mr-1" />
          Editar
        </Button>
      </div>
    );
  }

  // Modo edición (solo cuando el usuario hace clic en "Editar")
  return (
    <div className="space-y-2">
      <Textarea
        placeholder={placeholder}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        disabled={disabled}
        className={cn("text-sm", className)}
        rows={rows}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="default"
          onClick={handleSave}
          disabled={disabled}
        >
          <Check className="h-3 w-3 mr-1" />
          Guardar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCancel}
          disabled={disabled}
        >
          <X className="h-3 w-3 mr-1" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}

