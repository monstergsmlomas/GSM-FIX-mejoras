import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Branch } from '@shared/schema';

export function useBranch() {
  // Intentamos leer la sucursal guardada del localStorage
  const [activeBranchId, setBranchIdState] = useState<string | null>(() => {
    return localStorage.getItem('activeBranchId');
  });

  // Traemos todas las sucursales del usuario (si es admin)
  const { data: branches = [], isLoading } = useQuery<Branch[]>({
    queryKey: ['/api/branches'],
    refetchOnWindowFocus: false, // No refetchear a cada rato para no saturar
  });

  // Lógica inteligente: Si no hay sucursal elegida, pero me traen la lista de la base de datos...
  // ...elegimos automáticamente la que esté marcada como "isDefault", o la primera de la lista.
  useEffect(() => {
    if (!activeBranchId && branches.length > 0) {
      const defaultBranch = branches.find(b => b.isDefault) || branches[0];
      if (defaultBranch) {
        setBranchIdState(defaultBranch.id);
        localStorage.setItem('activeBranchId', defaultBranch.id);
        // Despachamos un evento para que el QueryClient se entere del cambio al instante
        window.dispatchEvent(new Event('branchChanged')); 
      }
    }
  }, [branches, activeBranchId]);

  // Función para que el usuario cambie de sucursal a mano
  const setActiveBranch = (id: string) => {
    setBranchIdState(id);
    localStorage.setItem('activeBranchId', id);
    // Le avisamos a toda la app que cambió la sucursal
    window.dispatchEvent(new Event('branchChanged'));
  };

  return {
    branches,
    activeBranchId,
    activeBranch: branches.find(b => b.id === activeBranchId),
    setActiveBranch,
    isLoading
  };
}