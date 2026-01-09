"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function RoleManagementPage() {
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: rolesData } = await supabase
        .from("master_roles")
        .select("id, name");
      const { data: modulesData } = await supabase
        .from("master_modules")
        .select("id, name");
      const { data: permsData } = await supabase
        .from("master_role_modules")
        .select("role_id, module_id, access");
      setRoles(rolesData || []);
      setModules(modulesData || []);
      // Construir objeto de permisos: { [roleId]: { [moduleId]: access } }
      const permsObj = {};
      permsData?.forEach((p) => {
        if (!permsObj[p.role_id]) permsObj[p.role_id] = {};
        permsObj[p.role_id][p.module_id] = p.access;
      });
      setPermissions(permsObj);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleToggle = (roleId, moduleId) => {
    const current = permissions[roleId]?.[moduleId] || false;
    setPermissions((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [moduleId]: !current,
      },
    }));
    setPending(true);
    setSaved(false);
  };

  const handleSave = async () => {
    setPending(false);
    setSaved(false);
    setError("");
    // Construir array de permisos para upsert
    const permsArr = [];
    Object.entries(permissions).forEach(([roleId, mods]) => {
      Object.entries(mods).forEach(([moduleId, access]) => {
        permsArr.push({
          role_id: roleId,
          module_id: moduleId,
          access,
          assigned_at: new Date().toISOString(),
        });
      });
    });
    const { error } = await supabase
      .from("master_role_modules")
      .upsert(permsArr, { onConflict: ["role_id", "module_id"] });
    if (error) {
      setError(error.message || "Error saving changes");
      setSaved(false);
    } else {
      setSaved(true);
    }
  };

  if (loading)
    return <div className="text-center mt-20">Loading...</div>;

  return (
    <div className="p-2">
      <h1 className="text-base font-bold mb-2 text-center">Role Management</h1>
      <div className="overflow-auto mb-2">
        <table className="w-full border border-gray-300 text-xs">
          <thead>
            <tr>
              <th className="border px-2 py-1 bg-gray-100">MODULE</th>
              {roles.map((role) => (
                <th
                  key={role.id}
                  className="border px-2 py-1 bg-gray-100"
                >
                  {role.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((module) => (
              <tr key={module.id}>
                <td className="border px-2 py-1 font-semibold">{module.name}</td>
                {roles.map((role) => (
                  <td key={role.id} className="border px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={permissions[role.id]?.[module.id] || false}
                      onChange={() => handleToggle(role.id, module.id)}
                      className="accent-blue-600 w-3 h-3"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col items-center gap-2">
        <button
          className="bg-blue-600 text-white px-4 py-1 rounded text-xs font-semibold disabled:opacity-50"
          onClick={handleSave}
          disabled={!pending}
        >
          Save Changes
        </button>
        {saved && <span className="text-green-600 text-xs">Changes saved!</span>}
        {error && <span className="text-red-600 text-xs">{error}</span>}
      </div>
    </div>
  );
}
