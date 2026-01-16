"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface BusinessUnit {
  id: string;
  name: string;
  city: string;
  active: boolean;
  week1_start_date?: string | null;
  editing?: boolean;
  editName?: string;
  editCity?: string;
  editWeek1StartDate?: string | null;
}

export default function BusinessUnitsDirectory() {
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newWeek1StartDate, setNewWeek1StartDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchBusinessUnits = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("master_business_units")
      .select("id, name, city, active, week1_start_date");
    if (error) {
      setError("Error loading business units: " + error.message);
      setBusinessUnits([]);
    } else {
      setBusinessUnits(
        (data || []).map((bu: any) => ({
          ...bu,
          editing: false,
          editName: bu.name,
          editCity: bu.city,
          week1_start_date: bu.week1_start_date,
          editWeek1StartDate: bu.week1_start_date || ""
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBusinessUnits();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    if (!newName.trim() || !newCity.trim() || !newWeek1StartDate) {
      setCreateError("NAME, CITY AND WEEK 1 START DATE ARE REQUIRED");
      setCreating(false);
      return;
    }
    const { error } = await supabase
      .from("master_business_units")
      .insert([{ name: newName.trim().toUpperCase(), city: newCity.trim().toUpperCase(), week1_start_date: newWeek1StartDate, active: true }]);
    if (error) {
      setCreateError("Error creating business unit: " + error.message);
    } else {
      setNewName("");
      setNewCity("");
      setNewWeek1StartDate("");
      fetchBusinessUnits();
    }
    setCreating(false);
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center py-8">
      <div className="w-full max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-center tracking-wide">BUSINESS UNITS DIRECTORY</h1>
        <form onSubmit={handleCreate} className="flex gap-4 mb-8 flex-wrap items-end justify-center">
          <div>
            <label className="block text-xs font-semibold mb-1 tracking-widest uppercase">NAME</label>
            <input
              className="border border-black rounded px-3 py-2 uppercase font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="BUSINESS UNIT NAME"
              disabled={creating}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 tracking-widest uppercase">CITY</label>
            <input
              className="border border-black rounded px-3 py-2 uppercase font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black"
              value={newCity}
              onChange={e => setNewCity(e.target.value)}
              placeholder="CITY"
              disabled={creating}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 tracking-widest uppercase">START DATE <span className='text-xs text-gray-500'>(MONDAY, REQUIRED)</span></label>
            <input
              type="date"
              className="border border-black rounded px-3 py-2 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black"
              value={newWeek1StartDate}
              onChange={e => setNewWeek1StartDate(e.target.value)}
              disabled={creating}
              required
            />
          </div>
          <button
            type="submit"
            className="bg-black text-white px-6 py-2 rounded-full font-bold tracking-widest hover:bg-gray-800 disabled:opacity-50 mt-6"
            disabled={creating}
          >
            CREATE BUSINESS UNIT
          </button>
        </form>
        {createError && <div className="text-red-600 mb-4 text-center font-semibold">{createError}</div>}
        <div className="overflow-x-auto rounded-2xl shadow-lg">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-black text-white rounded-t-2xl">
                <th className="px-4 py-3 text-center rounded-tl-2xl font-bold tracking-widest uppercase">NAME</th>
                <th className="px-4 py-3 text-center font-bold tracking-widest uppercase">CITY</th>
                <th className="px-4 py-3 text-center font-bold tracking-widest uppercase">START DATE</th>
                <th className="px-4 py-3 text-center font-bold tracking-widest uppercase">STATUS</th>
                <th className="px-4 py-3 text-center rounded-tr-2xl font-bold tracking-widest uppercase">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 font-bold">LOADING...</td></tr>
              ) : error ? (
                <tr><td colSpan={5} className="text-center py-8 text-red-600 font-bold">{error}</td></tr>
              ) : businessUnits.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 font-bold">NO BUSINESS UNITS FOUND</td></tr>
              ) : (
                businessUnits.map((bu) => (
                  <tr key={bu.id} className="border-b border-gray-200 hover:bg-gray-50 transition-all">
                    <td className="px-4 py-3 font-bold uppercase align-middle text-center">{bu.editing ? (
                      <input
                        className="border border-black rounded px-2 py-1 w-full uppercase font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black text-center"
                        value={bu.editName}
                        onChange={e => setBusinessUnits(units => units.map(unit => unit.id === bu.id ? { ...unit, editName: e.target.value } : unit))}
                      />
                    ) : bu.name}</td>
                    <td className="px-4 py-3 font-bold uppercase align-middle text-center">{bu.editing ? (
                      <input
                        className="border border-black rounded px-2 py-1 w-full uppercase font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black text-center"
                        value={bu.editCity}
                        onChange={e => setBusinessUnits(units => units.map(unit => unit.id === bu.id ? { ...unit, editCity: e.target.value } : unit))}
                      />
                    ) : bu.city}</td>
                    <td className="px-4 py-3 font-bold align-middle text-center">{bu.editing ? (
                      <input
                        type="date"
                        className="border border-black rounded px-2 py-1 w-full font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black text-center"
                        value={bu.editWeek1StartDate || ""}
                        onChange={e => setBusinessUnits(units => units.map(unit => unit.id === bu.id ? { ...unit, editWeek1StartDate: e.target.value } : unit))}
                      />
                    ) : (bu.week1_start_date ? (() => { const [y, m, d] = bu.week1_start_date.split('-'); return `${m}/${d}/${y}`; })() : "")}</td>
                    <td className="px-4 py-3 align-middle text-center">
                      {bu.active === true ? (
                        <span className="bg-black text-white px-4 py-1 rounded-full font-bold text-xs tracking-widest">ACTIVE</span>
                      ) : (
                        <span className="bg-gray-300 text-gray-700 px-4 py-1 rounded-full font-bold text-xs tracking-widest">INACTIVE</span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex gap-2 align-middle justify-center">
                      {bu.editing ? (
                        <>
                          <button
                            className="bg-green-600 text-white px-4 py-1 rounded-full font-bold text-xs tracking-widest hover:bg-green-700"
                            onClick={async () => {
                              await supabase
                                .from("master_business_units")
                                .update({
                                  name: (bu.editName ?? '').toUpperCase(),
                                  city: (bu.editCity ?? '').toUpperCase(),
                                  week1_start_date: bu.editWeek1StartDate || null
                                })
                                .eq("id", bu.id);
                              setBusinessUnits(units => units.map(unit => unit.id === bu.id ? { ...unit, editing: false } : unit));
                              fetchBusinessUnits();
                            }}
                          >SAVE</button>
                          <button
                            className="bg-gray-400 text-white px-4 py-1 rounded-full font-bold text-xs tracking-widest hover:bg-gray-500"
                            onClick={() => setBusinessUnits(units => units.map(unit => unit.id === bu.id ? { ...unit, editing: false } : unit))}
                          >CANCEL</button>
                        </>
                      ) : (
                        <>
                          <button
                            className="border border-black text-black px-4 py-1 rounded-full font-bold text-xs tracking-widest hover:bg-black hover:text-white transition-colors"
                            onClick={() => setBusinessUnits(units => units.map(unit => unit.id === bu.id ? { ...unit, editing: true, editName: bu.name, editCity: bu.city, editWeek1StartDate: bu.week1_start_date } : unit))}
                          >EDIT</button>
                          {bu.active === false ? (
                            <button
                              className="border border-green-600 text-green-600 px-4 py-1 rounded-full font-bold text-xs tracking-widest hover:bg-green-600 hover:text-white transition-colors"
                              onClick={async () => {
                                await supabase
                                  .from("master_business_units")
                                  .update({ active: true })
                                  .eq("id", bu.id);
                                fetchBusinessUnits();
                              }}
                            >ACTIVATE</button>
                          ) : (
                            <button
                              className="border border-red-600 text-red-600 px-4 py-1 rounded-full font-bold text-xs tracking-widest hover:bg-red-600 hover:text-white transition-colors"
                              onClick={async () => {
                                await supabase
                                  .from("master_business_units")
                                  .update({ active: false })
                                  .eq("id", bu.id);
                                fetchBusinessUnits();
                              }}
                            >DEACTIVATE</button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
