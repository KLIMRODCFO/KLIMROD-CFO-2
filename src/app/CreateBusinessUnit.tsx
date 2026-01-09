"use client";
import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const CreateBusinessUnit: React.FC = () => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!name.trim()) {
      setError("Business unit name required");
      return;
    }
    // 1. Crear la unidad de negocio
    const { data: buData, error: buError } = await supabase
      .from("master_business_units")
      .insert([
        { name: name.toUpperCase() }
      ])
      .select()
      .single();
    if (buError) {
      setError(buError.message);
      return;
    }
    const businessUnitId = buData?.id;
    if (!businessUnitId) {
      setError("No se pudo crear la unidad de negocio.");
      return;
    }
    // 2. Asignar la nueva unidad a todos los SUPER ADMIN
    const { data: superAdmins } = await supabase
      .from("master_user_roles")
      .select("user_id, role_id, master_roles(name)")
      .eq("master_roles.name", "SUPER ADMIN");
    if (superAdmins && superAdmins.length > 0) {
      for (const admin of superAdmins) {
        await supabase.from("master_user_business_units").insert([
          {
            user_id: admin.user_id,
            business_unit_id: businessUnitId,
          },
        ]);
      }
    }
    setSuccess("Business unit created and assigned to all SUPER ADMINs.");
    setName("");
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Create Business Unit</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Business Unit Name"
          value={name}
          onChange={e => setName(e.target.value.toUpperCase())}
          className="w-full p-2 mb-4 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded font-bold"
        >
          Create
        </button>
        {error && <div className="text-red-600 mt-4">{error}</div>}
        {success && <div className="text-green-600 mt-4">{success}</div>}
      </form>
    </div>
  );
};

export default CreateBusinessUnit;
