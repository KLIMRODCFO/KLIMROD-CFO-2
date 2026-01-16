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
  pay_type_id?: number | null;
  rate?: string | null;
  department?: { name: string };
  position?: { name: string };
  pay_type?: { name: string };
}


export default function StaffDirectoryPage() {
    const [payTypes, setPayTypes] = useState<{ id: number; name: string }[]>([]);
    const [editPayType, setEditPayType] = useState<number | null>(null);
    const [editRate, setEditRate] = useState<string>("");
    // Fetch pay types
    useEffect(() => {
      const fetchPayTypes = async () => {
        const { data } = await supabase.from("pay_types").select("id, name");
        setPayTypes(data || []);
      };
      fetchPayTypes();
    }, []);
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
    setEditPayType(emp.pay_type_id ?? null);
    setEditRate(emp.rate ?? "");
  };

  const handleSave = async (id: number) => {
    setSaving(true);
    await supabase.from("master_employees_directory").update({
      department_id: editDepartment,
      position_id: editPosition,
      pay_type_id: editPayType,
      rate: editRate
    }).eq("id", id);
    // Refetch para obtener los datos actualizados de la relación
    let query = supabase
      .from("master_employees_directory")
      .select("*, department:master_departments(name), position:master_positions(name), pay_type:pay_types(name)");
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
      <div className="w-full max-w-7xl bg-white rounded-2xl shadow-lg overflow-x-auto border border-gray-300">
        {loading ? (
          <div className="text-center py-10 text-lg font-semibold">Cargando...</div>
        ) : (
          <table className="w-full text-base min-w-[900px]">
            <thead>
              <tr className="bg-black text-white text-center text-sm uppercase tracking-wider">
                <th className="px-3 py-3">ID</th>
                <th className="px-3 py-3">NAME</th>
                <th className="px-3 py-3">DEPARTMENT</th>
                <th className="px-3 py-3">POSITION</th>
                <th className="px-3 py-3">PAY TYPE</th>
                <th className="px-3 py-3">RATE</th>
                <th className="px-3 py-3">STATUS</th>
                <th className="px-3 py-3">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="text-center text-sm">
              {employees.map(emp => (
                <tr key={emp.id} className={`border-b ${emp.is_active ? "bg-white" : "bg-gray-100"} hover:bg-gray-50 transition-all`}>
                  <td className="px-3 py-3 font-mono text-xs text-gray-700">{emp.id}</td>
                  <td className="px-3 py-3 font-semibold text-black whitespace-nowrap">{emp.first_name} {emp.middle_name || ""} {emp.last_name}</td>
                  <td className="px-3 py-3 text-gray-800">
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
                  <td className="px-3 py-3 text-gray-800">
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
                  {editingId === emp.id ? (
                    <td className="px-3 py-3">
                      <select className="border border-gray-400 rounded-lg px-2 py-1 bg-white text-gray-900 text-xs" value={editPayType ?? ''} onChange={e => setEditPayType(Number(e.target.value) || null)}>
                        <option value="">Select pay type</option>
                        {payTypes.map(pt => (
                          <option key={pt.id} value={pt.id}>{pt.name}</option>
                        ))}
                      </select>
                    </td>
                  ) : (
                    <td className="px-3 py-3 text-gray-900">{emp.pay_type?.name || ''}</td>
                  )}
                  {editingId === emp.id ? (
                    <td className="px-3 py-3">
                      <input className="w-full border border-gray-400 rounded-lg px-2 py-1 text-xs bg-white text-gray-900 min-w-[110px]" type="text" inputMode="decimal" pattern="^[0-9]*[.,]?[0-9]*$" value={editRate} onChange={e => setEditRate(e.target.value)} />
                    </td>
                  ) : (
                    <td className="px-3 py-3 text-gray-900">{emp.rate || ''}</td>
                  )}
                  <td className="px-3 py-3 font-bold">
                    {emp.is_active ? (
                      <span className="bg-black text-white rounded-full px-4 py-1 text-xs font-bold tracking-widest">ACTIVE</span>
                    ) : (
                      <span className="bg-gray-700 text-white rounded-full px-4 py-1 text-xs font-bold tracking-widest">INACTIVE</span>
                    )}
                  </td>
                  <td className="px-3 py-3 flex gap-2 justify-center">
                    {editingId === emp.id ? (
                      <>
                        <button className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold shadow hover:bg-gray-800 transition" onClick={() => handleSave(emp.id)} disabled={saving}>SAVE</button>
                        <button className="bg-gray-400 text-white px-3 py-1 rounded-full text-xs font-bold shadow hover:bg-gray-500 transition" onClick={() => setEditingId(null)} disabled={saving}>CANCEL</button>
                      </>
                    ) : (
                      <>
                        <button className="border border-black text-black px-3 py-1 rounded-full text-xs font-bold shadow hover:bg-black hover:text-white transition" onClick={() => handleEdit(emp)}>EDIT</button>
                        <button className={`px-3 py-1 rounded-full text-xs font-bold shadow transition ${emp.is_active ? "border border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white" : "border border-green-700 text-green-700 hover:bg-green-700 hover:text-white"}`} onClick={() => handleToggleActive(emp.id, emp.is_active)}>
                          {emp.is_active ? "DEACTIVATE" : "ACTIVATE"}
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
