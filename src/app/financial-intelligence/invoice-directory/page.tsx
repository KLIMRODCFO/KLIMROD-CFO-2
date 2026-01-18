"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";

const columns = [
  { key: "vendor_user", label: "INVOICE VENDOR" },
  { key: "week_code", label: "WEEK" },
  { key: "invoice_date", label: "INVOICE DATE" },
  { key: "due_date", label: "INVOICE DUE" },
  { key: "invoice_total", label: "TOTAL" },
  { key: "adjustment", label: "ADJUST" },
  { key: "after_adjustment", label: "AFTER ADJUSTMENT" },
  { key: "paid", label: "PAID" },
  { key: "actions", label: "ACTIONS" },
];

export default function InvoiceDirectoryPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    week: "",
    from: "",
    to: "",
    vendor: "",
  });
  const { activeBU } = require("../../ActiveBUContext").useActiveBU();

  useEffect(() => {
    async function fetchInvoices() {
      let query = supabase.from("master_invoices").select("*", { count: "exact" });
      if (activeBU) query = query.eq("business_unit_id", activeBU);
      if (filters.week) query = query.eq("week_code", filters.week);
      if (filters.vendor) query = query.ilike("vendor_user", `%${filters.vendor}%`);
      if (filters.from) query = query.gte("invoice_date", filters.from);
      if (filters.to) query = query.lte("invoice_date", filters.to);
      const { data, error } = await query.order("invoice_date", { ascending: false });
      if (!error) setInvoices(data || []);
    }
    fetchInvoices();
  }, [filters, activeBU]);

  return (
    <div className="min-h-screen bg-[#f6f7f9] p-8">
      {/* Filtros */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6 mb-8 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-bold mb-1">WEEK</label>
          <input type="text" className="w-32 bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs" value={filters.week} onChange={e => setFilters(f => ({ ...f, week: e.target.value }))} placeholder="WEEK" />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">FROM</label>
          <input type="date" className="w-36 bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">TO</label>
          <input type="date" className="w-36 bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">VENDOR</label>
          <input type="text" className="w-40 bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs" value={filters.vendor} onChange={e => setFilters(f => ({ ...f, vendor: e.target.value }))} placeholder="VENDOR" />
        </div>
      </div>
      {/* Tabla */}
      <div className="max-w-7xl mx-auto">
        <table className="w-full bg-white rounded-xl overflow-hidden shadow text-sm">
          <thead>
            <tr className="bg-black text-white uppercase text-xs">
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-center whitespace-nowrap font-bold">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} className="border-b hover:bg-gray-50 text-center">
                <td className="px-4 py-2">{inv.vendor_user}</td>
                <td className="px-4 py-2">{inv.week_code}</td>
                <td className="px-4 py-2">{inv.invoice_date}</td>
                <td className="px-4 py-2">{inv.due_date}</td>
                <td className="px-4 py-2 font-bold">${Number(inv.invoice_total).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                <td className="px-4 py-2">{inv.adjustment}</td>
                <td className="px-4 py-2">{inv.after_adjustment}</td>
                <td className="px-4 py-2">
                  <input type="checkbox" checked={!!inv.paid} readOnly className="accent-black w-4 h-4" />
                </td>
                <td className="px-4 py-2">
                  <button className="bg-black text-white px-4 py-1 rounded font-bold text-xs">View/Edit</button>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-gray-400">No invoices found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
