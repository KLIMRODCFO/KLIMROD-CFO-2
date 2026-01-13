"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface BusinessUnit {
  id: string;
  name: string;
  city: string;
  active: boolean;
  editing?: boolean;
  editName?: string;
  editCity?: string;
}

export default function BusinessUnitsDirectory() {
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchBusinessUnits = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("master_business_units")
      .select("id, name, city, active"); // Mostrar todos, sin filtro
    if (error) {
      setError("Error loading business units: " + error.message);
      setBusinessUnits([]);
    } else {
      setBusinessUnits(
        (data || []).map((bu: any) => ({
          ...bu,
          editing: false,
          editName: bu.name,
          editCity: bu.city
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
    if (!newName.trim() || !newCity.trim()) {
      setCreateError("NAME AND CITY ARE REQUIRED");
      setCreating(false);
      return;
    }
    const { error } = await supabase
      .from("master_business_units")
      .insert([{ name: newName.trim().toUpperCase(), city: newCity.trim().toUpperCase(), active: true }]);
    if (error) {
      setCreateError("Error creating business unit: " + error.message);
    } else {
      setNewName("");
      setNewCity("");
      fetchBusinessUnits();
    }
    setCreating(false);
  };

  return (
    <div className="bg-white shadow rounded p-6">
      <h1 className="text-2xl font-bold mb-4">BUSINESS UNITS DIRECTORY</h1>
      <form onSubmit={handleCreate} className="flex gap-4 mb-6 flex-wrap items-end">
        <div>
          <label className="block text-sm font-medium mb-1">NAME</label>
          <input
            className="border rounded px-3 py-2 uppercase"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="BUSINESS UNIT NAME"
            disabled={creating}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">CITY</label>
          <input
            className="border rounded px-3 py-2 uppercase"
            value={newCity}
            onChange={e => setNewCity(e.target.value)}
            placeholder="CITY"
            disabled={creating}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={creating}
        >
          CREATE BUSINESS UNIT
        </button>
      </form>
      {createError && <div className="text-red-600 mb-4">{createError}</div>}
      {loading ? (
        <div>LOADING...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">NAME</th>
              <th className="px-4 py-2 text-left">CITY</th>
              <th className="px-4 py-2 text-left">ACTIONS</th>
              <th className="px-4 py-2 text-left">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {businessUnits.map((bu) => (
              <tr key={bu.id}>
                <td className="px-4 py-2 font-semibold">
                  {bu.editing ? (
                    <input
                      className="border rounded px-2 py-1 w-full uppercase"
                      value={bu.editName}
                      onChange={e => setBusinessUnits(units => units.map(unit => unit.id === bu.id ? { ...unit, editName: e.target.value } : unit))}
                    />
                  ) : (
                    bu.name
                  )}
                </td>
                <td className="px-4 py-2">
                  {bu.editing ? (
                    <input
                      className="border rounded px-2 py-1 w-full uppercase"
                      value={bu.editCity}
                      onChange={e => setBusinessUnits(units => units.map(unit => unit.id === bu.id ? { ...unit, editCity: e.target.value } : unit))}
                    />
                  ) : (
                    bu.city
                  )}
                </td>
                <td className="px-4 py-2 flex gap-2">
                  {bu.editing ? (
                    <>
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs"
                        onClick={async () => {
                          await supabase
                            .from("master_business_units")
                            .update({
                              name: bu.editName.toUpperCase(),
                              city: bu.editCity.toUpperCase()
                            })
                            .eq("id", bu.id);
                          setBusinessUnits(units => units.map(unit => unit.id === bu.id ? { ...unit, editing: false } : unit));
                          fetchBusinessUnits();
                        }}
                      >
                        SAVE
                      </button>
                      <button
                        className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 text-xs"
                        onClick={() => setBusinessUnits(units => units.map(unit => unit.id === bu.id ? { ...unit, editing: false } : unit))}
                      >
                        CANCEL
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-xs"
                        onClick={() => setBusinessUnits(units => units.map(unit => unit.id === bu.id ? { ...unit, editing: true, editName: bu.name, editCity: bu.city } : unit))}
                      >
                        EDIT
                      </button>
                      {bu.active === false || bu.active === 'false' ? (
                        <button
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs"
                          onClick={async () => {
                            await supabase
                              .from("master_business_units")
                              .update({ active: true })
                              .eq("id", bu.id);
                            fetchBusinessUnits();
                          }}
                        >
                          ACTIVATE
                        </button>
                      ) : (
                        <button
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-xs"
                          onClick={async () => {
                            await supabase
                              .from("master_business_units")
                              .update({ active: false })
                              .eq("id", bu.id);
                            fetchBusinessUnits();
                          }}
                        >
                          DEACTIVATE
                        </button>
                      )}
                    </>
                  )}
                </td>
                <td className="px-4 py-2">
                  {bu.active === true || bu.active === 'true' ? (
                    <span className="text-green-600 font-semibold">ACTIVE</span>
                  ) : (
                    <span className="text-gray-400">INACTIVE</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
