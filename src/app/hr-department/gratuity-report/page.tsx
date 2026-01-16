"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useActiveBU } from "../../ActiveBUContext";

const GratuityReportPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<"detalle" | "totales">("detalle");
  const { activeBU } = useActiveBU();
  const [filters, setFilters] = useState({
    week: "",
    employee: "",
    event: "",
    position: "",
    from: "",
    to: "",
  });
  const [weeks, setWeeks] = useState<string[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string; position?: string }[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [detalleData, setDetalleData] = useState<any[]>([]);
  const [totalesData, setTotalesData] = useState<any[]>([]);

  // Cargar opciones de filtros y datos
  useEffect(() => {
    if (!activeBU) return;
    // WEEK: obtener semanas únicas de closeout_report_employees
    supabase
      .from("closeout_report_employees")
      .select("week_code")
      .eq("business_unit_id", activeBU)
      .then(({ data }) => {
        const set = new Set<string>();
        data?.forEach((row: any) => row.week_code && set.add(row.week_code));
        setWeeks(Array.from(set).sort());
      });
    // EMPLOYEE y POSITION: solo FOH de la unidad de negocio activa
    supabase
      .from("master_employees_directory")
      .select("id, name, position")
      .eq("business_unit_id", activeBU)
      .eq("is_active", true)
      .eq("is_foh", true)
      .then(({ data }) => {
        setEmployees(data || []);
        // Extraer posiciones únicas
        const posSet = new Set<string>();
        data?.forEach((emp: any) => emp.position && posSet.add(emp.position));
        setPositions(Array.from(posSet).sort());
      });
    // EVENT: lista de master_event
    supabase
      .from("master_event")
      .select("id, name")
      .then(({ data }) => setEvents(data || []));
  }, [activeBU]);

  // Cargar datos filtrados de closeout_report_employees
  useEffect(() => {
    if (!activeBU) return;
    let query = supabase
      .from("closeout_report_employees")
      .select("id, week_code, date, event_name, employee_name, gratuity, employee_id, event_id, position")
      .eq("business_unit_id", activeBU);
    if (filters.week) query = query.eq("week_code", filters.week);
    if (filters.employee) query = query.eq("employee_id", filters.employee);
    if (filters.event) query = query.eq("event_id", filters.event);
    if (filters.position) query = query.eq("position", filters.position);
    if (filters.from) query = query.gte("date", filters.from);
    if (filters.to) query = query.lte("date", filters.to);
    query.then(({ data }) => {
      setDetalleData(data || []);
      // Calcular totales por empleado para la vista "totales"
      if (data) {
        const map = new Map();
        data.forEach((row: any) => {
          if (!map.has(row.employee_id)) {
            map.set(row.employee_id, {
              id: row.employee_id,
              week: row.week_code,
              employee: row.employee_name,
              totalGratuity: 0,
            });
          }
          map.get(row.employee_id).totalGratuity += row.gratuity || 0;
        });
        setTotalesData(Array.from(map.values()));
      } else {
        setTotalesData([]);
      }
    });
  }, [activeBU, filters]);

  return (
    <div className="min-h-screen bg-bg py-8">
      <h1 className="text-2xl font-bold text-primary text-center mb-8 uppercase tracking-widest">Gratuity Report</h1>
      {/* Selector de vista */}
      <div className="flex justify-end mb-4 max-w-5xl mx-auto items-center">
        <label className="mr-2 font-bold uppercase tracking-widest text-xs text-gray-700 text-right" style={{ minWidth: 60 }}>VIEW</label>
        <select
          value={viewMode}
          onChange={e => setViewMode(e.target.value as "detalle" | "totales")}
          className="bg-gray-50 rounded-lg px-4 py-2 text-gray-900 font-semibold uppercase text-xs tracking-widest text-right"
          style={{ minWidth: 180 }}
        >
          <option value="detalle">DETAIL BY EVENT</option>
          <option value="totales">TOTALS BY EMPLOYEE</option>
        </select>
      </div>
      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-card p-6 mb-8 w-full max-w-6xl mx-auto grid grid-cols-5 gap-4 items-center">
        <div className="flex flex-col items-center">
          <label className="text-xs font-semibold mb-2 uppercase tracking-wide text-gray-700">WEEK</label>
          <select
            value={filters.week}
            onChange={e => setFilters(f => ({ ...f, week: e.target.value }))}
            className="bg-gray-50 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary w-full text-center font-medium"
          >
            <option value="">WEEK</option>
            {weeks.map(week => (
              <option key={week} value={week}>{week}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col items-center">
          <label className="text-xs font-semibold mb-2 uppercase tracking-wide text-gray-700">EMPLOYEE</label>
          <select
            value={filters.employee}
            onChange={e => setFilters(f => ({ ...f, employee: e.target.value }))}
            className="bg-gray-50 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary w-full text-center font-medium"
          >
            <option value="">EMPLOYEE</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col items-center">
          <label className="text-xs font-semibold mb-2 uppercase tracking-wide text-gray-700">POSITION</label>
          <select
            value={filters.position}
            onChange={e => setFilters(f => ({ ...f, position: e.target.value }))}
            className="bg-gray-50 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary w-full text-center font-medium"
          >
            <option value="">POSITION</option>
            {positions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col items-center">
          <label className="text-xs font-semibold mb-2 uppercase tracking-wide text-gray-700">FROM</label>
          <input
            type="date"
            value={filters.from}
            onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
            className="bg-gray-50 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary w-full text-center font-medium"
          />
        </div>
        <div className="flex flex-col items-center">
          <label className="text-xs font-semibold mb-2 uppercase tracking-wide text-gray-700">TO</label>
          <input
            type="date"
            value={filters.to}
            onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
            className="bg-gray-50 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary w-full text-center font-medium"
          />
        </div>
      </div>
      {/* Tabla */}
      <div className="overflow-x-auto w-full max-w-7xl mx-auto">
        {viewMode === "detalle" ? (
          <table className="min-w-full text-sm bg-white rounded-xl shadow-card">
            <thead>
              <tr className="bg-black text-white text-xs uppercase tracking-wider text-center">
                <th className="px-3 py-2">WEEK</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Employee</th>
                <th className="px-3 py-2">Gratuity</th>
              </tr>
            </thead>
            <tbody>
              {detalleData.map(row => (
                <tr key={row.id} className="border-b text-center">
                  <td className="px-2 py-2 font-bold">{row.week_code}</td>
                  <td className="px-2 py-2">{row.date}</td>
                  <td className="px-2 py-2">{row.event_name}</td>
                  <td className="px-2 py-2">{row.employee_name}</td>
                  <td className="px-2 py-2">{Number(row.gratuity).toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="min-w-full text-sm bg-white rounded-xl shadow-card">
            <thead>
              <tr className="bg-black text-white text-xs uppercase tracking-wider text-center">
                <th className="px-3 py-2">WEEK</th>
                <th className="px-3 py-2">Employee</th>
                <th className="px-3 py-2">Total Gratuity</th>
              </tr>
            </thead>
            <tbody>
              {totalesData.map(row => (
                <tr key={row.id} className="border-b text-center">
                  <td className="px-2 py-2 font-bold">{row.week}</td>
                  <td className="px-2 py-2">{row.employee}</td>
                  <td className="px-2 py-2">{Number(row.totalGratuity).toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default GratuityReportPage;
