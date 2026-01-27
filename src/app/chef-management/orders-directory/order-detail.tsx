
"use client";
import { supabase } from "../../../../lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OrderDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");

  type Vendor = { vendor_dba: string };
  type Order = { vendor_id: string; order_date: string; week_code: string };
  type OrderItem = { category: string; item_name: string; variety: string; uom: string; qty: string; notes: string };

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    supabase
      .from("master_orders_food_supplies")
      .select("*, vendor_id")
      .eq("id", orderId)
      .single()
      .then(({ data }: { data: any }) => {
        setOrder(data);
        if (data?.vendor_id) {
          supabase
            .from("vendors")
            .select("vendor_dba")
            .eq("id", data.vendor_id)
            .single()
            .then(({ data: v }: { data: any }) => setVendor(v));
        }
      });
    supabase
      .from("master_orders_food_supplies_items")
      .select("category, item_name, variety, uom, qty, notes")
      .eq("order_id", orderId)
      .then(({ data }: { data: any }) => setItems(data || []));
    setLoading(false);
  }, [orderId]);

  if (!orderId) return <div className="p-8 text-center">No order selected.</div>;
  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!order) return <div className="p-8 text-center">Order not found.</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 mt-10 print:shadow-none print:p-2">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold tracking-widest">ORDER DETAIL</h2>
        <button
          className="bg-black text-white px-4 py-2 rounded text-xs font-bold hover:bg-neutral-800 print:hidden"
          onClick={() => window.print()}
        >PRINT</button>
      </div>
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
      <button
        className="mt-8 text-xs text-neutral-400 underline print:hidden"
        onClick={() => router.back()}
      >Back to Orders Directory</button>
    </div>
  );
}
