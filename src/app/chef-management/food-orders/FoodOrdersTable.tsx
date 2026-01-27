import { useState, useEffect } from "react";
import { useUser } from "../../UserContext";
import { getWeekCode } from "../../../../utils/getWeekCode";
import { FoodGodAutocomplete } from "../../inventory/FoodGodAutocomplete";
import { supabase } from "../../../../lib/supabaseClient";
import { useActiveBU } from "../../ActiveBUContext";

export default function FoodOrdersTable() {
  const { user } = useUser();
  // Estado para vendor y fecha
  const [vendor, setVendor] = useState("");
  const [vendorLocked, setVendorLocked] = useState(false);
  const [orderDate, setOrderDate] = useState("");
  const [vendors, setVendors] = useState<{ id: string; vendor_dba: string }[]>([]);
  const { activeBU } = useActiveBU();

  // Obtener vendors de Supabase filtrados por BU activo
  useEffect(() => {
    if (!activeBU) {
      setVendors([]);
      setVendor("");
      return;
    }
    supabase
      .from("vendors")
      .select("id, vendor_dba, bu_id")
      .eq("bu_id", activeBU)
      .then(({ data }) => {
        if (data) setVendors(data);
        setVendor("");
      });
  }, [activeBU]);

  // Categorías
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    supabase
      .from("master_category")
      .select("id, name")
      .in("name", ["FOOD", "SUPPLIES"])
      .then(({ data }) => {
        if (data) setCategories(data);
      });
  }, []);

  // Item name y variety
  const [itemName, setItemName] = useState("");
  const [itemId, setItemId] = useState("");
  const [variety, setVariety] = useState("");
  const [varietyOptions, setVarietyOptions] = useState<string[]>([]);
  useEffect(() => {
    if (category !== "FOOD" || !itemName || !activeBU) {
      setVarietyOptions([]);
      setVariety("");
      return;
    }
    supabase
      .from("master_inventory_food")
      .select("variety")
      .eq("item_name", itemName)
      .eq("bu_id", activeBU)
      .then(({ data }) => {
        if (data) {
          const uniqueVarieties = Array.from(new Set(data.map((row: any) => row.variety).filter(Boolean)));
          setVarietyOptions(uniqueVarieties);
          if (!uniqueVarieties.includes(variety)) setVariety("");
        } else {
          setVarietyOptions([]);
          setVariety("");
        }
      });
  }, [itemName, activeBU, category]);

  // UOMs
  const [uom, setUom] = useState("");
  const [uoms, setUoms] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    supabase
      .from("master_uom")
      .select("id, name")
      .then(({ data }) => {
        if (data) setUoms(data);
      });
  }, []);

  // Otros campos
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [submitError, setSubmitError] = useState("");

  const handleAddItem = () => {
    setItems([
      ...items,
      { category, itemName, variety, uom, qty, notes }
    ]);
    setCategory(""); setItemName(""); setVariety(""); setUom(""); setQty(""); setNotes("");
  };

  // Limpiar toda la orden
  const handleStartNewOrder = () => {
    setVendor("");
    setVendorLocked(false);
    setOrderDate("");
    setCategory("");
    setItemName("");
    setItemId("");
    setVariety("");
    setUom("");
    setQty("");
    setNotes("");
    setItems([]);
  };

  // Placeholder para enviar la orden
  const handleSubmitOrder = async () => {
    if (!orderDate) {
      setSubmitError("Debes ingresar la fecha de la orden antes de enviar.");
      return;
    }
    if (!user?.id) {
      setSubmitError("No se pudo identificar el usuario actual.");
      return;
    }
    setSubmitError("");
    // 1. Obtener week1_start_date de la BU activa
    const { data: buData, error: buError } = await supabase
      .from("master_business_units")
      .select("week1_start_date")
      .eq("id", activeBU)
      .single();
    if (buError || !buData?.week1_start_date) {
      setSubmitError("No se pudo obtener la fecha de apertura de la unidad de negocio.");
      return;
    }
    const buOpenDate = buData.week1_start_date;
    // 2. Calcular week_code
    let weekCode = "";
    try {
      weekCode = getWeekCode(buOpenDate, orderDate);
    } catch (e) {
      setSubmitError("Error al calcular el week code: " + (e as Error).message);
      return;
    }
    // 3. Guardar la orden principal
    const { data: orderData, error: orderError } = await supabase
      .from("master_orders_food_supplies")
      .insert([
        {
          order_date: orderDate,
          week_code: weekCode,
          user_id: user.id,
          vendor_id: vendor,
          bu_id: activeBU,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ])
      .select("id")
      .single();
    if (orderError || !orderData?.id) {
      setSubmitError("No se pudo guardar la orden principal: " + (orderError?.message || ""));
      return;
    }
    const orderId = orderData.id;
    // 4. Guardar los items de la orden
    if (items.length > 0) {
      const itemsToInsert = items.map(item => ({
        order_id: orderId,
        category: item.category,
        item_name: item.itemName,
        variety: item.variety,
        uom: item.uom,
        qty: item.qty,
        notes: item.notes,
      }));
      const { error: itemsError } = await supabase
        .from("master_orders_food_supplies_items")
        .insert(itemsToInsert);
      if (itemsError) {
        setSubmitError("No se pudieron guardar los items: " + itemsError.message);
        return;
      }
    }
    // 5. Limpiar todos los campos para nueva orden
    setVendor("");
    setVendorLocked(false);
    setOrderDate("");
    setCategory("");
    setItemName("");
    setItemId("");
    setVariety("");
    setUom("");
    setQty("");
    setNotes("");
    setItems([]);
    alert("¡Orden enviada correctamente!");
  };

  return (
    <div className="max-w-5xl mx-auto py-10">
      {/* START NEW ORDER arriba a la izquierda */}
      <div className="w-full flex justify-start mb-6">
        <button
          onClick={handleStartNewOrder}
          className="bg-white border border-black text-black px-8 py-3 rounded-xl font-bold text-sm tracking-widest shadow hover:bg-neutral-100 transition-all"
          type="button"
        >
          START NEW ORDER
        </button>
      </div>
      <div className="bg-white/90 rounded-2xl shadow-2xl border border-neutral-200 p-10 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center justify-between">
          <div className="flex flex-col gap-1 w-full md:w-1/2">
            <label className="font-semibold text-neutral-700 text-xs mb-1 tracking-widest">VENDOR</label>
            <select
              value={vendor}
              onChange={e => {
                setVendor(e.target.value);
                if (e.target.value) setVendorLocked(true);
              }}
              className="rounded-xl border border-neutral-300 px-4 py-3 text-neutral-800 bg-white text-sm focus:ring-2 focus:ring-black/30 transition-all"
              disabled={vendorLocked}
            >
              <option value="">Select vendor</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id}>{v.vendor_dba}</option>
              ))}
            </select>
            {/* El mensaje de 'Change vendor' ha sido removido para UX más limpia */}
          </div>
          <div className="flex flex-col gap-1 w-full md:w-1/2">
            <label className="font-semibold text-neutral-700 text-xs mb-1 tracking-widest">ORDER DATE</label>
            <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="rounded-xl border border-neutral-300 px-4 py-3 text-neutral-800 bg-white text-sm focus:ring-2 focus:ring-black/30 transition-all" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-6 items-end">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-neutral-700 text-xs mb-1 tracking-widest">CATEGORY</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="rounded-xl border border-neutral-300 px-4 py-3 text-neutral-800 bg-white text-sm focus:ring-2 focus:ring-black/30 transition-all">
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-neutral-700 text-xs mb-1 tracking-widest">ITEM NAME</label>
            {category === "FOOD" && (
              <div>
                <FoodGodAutocomplete
                  activeBU={activeBU}
                  onSelect={item => {
                    if (item) {
                      setItemName(item.item_name);
                      setItemId(item.id);
                      setVariety("");
                    } else {
                      setItemName("");
                      setItemId("");
                      setVariety("");
                    }
                  }}
                />
              </div>
            )}
            {category === "SUPPLIES" && (
              <input
                disabled
                className="rounded-xl border border-neutral-200 px-4 py-3 w-full text-neutral-400 bg-neutral-100 text-sm"
                placeholder="Supplies autocomplete pending"
              />
            )}
            {!category && (
              <input
                disabled
                className="rounded-xl border border-neutral-200 px-4 py-3 w-full text-neutral-400 bg-neutral-100 text-sm"
                placeholder="Select category first"
              />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-neutral-700 text-xs mb-1 tracking-widest">VARIETY</label>
            <select
              value={variety}
              onChange={e => setVariety(e.target.value)}
              className="rounded-xl border border-neutral-300 px-4 py-3 text-neutral-800 bg-white text-sm focus:ring-2 focus:ring-black/30 transition-all"
              disabled={varietyOptions.length === 0}
            >
              <option value="">{varietyOptions.length === 0 ? "No variety" : "Select variety"}</option>
              {varietyOptions.map((v, i) => (
                <option key={i} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-neutral-700 text-xs mb-1 tracking-widest">UOM</label>
            <select
              value={uom}
              onChange={e => setUom(e.target.value)}
              className="rounded-xl border border-neutral-300 px-4 py-3 text-neutral-800 bg-white text-sm focus:ring-2 focus:ring-black/30 transition-all"
            >
              <option value="">Select UOM</option>
              {uoms.map(u => (
                <option key={u.id} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-neutral-700 text-xs mb-1 tracking-widest">QTY</label>
            <input
              type="number"
              value={qty}
              onChange={e => setQty(e.target.value)}
              className="rounded-xl border border-neutral-300 px-4 py-3 text-neutral-800 bg-white text-sm focus:ring-2 focus:ring-black/30 transition-all appearance-none"
              placeholder="Qty"
              style={{ appearance: 'none', MozAppearance: 'textfield', WebkitAppearance: 'none' }}
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-neutral-700 text-xs mb-1 tracking-widest">NOTES</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} className="rounded-xl border border-neutral-300 px-4 py-3 text-neutral-800 bg-white text-sm focus:ring-2 focus:ring-black/30 transition-all" placeholder="Notes" />
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-end gap-4 mt-2">
          <button
            onClick={handleAddItem}
            className="bg-black hover:bg-neutral-900 text-white px-8 py-3 rounded-xl font-bold text-sm tracking-widest shadow transition-all"
            type="button"
          >
            ADD NEW ITEM
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-neutral-200 shadow-sm mt-10">
        <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-neutral-900 text-white">
                <th className="px-4 py-3 font-semibold tracking-widest">CATEGORY</th>
                <th className="px-4 py-3 font-semibold tracking-widest">ITEM NAME</th>
                <th className="px-4 py-3 font-semibold tracking-widest">VARIETY</th>
                <th className="px-4 py-3 font-semibold tracking-widest">UOM</th>
                <th className="px-4 py-3 font-semibold tracking-widest">QTY</th>
                <th className="px-4 py-3 font-semibold tracking-widest">NOTES</th>
                <th className="px-4 py-3 font-semibold tracking-widest text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-neutral-400 font-semibold" colSpan={7}>
                    No items added yet
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx} className="border-b border-neutral-100 hover:bg-neutral-50 transition-all">
                    <td className="px-4 py-3 font-medium text-neutral-800">{item.category}</td>
                    <td className="px-4 py-3 font-medium text-neutral-800">{item.itemName}</td>
                    <td className="px-4 py-3 font-medium text-neutral-800">{item.variety}</td>
                    <td className="px-4 py-3 font-medium text-neutral-800">{item.uom}</td>
                    <td className="px-4 py-3 font-medium text-neutral-800">{item.qty}</td>
                    <td className="px-4 py-3 font-medium text-neutral-800">{item.notes}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        className="text-red-600 font-bold hover:underline text-xs uppercase tracking-widest"
                        onClick={() => setItems(items.filter((_, i) => i !== idx))}
                      >
                        DELETE
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>
      {/* Botón SUBMIT ORDER debajo de la tabla, centrado */}
      <div className="w-full flex flex-col items-center mt-8 mb-8">
        {submitError && (
          <div className="text-red-600 font-semibold mb-2 text-sm">{submitError}</div>
        )}
        <button
          onClick={handleSubmitOrder}
          className="bg-black hover:bg-neutral-900 text-white px-8 py-3 rounded-xl font-bold text-sm tracking-widest shadow transition-all"
          type="button"
        >
          SUBMIT ORDER
        </button>
      </div>
    </div>
  );
}
