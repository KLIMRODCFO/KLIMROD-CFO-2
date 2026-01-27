
"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "lib/supabaseClient";
import { getWeekCode } from "../../../utils/getWeekCode";

interface CloseoutFormProps {
  mode: "create" | "edit";
  initialData?: any;
  closeoutId?: string;
  employeeRows?: any[];
  onSaved?: () => void;
}

const defaultTotals = {
  netSales: 0,
  ccSales: 0,
  cashSales: 0,
  ccGratuity: 0,
  cashGratuity: 0,
  points: 0,
};

function formatNumber(val: any) {
  if (val === null || val === undefined || val === "") return "";
  const num = Number(val);
  if (isNaN(num)) return val;
  if (Number.isInteger(num)) return num.toString();
  return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export const CloseoutForm: React.FC<CloseoutFormProps> = ({ mode, initialData, closeoutId, employeeRows = [], onSaved }) => {
  // FOH employees para dropdown: activos e históricos separados
  const [fohActive, setFohActive] = useState<any[]>([]);
  const [fohHistoric, setFohHistoric] = useState<any[]>([]);
  const [fohRaw, setFohRaw] = useState<any>(null);
  useEffect(() => {
    async function fetchEmployees() {
      if (!initialData?.business_unit_id) return;
      // Limpiar business_unit_id (quitar cualquier ':...' al final)
      const cleanBU = String(initialData.business_unit_id).split(":")[0];
      let active = [];
      let activeError = null;
      // 1. FOH activos (todos los actuales)
      const res = await supabase
        .from("master_employees_directory")
        .select("id, name, position_name, position_id, is_active, department_id")
        .eq("business_unit_id", cleanBU);
      active = res.data || [];
      activeError = res.error;
      // Si sigue vacía, probar sin filtro de business_unit_id
      if ((!active || active.length === 0) && !activeError) {
        const res2 = await supabase
          .from("master_employees_directory")
          .select("id, name, position_name, position_id, is_active, department_id");
        active = res2.data || [];
        activeError = res2.error;
      }
      if (activeError) {
        setError("Error FOH query: " + activeError.message);
        setFohActive([]);
        setFohRaw(null);
      } else {
        setFohActive(active || []);
        setFohRaw(active);
      }
      // 2. Históricos del reporte (solo los que ya no están activos)
      const activeIds = new Set((active || []).map(e => e.id));
      const historic = (employeeRows || [])
        .filter(emp => !activeIds.has(emp.employee_id))
        .map(emp => ({
          id: emp.employee_id,
          name: emp.employee_name,
          position_name: emp.position_name,
          position_id: emp.position_id,
        }));
      setFohHistoric(historic);
    }
    fetchEmployees();
  }, [initialData?.business_unit_id, employeeRows]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // General info states
  const [buName, setBuName] = useState(initialData?.business_unit_name || "");
  const [buOpenDate, setBuOpenDate] = useState<string>("");
  const [date, setDate] = useState(initialData?.date || "");
  const [day, setDay] = useState(initialData?.day || "");
  const [weekCode, setWeekCode] = useState(initialData?.week_code || "");
    // Al cargar, si falta el nombre del BU o la fecha de apertura, buscar por business_unit_id
    useEffect(() => {
      if ((!buName || !buOpenDate) && initialData?.business_unit_id) {
        supabase
          .from("master_business_units")
          .select("name, week1_start_date")
          .eq("id", initialData.business_unit_id)
          .single()
          .then(({ data }) => {
            if (data) {
              if (!buName && data.name) setBuName(data.name);
              if (!buOpenDate && data.week1_start_date) setBuOpenDate(data.week1_start_date);
            }
          });
      } else if (initialData?.business_unit_name) {
        setBuName(initialData.business_unit_name);
      }
      if (initialData?.week1_start_date) setBuOpenDate(initialData.week1_start_date);
    }, [initialData]);
  const [event, setEvent] = useState(initialData?.event_id || "");
  const [shift, setShift] = useState(initialData?.shift_id || "");
  const [manager, setManager] = useState(initialData?.manager_id || "");
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [shifts, setShifts] = useState<{ id: string; name: string }[]>([]);
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);

  // Totals
  const [totals, setTotals] = useState<any>({
    netSales: initialData?.totals_net_sales || 0,
    ccSales: initialData?.totals_cc_sales || 0,
    cashSales: initialData?.totals_cash_sales || 0,
    ccGratuity: initialData?.totals_cc_gratuity || 0,
    cashGratuity: initialData?.totals_cash_gratuity || 0,
    points: initialData?.totals_points || 0,
  });

  // Employees/rows: solo los que trabajaron el evento
  const [rows, setRows] = useState<any[]>(
    mode === "edit" && employeeRows && employeeRows.length > 0
      ? employeeRows.map(emp => ({
          employee: emp.employee_id,
          employee_name: emp.employee_name,
          position: emp.position_name ? emp.position_name.toUpperCase() : "",
          position_id: emp.position_id,
          netSales: emp.net_sales,
          cashSales: emp.cash_sales,
          ccSales: emp.cc_sales,
          ccGratuity: emp.cc_gratuity,
          cashGratuity: emp.cash_gratuity,
          points: emp.points,
          isNew: false,
        }))
      : []
  );

  // Fetch options for selects (events, shifts, managers)
  useEffect(() => {
    supabase.from("master_event").select("id, name").then(({ data }) => setEvents(data || []));
    supabase.from("master_shift").select("id, name").then(({ data }) => setShifts(data || []));
    if (initialData?.business_unit_id) {
      supabase
        .from("master_employees_directory")
        .select("id, name")
        .eq("business_unit_id", initialData.business_unit_id)
        .eq("department_id", 3)
        .eq("is_active", true)
        .then(({ data }) => setManagers(data || []));
    }
  }, [initialData?.business_unit_id]);

  // Totals auto-calc
  useEffect(() => {
    const sumField = (field: string) =>
      rows.reduce((acc, row) => {
        const val = row[field];
        if (val === undefined || val === null || val === "") return acc;
        const num = Number(val);
        return acc + (isNaN(num) ? 0 : num);
      }, 0);
    setTotals((prev: any) => ({
      ...prev,
      netSales: sumField('netSales'),
      ccSales: sumField('ccSales'),
      cashSales: sumField('cashSales'),
      ccGratuity: sumField('ccGratuity'),
      cashGratuity: sumField('cashGratuity'),
      points: sumField('points'),
    }));
  }, [rows]);

  // Handlers
  const handleTotalsChange = (field: string, value: number) => {
    setTotals((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleRowChange = (idx: number, field: string, value: any) => {
    const numericFields = ["netSales", "cashSales", "ccSales", "ccGratuity", "cashGratuity", "points"];
    let newValue = value;
    if (numericFields.includes(field)) {
      if (value === "" || value === null || value === undefined) {
        newValue = "";
      } else if (typeof value === "number") {
        newValue = value.toString();
      } else {
        newValue = value.replace(/[^\d.\-]/g, "");
      }
    }
    setRows(prev => prev.map((row, i) => i === idx ? { ...row, [field]: newValue } : row));
  };

  const handleAddRow = () => {
    setRows(prev => [
      ...prev,
      {
        employee: "",
        employee_name: "",
        position: "",
        position_id: "",
        netSales: "",
        cashSales: "",
        ccSales: "",
        ccGratuity: "",
        cashGratuity: "",
        points: "",
        isNew: true,
      },
    ]);
  };

  const handleRemoveRow = (idx: number) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  // Gratuity Distribution Calculation
  const totalPoints = rows.reduce((acc, row) => acc + (Number(row.points) || 0), 0);
  const totalCCGratuity = Number(totals.ccGratuity) || 0;
  const totalCashGratuity = Number(totals.cashGratuity) || 0;

  const gratuityRows = rows.map(row => {
    const points = Number(row.points) || 0;
    const percent = totalPoints > 0 ? (points / totalPoints) : 0;
    return {
      employee: row.employee_name,
      position: row.position,
      ccGratuity: percent * totalCCGratuity,
      cashGratuity: percent * totalCashGratuity,
      points: points,
      percent: percent * 100,
    };
  });

  // Submit handler (update closeout_reports and closeout_report_employees)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      // Update closeout_reports
      const payload = {
        business_unit_id: initialData?.business_unit_id,
        date,
        day,
        week_code: weekCode,
        event_id: event,
        shift_id: shift,
        manager_id: manager,
        totals_net_sales: totals.netSales,
        totals_cc_sales: totals.ccSales,
        totals_cash_sales: totals.cashSales,
        totals_cc_gratuity: totals.ccGratuity,
        totals_cash_gratuity: totals.cashGratuity,
        totals_points: totals.points,
      };
      if (mode === "edit" && closeoutId) {
        await supabase.from("closeout_reports").update(payload).eq("id", closeoutId);
        // Update closeout_report_employees
        await supabase.from("closeout_report_employees").delete().eq("report_id", closeoutId);
        const newRows = rows.filter(r => r.employee_name && r.position);
        if (newRows.length > 0) {
          await supabase.from("closeout_report_employees").insert(
            newRows.map(r => ({
              report_id: closeoutId,
              employee_id: r.employee,
              employee_name: r.employee_name,
              position_name: r.position,
              position_id: r.position_id,
              net_sales: Number(r.netSales) || 0,
              cash_sales: Number(r.cashSales) || 0,
              cc_sales: Number(r.ccSales) || 0,
              cc_gratuity: Number(r.ccGratuity) || 0,
              cash_gratuity: Number(r.cashGratuity) || 0,
              points: Number(r.points) || 0,
            }))
          );
        }
      }
      setSuccess(true);
      if (onSaved) onSaved();
    } catch (err: any) {
      setError("Error al guardar: " + (err.message || err.toString()));
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow-card p-8">
        <h2 className="text-lg font-bold mb-6 text-black uppercase">General Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div>
            <div className="text-xs font-bold text-gray-700 mb-1 uppercase">RESTAURANT</div>
            <input type="text" value={buName} disabled className="w-full bg-gray-100 rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 uppercase" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-700 mb-1 uppercase">DATE</div>
            <input
              type="date"
              value={date}
              onChange={e => {
                const newDate = e.target.value;
                setDate(newDate);
                if (newDate) {
                  // Corregir desfase: crear fecha con zona local y usar getUTCDay()
                  const d = new Date(newDate + 'T12:00:00');
                  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
                  setDay(days[d.getUTCDay()]);
                  // Calcular week code usando fecha de apertura del BU
                  if (buOpenDate) {
                    try {
                      setWeekCode(getWeekCode(buOpenDate, newDate));
                    } catch (err) {
                      setWeekCode("");
                    }
                  }
                } else {
                  setDay("");
                  setWeekCode("");
                }
              }}
              className="w-full bg-gray-100 rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 uppercase"
            />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-700 mb-1 uppercase">DAY</div>
            <input type="text" value={day?.toUpperCase()} disabled className="w-full bg-gray-100 rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 uppercase" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-700 mb-1 uppercase">WEEK CODE</div>
            <input type="text" value={weekCode} disabled className="w-full bg-gray-100 rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 uppercase" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <div className="text-xs font-bold text-gray-700 mb-1 uppercase">EVENT</div>
            <select value={event} onChange={e => setEvent(e.target.value)} className="w-full bg-gray-100 rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 uppercase">
              <option value="">SELECT EVENT</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-700 mb-1 uppercase">SHIFT</div>
            <select value={shift} onChange={e => setShift(e.target.value)} className="w-full bg-gray-100 rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 uppercase">
              <option value="">SELECT SHIFT</option>
              {shifts.map(sh => (
                <option key={sh.id} value={sh.id}>{sh.name.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-700 mb-1 uppercase">MANAGER</div>
            <select value={manager} onChange={e => setManager(e.target.value)} className="w-full bg-gray-100 rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 uppercase">
              <option value="">SELECT MANAGER</option>
              {managers.map(m => (
                <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="w-full mt-6">
          <div className="bg-gray-100 rounded-lg p-4 flex flex-col">
            <div className="grid grid-cols-6 gap-4 mb-2">
              <div className="text-xs font-bold text-gray-700 uppercase text-center">Net Sales</div>
              <div className="text-xs font-bold text-gray-700 uppercase text-center">CC Sales</div>
              <div className="text-xs font-bold text-gray-700 uppercase text-center">Cash Sales</div>
              <div className="text-xs font-bold text-gray-700 uppercase text-center">CC Gratuity</div>
              <div className="text-xs font-bold text-gray-700 uppercase text-center">Cash Gratuity</div>
              <div className="text-xs font-bold text-gray-700 uppercase text-center">Points</div>
            </div>
            <div className="grid grid-cols-6 gap-4">
              <input type="text" className="bg-white rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 text-right" value={formatNumber(totals.netSales)} readOnly tabIndex={-1} />
              <input type="text" className="bg-white rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 text-right" value={formatNumber(totals.ccSales)} readOnly tabIndex={-1} />
              <input type="text" className="bg-white rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 text-right" value={formatNumber(totals.cashSales)} readOnly tabIndex={-1} />
              <input type="text" className="bg-white rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 text-right" value={formatNumber(totals.ccGratuity)} readOnly tabIndex={-1} />
              <input type="text" className="bg-white rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 text-right" value={formatNumber(totals.cashGratuity)} readOnly tabIndex={-1} />
              <input type="text" className="bg-white rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 text-right" value={formatNumber(totals.points)} readOnly tabIndex={-1} />
            </div>
          </div>
        </div>

        {/* SALES AND EMPLOYEES DETAILS TABLE */}
        <div className="mt-8">
          <h3 className="font-bold text-xl mb-4 uppercase">SALES AND EMPLOYEES DETAILS</h3>
          <div className="bg-white rounded-xl p-4">
            <table className="min-w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-black text-white">
                  <th className="px-4 py-2 font-bold uppercase text-left">EMPLOYEE</th>
                  <th className="px-4 py-2 font-bold uppercase text-left">POSITION</th>
                  <th className="px-4 py-2 font-bold uppercase text-right">NET SALES</th>
                  <th className="px-4 py-2 font-bold uppercase text-right">CASH SALES</th>
                  <th className="px-4 py-2 font-bold uppercase text-right">CC SALES</th>
                  <th className="px-4 py-2 font-bold uppercase text-right">CC GRATUITY</th>
                  <th className="px-4 py-2 font-bold uppercase text-right">CASH GRATUITY</th>
                  <th className="px-4 py-2 font-bold uppercase text-right">POINTS</th>
                  <th className="px-4 py-2 font-bold uppercase text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-300">
                    <td className="px-2 py-1">
                      {row.isNew ? (
                        <select
                          className="w-44 border rounded px-2 py-1 uppercase bg-gray-50"
                          value={row.employee || ""}
                          onChange={e => {
                            const empId = e.target.value;
                            const emp = fohActive.find((emp: any) => emp.id === empId);
                            setRows(prev => prev.map((r, i) =>
                              i === idx
                                ? {
                                    ...r,
                                    employee: emp?.id || "",
                                    employee_name: emp?.name?.toUpperCase() || "",
                                    position: emp?.position_name?.toUpperCase() || "",
                                    position_id: emp?.position_id || "",
                                  }
                                : r
                            ));
                          }}
                        >
                          <option value="">SELECT EMPLOYEE</option>
                          {fohActive.length > 0 && (
                            <optgroup label="ALL ACTIVE FOH">
                              {fohActive.map((emp: any) => (
                                <option key={emp.id} value={emp.id}>{emp.name?.toUpperCase()}</option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      ) : (
                        <span className="uppercase">{row.employee_name}</span>
                      )}
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="w-32 border rounded px-2 py-1 uppercase bg-gray-50"
                        value={row.position}
                        onChange={e => handleRowChange(idx, "position", e.target.value.toUpperCase())}
                        placeholder="POSITION"
                        disabled={!row.isNew}
                      />
                    </td>
                    <td className="px-2 py-1 text-right">
                      <input
                        className="w-20 border rounded px-2 py-1 text-right bg-gray-50 appearance-none"
                        style={{ MozAppearance: 'textfield' }}
                        inputMode="decimal"
                        pattern="^\\d*(\\.\\d{0,2})?$"
                        value={row.netSales ?? ''}
                        onChange={e => handleRowChange(idx, "netSales", e.target.value)}
                        onBlur={e => handleRowChange(idx, "netSales", e.target.value !== '' ? Number(parseFloat(e.target.value).toFixed(2)) : '')}
                        placeholder="$0.00"
                      />
                    </td>
                    <td className="px-2 py-1 text-right">
                      <input
                        className="w-20 border rounded px-2 py-1 text-right bg-gray-50 appearance-none"
                        style={{ MozAppearance: 'textfield' }}
                        inputMode="decimal"
                        pattern="^\\d*(\\.\\d{0,2})?$"
                        value={row.cashSales ?? ''}
                        onChange={e => handleRowChange(idx, "cashSales", e.target.value)}
                        onBlur={e => handleRowChange(idx, "cashSales", e.target.value !== '' ? Number(parseFloat(e.target.value).toFixed(2)) : '')}
                        placeholder="$0.00"
                      />
                    </td>
                    <td className="px-2 py-1 text-right">
                      <input
                        className="w-20 border rounded px-2 py-1 text-right bg-gray-50 appearance-none"
                        style={{ MozAppearance: 'textfield' }}
                        inputMode="decimal"
                        pattern="^\\d*(\\.\\d{0,2})?$"
                        value={row.ccSales ?? ''}
                        onChange={e => handleRowChange(idx, "ccSales", e.target.value)}
                        onBlur={e => handleRowChange(idx, "ccSales", e.target.value !== '' ? Number(parseFloat(e.target.value).toFixed(2)) : '')}
                        placeholder="$0.00"
                      />
                    </td>
                    <td className="px-2 py-1 text-right">
                      <input
                        className="w-20 border rounded px-2 py-1 text-right bg-gray-50 appearance-none"
                        style={{ MozAppearance: 'textfield' }}
                        inputMode="decimal"
                        pattern="^\\d*(\\.\\d{0,2})?$"
                        value={row.ccGratuity ?? ''}
                        onChange={e => handleRowChange(idx, "ccGratuity", e.target.value)}
                        onBlur={e => handleRowChange(idx, "ccGratuity", e.target.value !== '' ? Number(parseFloat(e.target.value).toFixed(2)) : '')}
                        placeholder="$0.00"
                      />
                    </td>
                    <td className="px-2 py-1 text-right">
                      <input
                        className="w-20 border rounded px-2 py-1 text-right bg-gray-50 appearance-none"
                        style={{ MozAppearance: 'textfield' }}
                        inputMode="decimal"
                        pattern="^\\d*(\\.\\d{0,2})?$"
                        value={row.cashGratuity ?? ''}
                        onChange={e => handleRowChange(idx, "cashGratuity", e.target.value)}
                        onBlur={e => handleRowChange(idx, "cashGratuity", e.target.value !== '' ? Number(parseFloat(e.target.value).toFixed(2)) : '')}
                        placeholder="$0.00"
                      />
                    </td>
                    <td className="px-2 py-1 text-right">
                      <input
                        className="w-16 border rounded px-2 py-1 text-right bg-gray-50 appearance-none"
                        style={{ MozAppearance: 'textfield' }}
                        inputMode="decimal"
                        pattern="^\\d*(\\.\\d{0,2})?$"
                        value={row.points ?? ''}
                        onChange={e => handleRowChange(idx, "points", e.target.value)}
                        onBlur={e => handleRowChange(idx, "points", e.target.value !== '' ? Number(parseFloat(e.target.value).toFixed(2)) : '')}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-2 py-1 text-center align-middle bg-white">
                      <button
                        type="button"
                        className="text-red-600 font-bold hover:underline px-3 py-1 rounded transition"
                        style={{ minWidth: 70, display: 'inline-block' }}
                        onClick={() => handleRemoveRow(idx)}
                        disabled={rows.length === 1}
                      >
                        DELETE
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="border-t border-gray-400 bg-gray-50 font-bold">
                  <td className="px-2 py-2 text-left uppercase" colSpan={2}>TOTALS</td>
                  <td className="px-2 py-2 text-right">${Number(totals.netSales).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                  <td className="px-2 py-2 text-right">${Number(totals.cashSales).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                  <td className="px-2 py-2 text-right">${Number(totals.ccSales).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                  <td className="px-2 py-2 text-right">${Number(totals.ccGratuity).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                  <td className="px-2 py-2 text-right">${Number(totals.cashGratuity).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                  <td className="px-2 py-2 text-right">{Number(totals.points).toLocaleString(undefined, {maximumFractionDigits:2})}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            <button
              type="button"
              className="mt-4 px-5 py-2 bg-black text-white rounded-full font-bold text-base hover:bg-neutral-800 transition"
              onClick={handleAddRow}
            >
              + ADD EMPLOYEE
            </button>
          </div>
        </div>

        {/* GRATUITY DISTRIBUTION TABLE */}
        <div className="mt-8">
          <h3 className="font-bold text-xl mb-4 uppercase">GRATUITY DISTRIBUTION</h3>
          <div className="bg-white rounded-xl p-4">
            <table className="min-w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-black text-white">
                  <th className="px-4 py-2 font-bold uppercase text-left">EMPLOYEE</th>
                  <th className="px-4 py-2 font-bold uppercase text-left">POSITION</th>
                  <th className="px-4 py-2 font-bold uppercase text-right">CC GRATUITY</th>
                  <th className="px-4 py-2 font-bold uppercase text-right">CASH GRATUITY</th>
                  <th className="px-4 py-2 font-bold uppercase text-right">POINTS</th>
                  <th className="px-4 py-2 font-bold uppercase text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {gratuityRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-300">
                    <td className="px-2 py-1">{row.employee}</td>
                    <td className="px-2 py-1">{row.position}</td>
                    <td className="px-2 py-1 text-right">${formatNumber(row.ccGratuity)}</td>
                    <td className="px-2 py-1 text-right">${formatNumber(row.cashGratuity)}</td>
                    <td className="px-2 py-1 text-right">{row.points}</td>
                    <td className="px-2 py-1 text-right">{row.percent.toFixed(2)}%</td>
                  </tr>
                ))}
                <tr className="border-t border-gray-400 bg-gray-50 font-bold">
                  <td className="px-2 py-2 text-left uppercase" colSpan={2}>TOTALS</td>
                  <td className="px-2 py-2 text-right">${formatNumber(totalCCGratuity)}</td>
                  <td className="px-2 py-2 text-right">${formatNumber(totalCashGratuity)}</td>
                  <td className="px-2 py-2 text-right">{totalPoints}</td>
                  <td className="px-2 py-2 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Debug info: BU y FOH activos */}
      <div className="text-xs text-gray-500 text-center mt-2">
        <div>BU ID original: <span className="font-mono">{initialData?.business_unit_id || "(none)"}</span></div>
        <div>BU ID limpio usado: <span className="font-mono">{String(initialData?.business_unit_id).split(":")[0]}</span></div>
        <div>FOH activos encontrados: <span className="font-mono">{fohActive.length}</span></div>
        <div className="mt-2 text-left max-w-2xl mx-auto break-all">
          <b>FOH RAW DATA:</b>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto" style={{maxHeight:200}}>{JSON.stringify(fohRaw, null, 2)}</pre>
        </div>
      </div>
      {error && <div className="text-red-600 font-bold text-center">{error}</div>}
      {success && <div className="text-green-600 font-bold text-center">Guardado correctamente.</div>}
      <button type="submit" className="w-full py-2 rounded bg-black text-white font-bold hover:bg-neutral-800 transition-colors mt-4" disabled={loading}>
        {loading ? "Guardando..." : mode === "edit" ? "GUARDAR CAMBIOS" : "CREAR CLOSEOUT"}
      </button>
    </form>
  );
};

export default CloseoutForm;
