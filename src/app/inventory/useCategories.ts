import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export function useCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      setLoading(true);
      const { data, error } = await supabase.from("master_category").select("id, name");
      if (!error && data) setCategories(data);
      setLoading(false);
    }
    fetchCategories();
  }, []);

  return { categories, loading };
}
