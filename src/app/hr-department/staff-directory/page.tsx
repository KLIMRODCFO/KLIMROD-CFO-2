"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useActiveBU } from "../../ActiveBUContext";

interface Employee {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  department_id: number;
  position_id: number;
  business_unit_id: number;
  is_active: boolean;
  department?: { name: string };
  position?: { name: string };
}

export default function StaffDirectoryPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActive, setShowActive] = useState(true);
  const { activeBU } = useActiveBU();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDepartment, setEditDepartment] = useState<number | null>(null);
  const [editPosition, setEditPosition] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      let query = supabase
        .from("master_employees_directory")
        .select("*, department:master_departments(name), position:master_positions(name)");
      if (showActive) query = query.eq("is_active", true);
      if (activeBU) query = query.eq("business_unit_id", activeBU);
      const { data, error } = await query;
      if (!error && data) setEmployees(data);
      setLoading(false);
    };
    fetchEmployees();
  }, [showActive, activeBU]);

  const handleToggleActive = async (id: number, current: boolean) => {
    await supabase.from("master_employees_directory").update({ is_active: !current }).eq("id", id);
    setEmployees(employees => employees.map(emp => emp.id === id ? { ...emp, is_active: !current } : emp));
  };

  // Suponiendo que tienes los catálogos de departamentos y posiciones:
  // Puedes traerlos con un useEffect similar a como traes empleados
  const [departments, setDepartments] = useState<{id:number, name:string}[]>([]);
  const [positions, setPositions] = useState<{id:number, name:string, department_id:number}[]>([]);
  useEffect(() => {
    const fetchCatalogs = async () => {
      const { data: depData } = await supabase.from("master_departments").select("id, name");
      const { data: posData } = await supabase.from("master_positions").select("id, name, department_id");
      setDepartments(depData || []);
      setPositions(posData || []);
    };
    fetchCatalogs();
  }, []);

  const handleEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setEditDepartment(emp.department_id);
    setEditPosition(emp.position_id);
  };

  const handleSave = async (id: number) => {
    setSaving(true);
    await supabase.from("master_employees_directory").update({
      department_id: editDepartment,
      position_id: editPosition
    }).eq("id", id);
    // Refetch para obtener los datos actualizados de la relación
    let query = supabase
      .from("master_employees_directory")
      .select("*, department:master_departments(name), position:master_positions(name)");
    if (showActive) query = query.eq("is_active", true);
    if (activeBU) query = query.eq("business_unit_id", activeBU);
    const { data, error } = await query;
    if (!error && data) setEmployees(data);
    setEditingId(null);
    setSaving(false);
  };

  return (
    <div className="p-8 flex flex-col items-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-center">Staff Directory</h1>
      <div className="mb-6 flex gap-4 items-center justify-center w-full max-w-5xl">
        <label className="font-semibold">Mostrar solo activos</label>
        <input type="checkbox" checked={showActive} onChange={() => setShowActive(v => !v)} />
      </div>
      <div className="w-full max-w-5xl bg-white rounded shadow-lg overflow-x-auto">
        {loading ? (
          <div className="text-center py-10 text-lg font-semibold">Cargando...</div>
        ) : (
          <table className="w-full border text-base">
            <thead>
              <tr className="bg-gray-900 text-white text-center">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Departamento</th>
                <th className="px-4 py-3">Posición</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} className={`text-center ${emp.is_active ? "" : "bg-gray-200"}`}>
                  <td className="px-4 py-3">{emp.id}</td>
                  <td className="px-4 py-3 font-semibold">{emp.first_name} {emp.middle_name || ""} {emp.last_name}</td>
                  <td className="px-4 py-3">
                    {editingId === emp.id ? (
                      <select className="border rounded px-2 py-1" value={editDepartment ?? ''} onChange={e => setEditDepartment(Number(e.target.value))}>
                        <option value="">Selecciona</option>
                        {departments.map(dep => (
                          <option key={dep.id} value={dep.id}>{dep.name}</option>
                        ))}
                      </select>
                    ) : (
                      emp.department?.name || emp.department_id
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === emp.id ? (
                      <select className="border rounded px-2 py-1" value={editPosition ?? ''} onChange={e => setEditPosition(Number(e.target.value))}>
                        <option value="">Selecciona</option>
                        {positions.filter(pos => pos.department_id === editDepartment).map(pos => (
                          <option key={pos.id} value={pos.id}>{pos.name}</option>
                        ))}
                      </select>
                    ) : (
                      emp.position?.name || emp.position_id
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold">{emp.is_active ? <span className="text-green-700">ACTIVO</span> : <span className="text-red-700">INACTIVO</span>}</td>
                  <td className="px-4 py-3 flex gap-2 justify-center">
                    {editingId === emp.id ? (
                      <>
                        <button className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition" onClick={() => handleSave(emp.id)} disabled={saving}>Guardar</button>
                        <button className="bg-gray-400 text-white px-4 py-2 rounded shadow hover:bg-gray-500 transition" onClick={() => setEditingId(null)} disabled={saving}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition" onClick={() => handleEdit(emp)}>Editar</button>
                        <button className={`px-4 py-2 rounded shadow transition ${emp.is_active ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}`} onClick={() => handleToggleActive(emp.id, emp.is_active)}>
                          {emp.is_active ? "Desactivar" : "Activar"}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
