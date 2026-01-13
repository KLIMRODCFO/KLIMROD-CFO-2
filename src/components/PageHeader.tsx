import { useActiveBU } from "../app/ActiveBUContext";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function PageHeader({ title, hideBU = false }: { title: string, hideBU?: boolean }) {
  const { activeBU } = useActiveBU();
  const [buName, setBuName] = useState("");

  useEffect(() => {
    if (!activeBU) return setBuName("");
    supabase
      .from("master_business_units")
      .select("name")
      .eq("id", activeBU)
      .single()
      .then(({ data }) => setBuName(data?.name || ""));
  }, [activeBU]);

  return (
    <div className="mb-8 mt-4 w-full max-w-7xl">
      <h1 className="text-3xl font-bold mb-2 text-left w-full max-w-7xl uppercase">{title}</h1>
      {!hideBU && (
        <div className="font-bold text-center bg-gray-100 text-black tracking-widest uppercase text-xs w-full max-w-7xl mb-6">
          {buName}
        </div>
      )}
    </div>
  );
}
