'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

interface UseUnsavedChangesOptions {
  hasUnsavedChanges: boolean;
  onConfirmLeave?: () => void;
  message?: string;
}

export function useUnsavedChanges({
  hasUnsavedChanges,
  onConfirmLeave,
  message = '¿Estás seguro de que quieres salir? Tienes cambios sin guardar que se perderán.',
}: UseUnsavedChangesOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const [showDialog, setShowDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const isNavigatingRef = useRef(false);

  // Interceptar navegación del router
  const handleNavigation = useCallback((url: string) => {
    if (hasUnsavedChanges && !isNavigatingRef.current) {
      setPendingNavigation(url);
      setShowDialog(true);
      return false;
    }
    return true;
  }, [hasUnsavedChanges]);

  // Confirmar salida
  const confirmLeave = useCallback(() => {
    isNavigatingRef.current = true;
    setShowDialog(false);
    
    if (onConfirmLeave) {
      onConfirmLeave();
    }
    
    if (pendingNavigation) {
      router.push(pendingNavigation);
      setPendingNavigation(null);
    } else {
      router.back();
    }
    
    // Reset después de un breve delay
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 100);
  }, [pendingNavigation, router, onConfirmLeave]);

  // Cancelar salida
  const cancelLeave = useCallback(() => {
    setShowDialog(false);
    setPendingNavigation(null);
  }, []);

  // Removido el listener de beforeunload para evitar el mensaje del navegador
  // Solo usamos nuestro diálogo custom que es más elegante

  // Interceptar clicks en links del sidebar y otros elementos
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href) {
        const url = new URL(link.href);
        const currentPath = window.location.pathname;
        
        // Solo interceptar si es navegación interna y diferente a la página actual
        if (url.origin === window.location.origin && url.pathname !== currentPath) {
          e.preventDefault();
          handleNavigation(url.pathname);
        }
      }
    };

    document.addEventListener('click', handleLinkClick, true);
    return () => {
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, [hasUnsavedChanges, handleNavigation]);

  return {
    showDialog,
    pendingNavigation,
    confirmLeave,
    cancelLeave,
    handleNavigation,
  };
}




