import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export function useSubcategories(categoryId?: string) {
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) {
      setSubcategories([]);
      setLoading(false);
      return;
    }
    async function fetchSubcategories() {
      setLoading(true);
      const { data, error } = await supabase
        .from("master_subcategory")
        .select("id, name, category_id")
        .eq("category_id", categoryId);
      if (!error && data) setSubcategories(data);
      setLoading(false);
    }
    fetchSubcategories();
  }, [categoryId]);

  return { subcategories, loading };
}
