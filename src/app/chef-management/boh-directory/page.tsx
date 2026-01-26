"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useActiveBU } from "@/app/ActiveBUContext";

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
  pos_id?: string | null;
  department?: { name: string };
  position?: { name: string };
  pay_type?: { name: string };
}

export default function BohDirectory() {
  const { activeBU } = useActiveBU();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [payTypeFilter, setPayTypeFilter] = useState("");


  useEffect(() => {
    if (!activeBU) return;
    setLoading(true);
    supabase
      .from("master_employees_directory")
      .select("id, first_name, middle_name, last_name, department_id, position_id, business_unit_id, is_active, pay_type_id, rate, pos_id, department:master_departments(name), position:master_positions(name), pay_type:pay_types(name)")
      .eq("business_unit_id", activeBU)
      .then(({ data }) => {
        // Asegurarse de que department, position y pay_type sean objetos, no arrays
        const normalized = (data || []).map((emp: any) => ({
          ...emp,
          department: Array.isArray(emp.department) ? emp.department[0] : emp.department,
          position: Array.isArray(emp.position) ? emp.position[0] : emp.position,
          pay_type: Array.isArray(emp.pay_type) ? emp.pay_type[0] : emp.pay_type,
        }));
        // Only BOH department (by name)
        const filtered = normalized.filter((emp: Employee) => emp.department?.name === "BOH");
        setEmployees(filtered);
        setLoading(false);
      });
  }, [activeBU]);

  // Get unique positions and pay types for filter dropdowns
  const uniquePositions = Array.from(new Set(employees.map(e => e.position?.name).filter(Boolean)));
  const uniquePayTypes = Array.from(new Set(employees.map(e => e.pay_type?.name).filter(Boolean)));

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.first_name} ${emp.middle_name || ''} ${emp.last_name}`.toLowerCase();
    return (
      fullName.includes(nameFilter.toLowerCase()) &&
      (positionFilter ? emp.position?.name === positionFilter : true) &&
      (payTypeFilter ? emp.pay_type?.name === payTypeFilter : true)
    );
  });

  return (
    <div className="max-w-6xl mx-auto py-10 bg-[#f7f7fa] rounded-2xl shadow border border-[#e5e7eb]">
      {!activeBU ? (
        <div className="text-center text-red-500 font-bold text-lg mb-8">No hay unidad de negocio activa seleccionada.</div>
      ) : (
        <>
          {/* SUMMARY */}
          <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 px-2">
            <div className="text-base font-bold text-black tracking-wide">
              TOTAL ACTIVE BOH EMPLOYEES: {employees.filter(e => e.is_active).length}
            </div>
            <div className="flex flex-wrap gap-4">
              {uniquePositions.map(pos => {
                const count = employees.filter(e => e.is_active && e.position?.name === pos).length;
                return (
                  <span key={pos} className="bg-[#f3f4f6] border border-[#e5e7eb] rounded-full px-3 py-1 text-xs font-semibold text-gray-700">
                    {pos}: {count}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-6 mb-6 items-end bg-transparent p-6 rounded-2xl justify-center">
            <div className="flex flex-col items-center">
              <label className="block text-xs font-bold mb-2 text-gray-700 tracking-widest uppercase">SEARCH BY NAME</label>
              <input
                type="text"
                className="bg-white border-2 border-[#e5e7eb] focus:border-black focus:ring-2 focus:ring-black text-black px-4 py-2 rounded-xl w-52 shadow-sm transition-all duration-200 outline-none text-center"
                placeholder="Name..."
                value={nameFilter}
                onChange={e => setNameFilter(e.target.value)}
              />
            </div>
            <div className="flex flex-col items-center">
              <label className="block text-xs font-bold mb-2 text-gray-700 tracking-widest uppercase">FILTER BY POSITION</label>
              <select
                className="bg-white border-2 border-[#e5e7eb] focus:border-black focus:ring-2 focus:ring-black text-black px-4 py-2 rounded-xl w-52 shadow-sm transition-all duration-200 outline-none text-center"
                value={positionFilter}
                onChange={e => setPositionFilter(e.target.value)}
              >
                <option value="">All</option>
                {uniquePositions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col items-center">
              <label className="block text-xs font-bold mb-2 text-gray-700 tracking-widest uppercase">FILTER BY PAY TYPE</label>
              <select
                className="bg-white border-2 border-[#e5e7eb] focus:border-black focus:ring-2 focus:ring-black text-black px-4 py-2 rounded-xl w-52 shadow-sm transition-all duration-200 outline-none text-center"
                value={payTypeFilter}
                onChange={e => setPayTypeFilter(e.target.value)}
              >
                <option value="">All</option>
                {uniquePayTypes.map(pt => (
                  <option key={pt} value={pt}>{pt}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto rounded-2xl shadow-2xl border border-[#e5e7eb] bg-[#f7f7fa]">
            <table className="w-full text-base min-w-[900px]">
              <thead className="sticky top-0 z-10 bg-black text-white uppercase text-xs tracking-widest shadow-lg border-b border-[#e5e7eb]">
                <tr>
                  <th className="px-5 py-4">NAME</th>
                  <th className="px-5 py-4">POSITION</th>
                  <th className="px-5 py-4">PAY TYPE</th>
                  <th className="px-5 py-4">RATE</th>
                  <th className="px-5 py-4">STATUS</th>
                  <th className="px-5 py-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-lg animate-pulse">Loading...</td></tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-lg">No employees found.</td></tr>
                ) : (
                  filteredEmployees.map((emp, idx) => (
                    <tr key={emp.id} className={
                      `transition-all ${idx % 2 === 0 ? "bg-white" : "bg-[#f3f4f6]"} hover:bg-[#e5e7eb] group`}
                    >
                      <td className="px-5 py-2 font-semibold text-black whitespace-nowrap group-hover:text-black transition-all text-center">{emp.first_name} {emp.middle_name || ''} {emp.last_name}</td>
                      <td className="px-5 py-2 text-gray-700 whitespace-nowrap group-hover:text-black transition-all text-center">{emp.position?.name || ''}</td>
                      <td className="px-5 py-2 text-gray-700 whitespace-nowrap group-hover:text-black transition-all text-center">{emp.pay_type?.name || ''}</td>
                      <td className="px-5 py-2 text-black whitespace-nowrap group-hover:text-black transition-all text-center">{emp.rate || ''}</td>
                      <td className="px-5 py-2 font-bold text-center">
                        {emp.is_active ? <span className="bg-black text-white rounded-full px-5 py-1 text-xs font-bold">ACTIVE</span> : <span className="border border-black text-black rounded-full px-5 py-1 text-xs font-bold">INACTIVE</span>}
                      </td>
                      <td className="px-5 py-2 text-center">
                        <button className="bg-white hover:bg-black hover:text-white text-black px-5 py-1 rounded-full text-xs font-bold shadow border-2 border-black transition-all duration-200 tracking-widest">REPORT</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
