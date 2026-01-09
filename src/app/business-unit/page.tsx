"use client";
import React, { useEffect, useState } from "react";
import { useActiveBU } from "../ActiveBUContext";
import { supabase } from "../../../lib/supabaseClient";
import { useUser } from "../UserContext";

export default function BusinessUnitPage() {
  const { user } = useUser();
  type BU = { business_unit_id: string; business_unit_name: string };
  const [units, setUnits] = useState<BU[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeBU, setActiveBU } = useActiveBU();

  useEffect(() => {
    const fetchUnits = async () => {
      setLoading(true);
      let assignedUnits: any[] = [];
      if (user) {
        const cleanUserId = typeof user.id === 'string' ? user.id.split(":")[0] : user.id;
        const { data: userUnits } = await supabase
          .from("user_business_unit_view")
          .select("business_unit_id, business_unit_name")
          .eq("user_id", cleanUserId);
        assignedUnits = userUnits || [];
      }
      setUnits(assignedUnits);
      setLoading(false);
      // Set default active BU if none is set and there are units
      if (assignedUnits.length > 0 && !activeBU) {
        setActiveBU(assignedUnits[0].business_unit_id);
      }
    };
    fetchUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) return <div className="text-center mt-20">Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full">
      <h1 className="text-4xl font-extrabold tracking-wide mb-10 mt-8 text-center">BUSINESS UNIT</h1>
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-gray-200 p-0">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="py-3 px-6 text-left font-semibold tracking-wider">NAME</th>
              <th className="py-3 px-6 text-center font-semibold tracking-wider">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <tr
                key={unit.business_unit_id}
                className={`border-b border-gray-200 last:border-b-0 ${activeBU === unit.business_unit_id ? "bg-gray-100" : ""}`}
              >
                <td className="py-4 px-6 font-bold uppercase tracking-wide">{unit.business_unit_name}</td>
                <td className="py-4 px-6 text-center">
                  {activeBU === unit.business_unit_id ? (
                    <span className="inline-block px-6 py-2 rounded-full bg-black text-white font-bold tracking-wide text-sm cursor-default" style={{minWidth: 100}}>ACTIVE</span>
                  ) : (
                    <button
                      className="inline-block px-6 py-2 rounded-full border border-black text-black font-bold tracking-wide text-sm hover:bg-black hover:text-white transition-colors"
                      style={{minWidth: 100}}
                      onClick={() => setActiveBU(unit.business_unit_id)}
                    >
                      SET ACTIVE
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
