"use client";
"use client";
import React, { useEffect, useState } from 'react';
import CreateUser from '../CreateUser';
import { supabase } from '../../../lib/supabaseClient';


interface UserWithDetails {
  id: any;
  email: any;
  rolesArr: any[];
  businessUnits: any[];
  modules: any[];
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [roles, setRoles] = useState<{ id: any; name: any }[]>([]);
  const [businessUnits, setBusinessUnits] = useState<{ id: any; name: any }[]>([]);
  const [editing, setEditing] = useState<Record<string, any>>({});
  const [modules, setModules] = useState<{ id: any; name: any }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState("");
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch users
      const { data: usersData } = await supabase.from('master_users').select('id, email');
      // Fetch roles
      const { data: rolesData } = await supabase.from('master_roles').select('id, name');
      // Fetch business units
      const { data: buData } = await supabase.from('master_business_units').select('id, name');
      // Fetch modules
      const { data: modulesData } = await supabase.from('master_modules').select('id, name');
      // Fetch user roles, business units, and extra modules
      const { data: userRoles } = await supabase.from('master_user_roles').select('user_id, role_id');
      const { data: userBUs } = await supabase.from('master_user_business_units').select('user_id, business_unit_id');
      const { data: userModules } = await supabase.from('master_user_modules').select('user_id, module_id');

      // Merge data for table
      const usersWithDetails = (usersData || []).map(u => {
        // Permitir hasta 4 roles por usuario
        const userRolesList = userRoles?.filter(r => r.user_id === u.id).map(r => r.role_id) || [];
        // Rellenar hasta 4 posiciones
        const rolesArr = [0, 1, 2, 3].map(i => userRolesList[i] || '');
        const buList = userBUs?.filter(bu => bu.user_id === u.id).map(bu => bu.business_unit_id) || [];
        const moduleList = userModules?.filter(m => m.user_id === u.id).map(m => m.module_id) || [];
        return { ...u, rolesArr, businessUnits: buList, modules: moduleList };
      });
      setUsers(usersWithDetails);
      setRoles(rolesData || []);
      setBusinessUnits(buData || []);
      setModules(modulesData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleEdit = (userId: string, field: string, value: any) => {
    setEditing(prev => ({ ...prev, [userId]: { ...prev[userId], [field]: value } }));
  };

  const handleSave = async (user: UserWithDetails) => {
    const changes = editing[user.id];
    if (!changes) return;
    // Update roles (hasta 4)
    if (changes.rolesArr) {
      // Eliminar todos los roles actuales
      await supabase.from('master_user_roles').delete().eq('user_id', user.id);
      // Insertar los nuevos roles (ignorando vacíos)
      for (const roleId of changes.rolesArr) {
        if (roleId && roleId !== '') {
          await supabase.from('master_user_roles').insert({ user_id: user.id, role_id: roleId });
        }
      }
    }
    // Update business units
    if (changes.businessUnits) {
      await supabase.from('master_user_business_units').delete().eq('user_id', user.id);
      for (const buId of changes.businessUnits) {
        await supabase.from('master_user_business_units').insert({ user_id: user.id, business_unit_id: buId });
      }
    }
    // Update extra modules
    if (changes.modules) {
      await supabase.from('master_user_modules').delete().eq('user_id', user.id);
      for (const moduleId of changes.modules) {
        await supabase.from('master_user_modules').insert({ user_id: user.id, module_id: moduleId });
      }
    }
    setEditing(prev => { const cp = { ...prev }; delete cp[user.id]; return cp; });
    // Refresh data
    const { data: userRoles } = await supabase.from('master_user_roles').select('user_id, role_id');
    const { data: userBUs } = await supabase.from('master_user_business_units').select('user_id, business_unit_id');
    const { data: userModules } = await supabase.from('master_user_modules').select('user_id, module_id');
    setUsers(users.map(u => {
      if (u.id !== user.id) return u;
      // Permitir hasta 4 roles por usuario
      const userRolesList = userRoles?.filter(r => r.user_id === u.id).map(r => r.role_id) || [];
      const rolesArr = [0, 1, 2, 3].map(i => userRolesList[i] || '');
      const buList = userBUs?.filter(bu => bu.user_id === u.id).map(bu => bu.business_unit_id) || [];
      const moduleList = userModules?.filter(m => m.user_id === u.id).map(m => m.module_id) || [];
      return { ...u, rolesArr, businessUnits: buList, modules: moduleList };
    }));
    setSaveMsg("Save Successfully");
    setTimeout(() => setSaveMsg(""), 2000);
  };

  const handleDelete = async (userId: string) => {
    setDeleting(true);
    // Delete from Supabase Auth
    await fetch('/api/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    // Delete from user tables
    await supabase.from('master_user_roles').delete().eq('user_id', userId);
    await supabase.from('master_user_business_units').delete().eq('user_id', userId);
    await supabase.from('master_users').delete().eq('id', userId);
    setUsers(users.filter(u => u.id !== userId));
    setDeleting(false);
    setDeleteUserId(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      <CreateUser />
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Edit Users</h2>
        {saveMsg && <div className="mb-4 text-green-600 font-bold">{saveMsg}</div>}
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded shadow">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Email</th>
                  <th className="py-2 px-4 border-b">Primary Role</th>
                  <th className="py-2 px-4 border-b">Business Units</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="py-2 px-4 border-b">{user.email}</td>
                    <td className="py-2 px-4 border-b">
                      <select
                        className="border rounded px-2 py-1"
                        value={editing[user.id]?.rolesArr?.[0] ?? user.rolesArr[0]}
                        onChange={e => {
                          const prev = editing[user.id]?.rolesArr ?? user.rolesArr;
                          const next = [...prev];
                          next[0] = e.target.value;
                          handleEdit(user.id, 'rolesArr', next);
                        }}
                      >
                        <option value="">Select role</option>
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <div className="flex flex-wrap gap-2">
                        {businessUnits.map(bu => (
                          <label key={bu.id} className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={(editing[user.id]?.businessUnits ?? user.businessUnits).includes(bu.id)}
                              onChange={e => {
                                const prev = editing[user.id]?.businessUnits ?? user.businessUnits;
                                let next;
                                if (e.target.checked) {
                                  next = [...prev, bu.id];
                                } else {
                                  next = prev.filter((id: string) => id !== bu.id);
                                }
                                handleEdit(user.id, 'businessUnits', next);
                              }}
                            />
                            <span>{bu.name}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <button
                        className="bg-blue-500 text-white px-4 py-1 rounded mr-2"
                        onClick={() => handleSave(user)}
                        disabled={!editing[user.id]}
                      >Save</button>
                      <button
                        className="bg-gray-300 text-gray-700 px-4 py-1 rounded mr-2"
                        onClick={() => setEditing(prev => { const cp = { ...prev }; delete cp[user.id]; return cp; })}
                        disabled={!editing[user.id]}
                      >Cancel</button>
                      {user.email.toLowerCase() !== "juan@klimrodcfo.com" && (
                        <button
                          className="bg-red-500 text-white px-4 py-1 rounded"
                          onClick={() => setDeleteUserId(user.id)}
                          disabled={deleting}
                        >Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Delete confirmation modal */}
            {deleteUserId && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                <div className="bg-white p-8 rounded shadow-lg max-w-sm w-full">
                  <h3 className="text-lg font-bold mb-4">Are you sure you want to delete this user?</h3>
                  <div className="flex justify-end gap-4">
                    <button
                      className="bg-gray-300 text-gray-700 px-4 py-1 rounded"
                      onClick={() => setDeleteUserId(null)}
                      disabled={deleting}
                    >Cancel</button>
                    <button
                      className="bg-red-500 text-white px-4 py-1 rounded"
                      onClick={() => handleDelete(deleteUserId)}
                      disabled={deleting}
                    >Delete</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
