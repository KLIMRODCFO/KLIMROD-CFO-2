import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

interface Allergy {
  id: number;
  name: string;
  description: string;
}

export function useMenuAllergies() {
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  useEffect(() => {
    supabase.from('master_menu_allergies').select('id, name, description').then(({ data }) => {
      setAllergies(data || []);
    });
  }, []);
  return allergies;
}
