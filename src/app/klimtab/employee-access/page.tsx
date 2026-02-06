
"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";

// Tipos de datos
interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  business_unit_id: string;
  position_id: string;
  department_id: string;
}
interface Position { id: number; name: string; department_id: number; }
interface Department { id: number; name: string; }
interface BusinessUnit { id: string; name: string; }
interface App { id: string; app_name: string; }
interface Module { id: string; module_name: string; app_id: string; }
interface Submodule { id: number; submodule_name: string; module_id: number; }

interface AccessRecord {
  id: string;
  employee_id: string;
  app_id: string;
  module_id: string;
  submodule_id: string;
}

type EditState = {
  showPassword?: boolean;
  app: string;
  module: string;
  submodules: string[];
};

export default function EmployeeAccessPage() {
  // Modal state for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accessToDelete, setAccessToDelete] = useState<AccessRecord | null>(null);
  // Estados principales
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [submodules, setSubmodules] = useState<Submodule[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [accessRecords, setAccessRecords] = useState<Record<string, AccessRecord[]>>({});
  const [employeePasswords, setEmployeePasswords] = useState<Record<string, string>>({});
  const [accessEdits, setAccessEdits] = useState<Record<string, EditState>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedBU, setSelectedBU] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch inicial
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [
        { data: empData },
        { data: buData },
        { data: appData },
        { data: modData },
        { data: submodData },
        { data: deptData },
        { data: posData }
      ] = await Promise.all([
        supabase.from("master_employees_directory").select("id, first_name, last_name, email, business_unit_id, position_id, department_id"),
        supabase.from("master_business_units").select("id, name"),
        supabase.from("master_klimtab_apps").select("id, app_name"),
        supabase.from("master_klimtab_modules").select("id, module_name, app_id"),
        supabase.from("master_klimtab_submodules").select("id, module_id, submodule_name"),
        supabase.from("master_departments").select("id, name"),
        supabase.from("master_positions").select("id, name, department_id")
      ]);
      setEmployees(empData || []);
      setBusinessUnits(buData || []);
      setApps(appData || []);
      setModules(modData || []);
      setSubmodules(submodData || []);
      setDepartments(deptData || []);
      setPositions(posData || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Fetch accesos actuales por empleado
  const fetchAccessRecords = async () => {
    const { data } = await supabase.from("master_klimtab_employee_access").select("id, employee_id, app_id, module_id, submodule_id");
    const grouped: Record<string, AccessRecord[]> = {};
    (data || []).forEach((rec: AccessRecord) => {
      if (!grouped[rec.employee_id]) grouped[rec.employee_id] = [];
      grouped[rec.employee_id].push(rec);
    });
    setAccessRecords(grouped);
  };
  useEffect(() => { fetchAccessRecords(); }, []);

  // Fetch passwords from klimtab_employee_security
  useEffect(() => {
    const fetchPasswords = async () => {
      const { data } = await supabase.from("klimtab_employees_security").select("employee_id, password_hash");
      const pwMap: Record<string, string> = {};
      (data || []).forEach((row: any) => {
        pwMap[row.employee_id] = row.password_hash;
      });
      setEmployeePasswords(pwMap);
    };
    fetchPasswords();
  }, []);

  // Filtros
  const filteredEmployees = employees.filter(emp => {
    const buOk = !selectedBU || emp.business_unit_id === selectedBU;
    const nameOk = !search || (`${emp.first_name} ${emp.last_name}`.toLowerCase().includes(search.toLowerCase()));
    return buOk && nameOk;
  });

  // Helpers
  const getBUName = (id: string) => businessUnits.find(bu => bu.id === id)?.name || "-";
  const getDepartmentName = (id: string) => {
    const dep = departments.find(d => String(d.id) === String(id));
    return dep ? dep.name : id;
  };
  const getPositionName = (id: string) => {
    const pos = positions.find(p => String(p.id) === String(id));
    return pos ? pos.name : id;
  };
  const handleEditChange = (empId: string, field: keyof EditState, value: any) => {
    setAccessEdits(prev => ({ ...prev, [empId]: { ...prev[empId], [field]: value } }));
  };

  // Guardar accesos
  const handleSave = async (emp: Employee) => {
    const edit = accessEdits[emp.id];
    if (!edit || !edit.app) {
      alert("Debes seleccionar app");
      return;
    }
    // Obtener el usuario activo
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;
    // Eliminar accesos previos de ese empleado/app/module
    await supabase
      .from("master_klimtab_employee_access")
      .delete()
      .match({ employee_id: emp.id, app_id: edit.app, module_id: edit.module });
    // Filtrar submódulos válidos para el módulo seleccionado
    const validSubmodules = submodules.filter(s => String(s.module_id) === String(edit.module)).map(s => String(s.id));
    const filteredSubmodules = (edit.submodules || []).filter(subId => validSubmodules.includes(String(subId)));
    // Insertar nuevos accesos solo con submódulos válidos
    const rows = (filteredSubmodules.length > 0 ? filteredSubmodules : [null]).map(submoduleId => ({
      employee_id: emp.id,
      app_id: edit.app,
      module_id: edit.module,
      submodule_id: submoduleId,
      platform_id: 1,
      business_unit_id: emp.business_unit_id,
      created_by_user_id: userId
    }));
    const { error } = await supabase
      .from("master_klimtab_employee_access")
      .insert(rows);
    await fetchAccessRecords();
    if (!error) {
      setExpanded(null);
    } else {
      alert("Error guardando acceso: " + error.message);
    }
  };

  // UI
  return (
    <div className="bg-[#F5F5F7] min-h-screen w-full flex flex-col items-center py-10 font-sans">
      <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-sm w-[85vw] max-w-[1400px] p-8 flex flex-col gap-8">
        <div>
          <h1 className="font-bold tracking-tight text-2xl text-[#1D1D1F] mb-2">Employee Access</h1>
          <p className="text-neutral-500 text-base mb-4">Manage employee access to company units and modules.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-1 block">Business Unit</label>
            <select
              className="rounded-xl border-neutral-200 bg-white/50 focus:ring-4 focus:ring-[#0071E3]/10 focus:border-[#0071E3] px-4 py-2 w-full text-[#1D1D1F]"
              value={selectedBU}
              onChange={e => setSelectedBU(e.target.value)}
            >
              <option value="">Todas</option>
              {businessUnits.map(bu => (
                <option key={bu.id} value={bu.id}>{bu.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-1 block">Buscar empleado</label>
            <input
              type="text"
              className="rounded-xl border-neutral-200 bg-white/50 focus:ring-4 focus:ring-[#0071E3]/10 focus:border-[#0071E3] px-4 py-2 w-full text-[#1D1D1F]"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-sm w-full">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-xs uppercase tracking-wider font-bold text-neutral-500 px-4 py-2 text-left">BU NAME</th>
                <th className="text-xs uppercase tracking-wider font-bold text-neutral-500 px-4 py-2 text-left">EMPLOYEE</th>
                <th className="text-xs uppercase tracking-wider font-bold text-neutral-500 px-4 py-2 text-left">POSITION</th>
                <th className="text-xs uppercase tracking-wider font-bold text-neutral-500 px-4 py-2 text-left">DEPARTMENT</th>
                <th className="text-xs uppercase tracking-wider font-bold text-neutral-500 px-4 py-2 text-left">EMAIL</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => {
                const edit = accessEdits[emp.id] || { password: '', app: '', module: '', submodules: [] };
                return (
                  <React.Fragment key={emp.id}>
                    <tr className="text-[#1D1D1F] text-sm">
                      <td className="px-4 py-2">{getBUName(emp.business_unit_id)}</td>
                      <td className="px-4 py-2">{emp.first_name} {emp.last_name}</td>
                      <td className="px-4 py-2">{getPositionName(emp.position_id)}</td>
                      <td className="px-4 py-2">{getDepartmentName(emp.department_id)}</td>
                      <td className="px-4 py-2">{emp.email}</td>
                      <td className="px-4 py-2">
                        <button
                          className="rounded-xl px-4 py-1 font-bold text-white bg-blue-600 hover:bg-blue-700"
                          onClick={() => setExpanded(expanded === emp.id ? null : emp.id)}
                        >
                          Manage KLIMTAB Account
                        </button>
                      </td>
                    </tr>
                    {expanded === emp.id && (
                      <tr>
                        <td colSpan={6} className="bg-gray-50 px-8 py-6 border-t">
                          <div className="flex flex-col gap-4">
                            {/* Accesos actuales */}
                            <div>
                              <label className="block text-xs font-bold mb-2">Accesos actuales</label>
                              <table className="w-full text-xs mb-4">
                                <thead>
                                  <tr className="bg-gray-100">
                                    <th className="px-2 py-1 text-left">App</th>
                                    <th className="px-2 py-1 text-left">Module</th>
                                    <th className="px-2 py-1 text-left">Submodule</th>
                                    <th className="px-2 py-1 text-left">Acción</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(accessRecords[emp.id] || [])
                                    .filter(rec => {
                                      // Solo mostrar submódulos válidos para el módulo
                                      if (!rec.submodule_id) return true;
                                      const sub = submodules.find(s => String(s.id) === String(rec.submodule_id));
                                      return sub && String(sub.module_id) === String(rec.module_id);
                                    })
                                    .map(rec => {
                                      const app = apps.find(a => String(a.id) === String(rec.app_id));
                                      const module = modules.find(m => String(m.id) === String(rec.module_id));
                                      const submodule = submodules.find(s => String(s.id) === String(rec.submodule_id));
                                      return (
                                        <tr key={rec.app_id + '-' + rec.module_id + '-' + rec.submodule_id} className="border-b">
                                          <td className="px-2 py-1 text-left">{app?.app_name || rec.app_id}</td>
                                          <td className="px-2 py-1 text-left">{module?.module_name || rec.module_id}</td>
                                          <td className="px-2 py-1 text-left">{submodule?.submodule_name || ''}</td>
                                          <td className="px-2 py-1 text-left">
                                            <button
                                              className="text-xs px-2 py-1 border rounded bg-red-100 text-red-700 hover:bg-red-200"
                                              onClick={() => {
                                                setAccessToDelete(rec);
                                                setShowDeleteModal(true);
                                              }}
                                            >
                                              Delete
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                </tbody>
                              </table>
                            </div>
                            <div>
                              <label className="block text-xs font-bold mb-1">Password</label>
                              <div className="flex items-center gap-2 max-w-xs">
                                <input
                                  type={edit.showPassword ? "text" : "password"}
                                  className="rounded-xl border-neutral-200 bg-white/50 px-2 py-1 w-full"
                                  value={employeePasswords[emp.id] || ''}
                                  disabled
                                  placeholder="Password..."
                                />
                                <button
                                  type="button"
                                  className="text-xs px-2 py-1 border rounded bg-gray-100 hover:bg-gray-200"
                                  onClick={() => handleEditChange(emp.id, 'showPassword', !edit.showPassword)}
                                >
                                  {edit.showPassword ? 'Hide' : 'Show'}
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-bold mb-1">Allowed App</label>
                              <select
                                className="rounded border px-2 py-1 w-full max-w-xs"
                                value={edit.app}
                                onChange={e => handleEditChange(emp.id, 'app', e.target.value)}
                              >
                                <option value="">Select app...</option>
                                {apps.map(app => (
                                  <option key={app.id} value={app.id}>{app.app_name}</option>
                                ))}
                              </select>
                            </div>
                            {edit.app && (
                              <div>
                                <label className="block text-xs font-bold mb-1">Module</label>
                                <select
                                  className="rounded border px-2 py-1 w-full max-w-xs"
                                  value={edit.module}
                                  onChange={e => handleEditChange(emp.id, 'module', e.target.value)}
                                >
                                  <option value="">Select module...</option>
                                  {modules.filter(m => String(m.app_id) === String(edit.app)).map(m => (
                                    <option key={m.id} value={m.id}>{m.module_name}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {edit.module && (
                              <div>
                                <label className="block text-xs font-bold mb-1">Submodules</label>
                                {(() => {
                                  const filtered = Array.isArray(submodules)
                                    ? submodules.filter(s => String(s.module_id) === String(edit.module))
                                    : [];
                                  // If edit.submodules is empty, use the submodules from accessRecords for this app/module
                                  let selected: string[] = [];
                                  if (Array.isArray(edit.submodules) && edit.submodules.length > 0) {
                                    selected = edit.submodules.map(String);
                                  } else {
                                    // Find all submodule_ids for this employee/app/module in accessRecords
                                    selected = (accessRecords[emp.id] || [])
                                      .filter(r => String(r.app_id) === String(edit.app) && String(r.module_id) === String(edit.module))
                                      .map(r => r.submodule_id ? String(r.submodule_id) : "");
                                  }
                                  return (
                                    <div className="flex flex-wrap gap-2">
                                      {filtered.map(s => (
                                        <label key={s.id} className="flex items-center gap-1 text-xs">
                                          <input
                                            type="checkbox"
                                            checked={selected.includes(String(s.id))}
                                            onChange={e => {
                                              const checked = e.target.checked;
                                              handleEditChange(emp.id, 'submodules', checked
                                                ? [...selected, String(s.id)]
                                                : selected.filter(id => id !== String(s.id))
                                              );
                                            }}
                                          />
                                          {s.submodule_name}
                                        </label>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                            <div className="flex gap-4 mt-4">
                              <button
                                className="rounded-xl px-6 py-2 font-bold text-white bg-green-600 hover:bg-green-700"
                                onClick={() => handleSave(emp)}
                              >
                                Save changes
                              </button>
                              <button
                                className="rounded-xl px-6 py-2 font-bold text-neutral-700 bg-gray-200 hover:bg-gray-300"
                                onClick={() => setExpanded(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* Delete confirmation modal */}
      {showDeleteModal && accessToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-[320px] max-w-xs flex flex-col items-center">
            <div className="font-bold text-lg mb-2 text-center">Are you sure you want to remove this access?</div>
            <div className="text-sm text-neutral-600 mb-6 text-center">This action cannot be undone.</div>
            <div className="flex gap-4">
              <button
                className="px-4 py-2 rounded bg-red-600 text-white font-bold hover:bg-red-700"
                onClick={async () => {
                  await supabase
                    .from("master_klimtab_employee_access")
                    .delete()
                    .eq("id", accessToDelete.id);
                  setShowDeleteModal(false);
                  setAccessToDelete(null);
                  await fetchAccessRecords();
                }}
              >
                Delete
              </button>
              <button
                className="px-4 py-2 rounded bg-gray-200 text-neutral-800 font-bold hover:bg-gray-300"
                onClick={() => {
                  setShowDeleteModal(false);
                  setAccessToDelete(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
