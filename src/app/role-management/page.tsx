
"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function RoleManagementPage() {
  type Role = { id: any; name: any };
  type Module = { id: any; name: any };
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Record<string, any>>>({});
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  // Estado y lógica para modal de nuevo rol
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleModules, setNewRoleModules] = useState<string[]>([]);
  const [addRoleError, setAddRoleError] = useState("");
  const [addingRole, setAddingRole] = useState(false);

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
      const permsObj: Record<string, Record<string, any>> = {};
      permsData?.forEach((p) => {
        if (!permsObj[p.role_id]) permsObj[p.role_id] = {};
        permsObj[p.role_id][p.module_id] = p.access;
      });
      setPermissions(permsObj);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleToggle = (roleId: string, moduleId: string) => {
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
    const permsArr: any[] = [];
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

  const handleAddRole = async () => {
    setAddRoleError("");
    if (!newRoleName.trim()) {
      setAddRoleError("Role name required");
      return;
    }
    setAddingRole(true);
    // Insertar nuevo rol
    const { data: roleData, error: roleError } = await supabase.from("master_roles").insert({ name: newRoleName }).select();
    if (roleError || !roleData || !roleData[0]) {
      setAddRoleError(roleError?.message || "Error creating role");
      setAddingRole(false);
      return;
    }
    const newRoleId = roleData[0].id;
    // Insertar módulos asignados
    if (newRoleModules.length > 0) {
      const permsArr = newRoleModules.map(moduleId => ({ role_id: newRoleId, module_id: moduleId, access: true, assigned_at: new Date().toISOString() }));
      const { error: modError } = await supabase.from("master_role_modules").upsert(permsArr, { onConflict: ["role_id", "module_id"] });
      if (modError) {
        setAddRoleError(modError.message);
        setAddingRole(false);
        return;
      }
    }
    setShowAddRole(false);
    setNewRoleName("");
    setNewRoleModules([]);
    setAddingRole(false);
    // Refrescar roles y módulos
    const { data: rolesData } = await supabase.from("master_roles").select("id, name");
    setRoles(rolesData || []);
    const { data: permsData } = await supabase.from("master_role_modules").select("role_id, module_id, access");
    const permsObj: Record<string, Record<string, any>> = {};
    permsData?.forEach((p) => {
      if (!permsObj[p.role_id]) permsObj[p.role_id] = {};
      permsObj[p.role_id][p.module_id] = p.access;
    });
    setPermissions(permsObj);
  };

  if (loading)
    return <div className="text-center mt-20">Loading...</div>;

  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-base font-bold text-center">Role Management</h1>
        <button
          className="bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold"
          onClick={() => setShowAddRole(true)}
        >
          Add New Role
        </button>
      </div>
      {/* Modal para agregar nuevo rol */}
      {showAddRole && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[320px] max-w-xs">
            <h2 className="text-lg font-bold mb-3">Add New Role</h2>
            <input
              className="border rounded w-full px-2 py-1 mb-3"
              placeholder="Role name"
              value={newRoleName}
              onChange={e => setNewRoleName(e.target.value)}
              disabled={addingRole}
            />
            <div className="mb-3">
              <div className="font-semibold mb-1">Assign Modules:</div>
              <div className="flex flex-wrap gap-2">
                {modules.map(mod => (
                  <label key={mod.id} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={newRoleModules.includes(mod.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setNewRoleModules(prev => [...prev, mod.id]);
                        } else {
                          setNewRoleModules(prev => prev.filter(id => id !== mod.id));
                        }
                      }}
                      disabled={addingRole}
                    />
                    <span>{mod.name}</span>
                  </label>
                ))}
              </div>
            </div>
            {addRoleError && <div className="text-red-600 text-xs mb-2">{addRoleError}</div>}
            <div className="flex gap-2 justify-end mt-2">
              <button
                className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs"
                onClick={() => { setShowAddRole(false); setNewRoleName(""); setNewRoleModules([]); setAddRoleError(""); }}
                disabled={addingRole}
              >Cancel</button>
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold"
                onClick={handleAddRole}
                disabled={addingRole}
              >Save</button>
            </div>
          </div>
        </div>
      )}
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
