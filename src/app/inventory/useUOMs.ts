import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export function useUOMs() {
  const [uoms, setUOMs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUOMs() {
      setLoading(true);
      const { data, error } = await supabase.from("master_uom").select("id, name");
      if (!error && data) setUOMs(data);
      setLoading(false);
    }
    fetchUOMs();
  }, []);

  return { uoms, loading };
}
