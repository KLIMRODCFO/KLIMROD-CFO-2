
"use client";
import React, { useEffect, useState } from "react";

type Vendor = {
  id: string;
  vendor_dba: string;
  bu_id: string;
};

type Order = {
  id: string;
  order_date: string;
  week_code: string;
  vendor_id: string;
  bu_id: string;
  user_id: string;
  created_at: string;
  status: string;
};

type OrderItem = {
  category: string;
  item_name: string;
  variety: string;
  uom: string;
  qty: string;
  notes: string;
};
import { supabase } from "../../../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useActiveBU } from "../../ActiveBUContext";
import { useUser } from "../../UserContext";

function OrderDetailModal({ orderId, onClose, vendors: modalVendors }: { orderId: string, onClose: () => void, vendors: Vendor[] }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    supabase
      .from("master_orders_food_supplies")
      .select("*", { count: "exact" })
      .eq("id", orderId)
      .single()
      .then(({ data }) => {
        setOrder(data);
        if (data?.vendor_id) {
          const v = modalVendors.find(v => v.id === data.vendor_id);
          setVendor(v || null);
        }
      });
    supabase
      .from("master_orders_food_supplies_items")
      .select("category, item_name, variety, uom, qty, notes")
      .eq("order_id", orderId)
      .then(({ data }) => setItems(data || []));
    setLoading(false);
  }, [orderId, modalVendors]);

  if (!orderId) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 print:bg-white print:relative print-order-modal">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full relative print:shadow-none print:p-2">
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-black text-xl font-bold print:hidden">×</button>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold tracking-widest">ORDER DETAIL</h2>
          <button
            className="bg-black text-white px-4 py-2 rounded text-xs font-bold hover:bg-neutral-800 print:hidden"
            onClick={() => window.print()}
          >PRINT</button>
        </div>
        {loading || !order ? (
          <div className="p-8 text-center">Loading...</div>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-1 text-sm">
              <div><span className="font-bold">Vendor:</span> {vendor?.vendor_dba || order.vendor_id}</div>
              <div><span className="font-bold">Order Date:</span> {order.order_date}</div>
              <div><span className="font-bold">Week Code:</span> {order.week_code}</div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-neutral-200 shadow-sm print:shadow-none print:border">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-neutral-900 text-white">
                    <th className="px-4 py-2 font-semibold tracking-widest">CATEGORY</th>
                    <th className="px-4 py-2 font-semibold tracking-widest">ITEM NAME</th>
                    <th className="px-4 py-2 font-semibold tracking-widest">VARIETY</th>
                    <th className="px-4 py-2 font-semibold tracking-widest">UOM</th>
                    <th className="px-4 py-2 font-semibold tracking-widest">QTY</th>
                    <th className="px-4 py-2 font-semibold tracking-widest">NOTES</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-6 text-neutral-400 font-semibold">No items</td></tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx} className="border-b border-neutral-100">
                        <td className="px-4 py-2 font-medium text-neutral-800">{item.category}</td>
                        <td className="px-4 py-2 font-medium text-neutral-800">{item.item_name}</td>
                        <td className="px-4 py-2 font-medium text-neutral-800">{item.variety}</td>
                        <td className="px-4 py-2 font-medium text-neutral-800">{item.uom}</td>
                        <td className="px-4 py-2 font-medium text-neutral-800">{item.qty}</td>
                        <td className="px-4 py-2 font-medium text-neutral-800">{item.notes}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
// ...existing code...

  const router = useRouter();
  const { activeBU } = useActiveBU();
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  // const [loading, setLoading] = useState(false); // Removed duplicate declaration
  const [vendorFilter, setVendorFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showDetailId, setShowDetailId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeBU) return;
    supabase
      .from("vendors")
      .select("id, vendor_dba, bu_id")
      .eq("bu_id", activeBU)
      .then(({ data }) => {
        if (data) setVendors(data);
      });
  }, [activeBU]);

  useEffect(() => {
    if (!activeBU || !user?.id) return;
    setLoading(true);
    let query = supabase
      .from("master_orders_food_supplies")
      .select("id, order_date, week_code, vendor_id, bu_id, user_id, created_at, status")
      .eq("bu_id", activeBU)
      .order("order_date", { ascending: false });
    if (vendorFilter) query = query.eq("vendor_id", vendorFilter);
    if (dateFilter) query = query.eq("order_date", dateFilter);
    query.then(({ data }) => {
      setOrders(data || []);
      setLoading(false);
    });
  }, [activeBU, user, vendorFilter, dateFilter]);

  return (
    <div className="max-w-6xl mx-auto py-10">
      <div className="flex gap-4 mb-6 flex-wrap">
        <select
          className="border rounded px-3 py-2 text-sm"
          value={vendorFilter}
          onChange={e => setVendorFilter(e.target.value)}
        >
          <option value="">All Vendors</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>{v.vendor_dba}</option>
          ))}
        </select>
        <input
          type="date"
          className="border rounded px-3 py-2 text-sm"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-neutral-200 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-neutral-900 text-white">
              <th className="px-4 py-3 font-semibold tracking-widest">WEEK CODE</th>
              <th className="px-4 py-3 font-semibold tracking-widest">ORDER DATE</th>
              <th className="px-4 py-3 font-semibold tracking-widest">VENDOR</th>
              <th className="px-4 py-3 font-semibold tracking-widest">STATUS</th>
              <th className="px-4 py-3 font-semibold tracking-widest">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 font-bold">LOADING...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 font-bold">NO ORDERS FOUND</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-all">
                  <td className="px-4 py-3 font-medium text-neutral-800">{order.week_code}</td>
                  <td className="px-4 py-3 font-medium text-neutral-800">{order.order_date}</td>
                  <td className="px-4 py-3 font-medium text-neutral-800">{vendors.find(v => v.id === order.vendor_id)?.vendor_dba || order.vendor_id}</td>
                  <td className="px-4 py-3 font-medium text-neutral-800">{order.status}</td>
                  <td className="px-4 py-3">
                    <button
                      className="bg-black text-white px-4 py-2 rounded text-xs font-bold hover:bg-neutral-800"
                      onClick={() => setShowDetailId(order.id)}
                    >
                      VIEW / PRINT
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showDetailId && (
        <OrderDetailModal orderId={showDetailId} onClose={() => setShowDetailId(null)} vendors={vendors} />
      )}

    </div>
  );
}

export default OrdersDirectory;
