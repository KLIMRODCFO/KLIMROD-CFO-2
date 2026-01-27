"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getWeekCode } from "../../../../utils/getWeekCode";
import { useActiveBU } from "../../ActiveBUContext";
import { supabase } from "../../../../lib/supabaseClient";

const ClosedEventsPage: React.FC = () => {
  const { activeBU } = useActiveBU();
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    week: "",
    day: "",
    event: "",
    shift: "",
    manager: ""
  });
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [shifts, setShifts] = useState<{ id: string; name: string }[]>([]);
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<string>("");

  // Fetch filter options y startDate
  useEffect(() => {
    supabase.from("master_event").select("id, name").then(({ data }) => setEvents(data || []));
    supabase.from("master_shift").select("id, name").then(({ data }) => setShifts(data || []));
    if (activeBU) {
      supabase
        .from("master_employees_directory")
        .select("id, name")
        .eq("business_unit_id", activeBU)
        .eq("department_id", 3)
        .eq("is_active", true)
        .then(({ data }) => setManagers(data || []));
      supabase
        .from("master_business_units")
        .select("week1_start_date")
        .eq("id", activeBU)
        .single()
        .then(({ data }) => setStartDate(data?.week1_start_date || ""));
    }
  }, [activeBU]);

  // Fetch reports
  useEffect(() => {
    if (!activeBU) return;
    let query = supabase.from("closeout_reports").select("*").eq("business_unit_id", activeBU);
    if (filters.from) query = query.gte("date", filters.from);
    if (filters.to) query = query.lte("date", filters.to);
    if (filters.week) query = query.eq("week_code", filters.week);
    if (filters.day) query = query.eq("day", filters.day.charAt(0).toUpperCase() + filters.day.slice(1).toLowerCase());
    if (filters.event) query = query.eq("event_id", filters.event);
    if (filters.shift) query = query.eq("shift_id", filters.shift);
    if (filters.manager) query = query.eq("manager_id", filters.manager);
    query.then(({ data }) => setReports(data || []));
  }, [activeBU, filters]);

  // Calcular semanas únicas disponibles en los reportes
  const weekOptions = useMemo(() => {
    const set = new Set<string>();
    reports.forEach(r => {
      if (r.week_code) set.add(r.week_code);
    });
    return Array.from(set).sort();
  }, [reports]);

  return (
    <div className="min-h-screen bg-bg py-8">
      <h1 className="text-2xl font-bold text-primary text-center mb-8 uppercase tracking-widest">Closed Events</h1>
      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-card p-6 mb-8 w-full max-w-6xl mx-auto grid grid-cols-7 gap-4 items-center">
                <div className="flex flex-col items-center">
                  <label className="text-xs font-semibold mb-2 uppercase tracking-wide text-gray-700">WEEK</label>
                  <select
                    value={filters.week}
                    onChange={e => setFilters(f => ({ ...f, week: e.target.value }))}
                    className="bg-gray-50 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary w-full text-center font-medium"
                  >
                    <option value="">WEEK</option>
                    {weekOptions.map(week => (
                      <option key={week} value={week}>{week}</option>
                    ))}
                  </select>
                </div>
        <div className="flex flex-col items-center">
          <label htmlFor="from" className="text-xs font-semibold mb-2 uppercase tracking-wide text-gray-700">FROM</label>
          <input type="date" id="from" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} className="bg-gray-50 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary w-full text-center font-medium" />
        </div>
        <div className="flex flex-col items-center">
          <label htmlFor="to" className="text-xs font-semibold mb-2 uppercase tracking-wide text-gray-700">TO</label>
          <input type="date" id="to" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} className="bg-gray-50 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary w-full text-center font-medium" />
        </div>
        <div className="flex flex-col items-center col-span-1">
          <label className="text-xs font-semibold mb-2 uppercase tracking-wide text-gray-700">DAY</label>
          <select value={filters.day} onChange={e => setFilters(f => ({ ...f, day: e.target.value }))} className="bg-gray-50 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary w-full text-center font-medium">
            <option value="">DAY</option>
            <option value="MONDAY">MONDAY</option>
            <option value="TUESDAY">TUESDAY</option>
            <option value="WEDNESDAY">WEDNESDAY</option>
            <option value="THURSDAY">THURSDAY</option>
            <option value="FRIDAY">FRIDAY</option>
            <option value="SATURDAY">SATURDAY</option>
            <option value="SUNDAY">SUNDAY</option>
          </select>
        </div>
        <div className="flex flex-col items-center col-span-1">
          <label className="text-xs font-semibold mb-2 uppercase tracking-wide text-gray-700">EVENT</label>
          <select value={filters.event} onChange={e => setFilters(f => ({ ...f, event: e.target.value }))} className="bg-gray-50 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary w-full text-center font-medium">
            <option value="">EVENT</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name.toUpperCase()}</option>)}
          </select>
        </div>
        <div className="flex flex-col items-center col-span-1">
          <label className="text-xs font-semibold mb-2 uppercase tracking-wide text-gray-700">SHIFT</label>
          <select value={filters.shift} onChange={e => setFilters(f => ({ ...f, shift: e.target.value }))} className="bg-gray-50 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary w-full text-center font-medium">
            <option value="">SHIFT</option>
            {shifts.map(sh => <option key={sh.id} value={sh.id}>{sh.name.toUpperCase()}</option>)}
          </select>
        </div>
        <div className="flex flex-col items-center">
          <label className="text-xs font-semibold mb-2 uppercase tracking-wide text-gray-700">MANAGER</label>
          <select value={filters.manager} onChange={e => setFilters(f => ({ ...f, manager: e.target.value }))} className="bg-gray-50 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary w-full text-center font-medium">
            <option value="">MANAGER</option>
            {managers.map(m => <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>)}
          </select>
        </div>
      </div>
      {/* Tabla de reportes */}
      <div className="overflow-x-auto w-full max-w-7xl mx-auto">
        <table className="min-w-full text-sm bg-white rounded-xl shadow-card">
          <thead>
            <tr className="bg-black text-white text-xs uppercase tracking-wider text-center">
              <th className="px-3 py-2">WEEK</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Day</th>
              <th className="px-3 py-2">Event</th>
              <th className="px-3 py-2">Shift</th>
              <th className="px-3 py-2">Manager</th>
              <th className="px-3 py-2">Net Sales</th>
              <th className="px-3 py-2">CC Sales</th>
              <th className="px-3 py-2">Cash Sales</th>
              <th className="px-3 py-2">CC Gratuity</th>
              <th className="px-3 py-2">Cash Gratuity</th>
              <th className="px-3 py-2">Total Points</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(report => (
              <tr key={report.id} className="border-b text-center">
                <td className="px-2 py-2 font-bold">
                  {startDate && report.date ? getWeekCode(startDate, report.date) : ""}
                </td>
                <td className="px-2 py-2">{report.date}</td>
                <td className="px-2 py-2">{String(report.day).toUpperCase()}</td>
                <td className="px-2 py-2">{report.event_name}</td>
                <td className="px-2 py-2">{report.shift_name}</td>
                <td className="px-2 py-2">{report.manager_name}</td>
                <td className="px-2 py-2">{Number(report.totals_net_sales).toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
                <td className="px-2 py-2">{Number(report.totals_cc_sales).toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
                <td className="px-2 py-2">{Number(report.totals_cash_sales).toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
                <td className="px-2 py-2">{Number(report.totals_cc_gratuity).toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
                <td className="px-2 py-2">{Number(report.totals_cash_gratuity).toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
                <td className="px-2 py-2">{report.totals_points}</td>
                <td className="px-2 py-2 flex gap-2 justify-center">
                  <button className="bg-black text-white px-4 py-1 rounded font-bold text-xs hover:bg-gray-800 transition uppercase">VIEW</button>
                  <button
                    className="bg-black text-white px-4 py-1 rounded font-bold text-xs hover:bg-gray-800 transition uppercase"
                    onClick={() => {
                      window.location.href = `/sales-report/closed-events/edit/${report.id}`;
                    }}
                  >EDIT</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClosedEventsPage;
