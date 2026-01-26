import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export function useMenuAllergies() {
  const [allergies, setAllergies] = useState([]);
  useEffect(() => {
    supabase.from('master_menu_allergies').select('id, name, description').then(({ data }) => {
      setAllergies(data || []);
    });
  }, []);
  return allergies;
}
