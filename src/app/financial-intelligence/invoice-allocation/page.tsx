"use client";

import { useState, useRef, useEffect } from "react";
import { useActiveBU } from "../../ActiveBUContext";
import { getWeekCode } from "../../../../utils/getWeekCode";
import { supabase } from "../../../../lib/supabaseClient";

type GeneralInfo = {
  vendor_ai: string;
  invoice_date: string;
  due_date: string;
  bill_number: string;
  terms: string;
};

type InvoiceItem = {
  product_ai: string;
  amount: string;
  item: string;
  qty: string;
  units: string;
  unit_price: string;
  category: string;
  discrepancies: string;
};

const INITIAL_GENERAL_INFO: GeneralInfo = {
  vendor_ai: "",
  invoice_date: "",
  due_date: "",
  bill_number: "",
  terms: "",
};

const INITIAL_ITEMS: InvoiceItem[] = [];

export default function InvoiceAllocationPage() {
  const { activeBU } = useActiveBU();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<number>(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generalInfo, setGeneralInfo] = useState<GeneralInfo>(INITIAL_GENERAL_INFO);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [tax, setTax] = useState<number | null>(null);
  const [shipping, setShipping] = useState<number | null>(null);
  const [adjustment, setAdjustment] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userVendor, setUserVendor] = useState<string>('');

  // Cálculo del total de la factura
  const invoiceTotal = items.reduce((sum, item) => {
    const val = typeof item.amount === 'string' ? parseFloat(item.amount.replace(/[^\d.-]/g, '')) : Number(item.amount);
    return sum + (isNaN(val) ? 0 : val);
  }, 0) + (tax ?? 0) + (shipping ?? 0) - (adjustment ?? 0);

  // afterAdjustment se calcula restando el ajuste del total de la factura
  const afterAdjustment = invoiceTotal - (adjustment ?? 0);

  // Obtener la fecha de inicio del BU activo desde Supabase para calcular weekCode
  const [weekCode, setWeekCode] = useState('');
  useEffect(() => {
    const fetchStartDateAndSetWeekCode = async () => {
      if (activeBU && generalInfo.invoice_date) {
        try {
          const { data: buData, error: buError } = await supabase
            .from('master_business_units')
            .select('week1_start_date')
            .eq('id', activeBU)
            .single();
          if (buError || !buData || !buData.week1_start_date) throw new Error('No se pudo obtener la fecha de inicio del BU');
          setWeekCode(getWeekCode(buData.week1_start_date, generalInfo.invoice_date));
        } catch {
          setWeekCode('');
        }
      } else {
        setWeekCode('');
      }
    };
    fetchStartDateAndSetWeekCode();
  }, [activeBU, generalInfo.invoice_date]);

  // File upload and OpenAI extraction
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setShowModal(true);
    setImageLoaded(false);
    setLoading(true);
    setError(null);
    setProgress(20);
    progressRef.current = 20;

    // Procesar todas las imágenes seleccionadas
    const base64Images: string[] = [];
    let processed = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        base64Images[i] = `data:${file.type};base64,${base64}`;
        processed++;
        if (processed === files.length) {
          // Cuando todas las imágenes estén listas, enviar al backend
          setProgress(70);
          progressRef.current = 70;
          try {
            const res = await fetch("/api/extract-invoice-ai", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ base64Images }),
            });
            setProgress(85);
            progressRef.current = 85;
            const data = await res.json();
            if (data && data.data && data.data.generalInfo && data.data.items) {
              setGeneralInfo(data.data.generalInfo);
              setItems(Array.isArray(data.data.items) ? data.data.items : []);
            } else {
              setError("No se pudo extraer información de la factura.");
            }
            setProgress(100);
            progressRef.current = 100;
            setImageLoaded(true);
            setTimeout(() => {
              setShowModal(false);
              setImageLoaded(false);
              setProgress(0);
            }, 1200);
          } catch (err: any) {
            setError(err.message || "Error extracting invoice");
            setShowModal(false);
            setImageLoaded(false);
            setProgress(0);
          } finally {
            setLoading(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Edición de items
  const handleItemChange = (idx: number, field: keyof InvoiceItem, value: string) => {
    setItems(items =>
      items.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      )
    );
  };

  // Envío de la factura (placeholder)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBU) {
      alert("You must select a Business Unit before submitting an invoice.");
      console.error("[INVOICE SUBMIT] No activeBU:", activeBU);
      return;
    }
    // Obtener la fecha de inicio del BU activo desde Supabase
    let weekCode = '';
    let startDate = '';
    try {
      if (activeBU && generalInfo.invoice_date) {
        const { data: buData, error: buError } = await supabase
          .from('master_business_units')
          .select('week1_start_date')
          .eq('id', activeBU)
          .single();
        if (buError || !buData || !buData.week1_start_date) throw new Error('No se pudo obtener la fecha de inicio del BU');
        startDate = buData.week1_start_date;
        weekCode = getWeekCode(startDate, generalInfo.invoice_date);
      }
    } catch (e) {
      weekCode = '';
    }
    // Prepara el payload de la factura
    const invoicePayload = {
      business_unit_id: activeBU,
      week_code: weekCode,
      vendor_ai: generalInfo.vendor_ai,
      vendor_user: userVendor,
        invoice_date: generalInfo.invoice_date && generalInfo.invoice_date.trim() !== '' ? generalInfo.invoice_date : null,
        due_date: generalInfo.due_date && generalInfo.due_date.trim() !== '' ? generalInfo.due_date : null,
      bill_number: generalInfo.bill_number,
      terms: generalInfo.terms,
      subtotal: items.reduce((sum, item) => {
        const val = typeof item.amount === 'string' ? parseFloat(item.amount.replace(/[^\d.-]/g, '')) : Number(item.amount);
        return sum + (isNaN(val) ? 0 : val);
      }, 0),
      tax,
      shipping,
      adjustment,
      invoice_total: invoiceTotal,
      after_adjustment: afterAdjustment,
    };
    // Inserta la factura
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('master_invoices')
      .insert([invoicePayload])
      .select('id')
      .single();
    if (invoiceError) {
      alert('Error saving invoice: ' + invoiceError.message);
      return;
    }
    // Inserta los items
    const itemsPayload = items.map(item => ({
      invoice_id: invoiceData.id,
      product_ai: item.product_ai,
      item: item.item,
      qty: item.qty,
      units: item.units,
      unit_price: item.unit_price && typeof item.unit_price === 'string' ? parseFloat(item.unit_price.replace(/[^\d.-]/g, '')) : Number(item.unit_price),
      amount: item.amount && typeof item.amount === 'string' ? parseFloat(item.amount.replace(/[^\d.-]/g, '')) : Number(item.amount),
      category: item.category,
      discrepancies: item.discrepancies,
      week_code: weekCode,
    }));
    const { error: itemsError } = await supabase
      .from('master_invoices_items')
      .insert(itemsPayload);
    if (itemsError) {
      alert('Error saving invoice items: ' + itemsError.message);
      return;
    }
    // Mostrar mensaje de éxito y resetear todo
    alert('INVOICE SUBMITTED');
    setGeneralInfo(INITIAL_GENERAL_INFO);
    setItems(INITIAL_ITEMS);
    setTax(null);
    setShipping(null);
    setAdjustment(null);
    setUserVendor("");
    setSelectedFile(null);
    setShowModal(false);
    setProgress(0);
    setImageLoaded(false);
    setError(null);
  };

  if (!activeBU) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f7f9]">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-2xl font-bold mb-4">No Business Unit Selected</h2>
          <p className="text-gray-600">Please select a Business Unit to use the Invoice Allocation page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <div className="w-full flex justify-center pt-10">
        <div className="w-full">
          <h1 className="text-4xl font-bold mb-2 uppercase">INVOICE ALLOCATION</h1>
          {/* {activeBU && <div className="mb-4 text-right text-xs text-gray-500">Business Unit: {activeBU.name}</div>} */}
          <div className="bg-white rounded shadow p-8 w-full max-w-full">
            <form onSubmit={handleSubmit}>
              {/* INVOICE SCANNER */}
              <div className="mb-6">
                <h2 className="font-bold text-lg mb-2 uppercase">INVOICE SCANNER</h2>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="ml-2 px-4 py-2 bg-black text-white rounded disabled:opacity-50 font-bold"
                >
                  {loading ? "Processing..." : "UPLOAD IMAGE"}
                </button>
                {showModal && (
                  <div className="mt-4 w-full max-w-md mx-auto">
                    <div className="bg-white border border-gray-200 rounded-lg shadow p-4 flex flex-col items-center">
                      {!imageLoaded ? (
                        <>
                          <div className="mb-2 text-base font-bold text-gray-800 tracking-widest text-center uppercase">LOADING IMAGE...</div>
                          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                            <div
                              className="h-full bg-gray-900 transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 w-full text-right">{Math.round(progress)}%</div>
                        </>
                      ) : (
                        <>
                          <div className="mb-2 flex flex-col items-center">
                            <svg className="w-10 h-10 text-green-500 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            <div className="text-green-600 font-bold uppercase">IMAGE LOADED</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {/* GENERAL INFORMATION */}
              <h2 className="font-bold text-lg mb-2 uppercase">GENERAL INFORMATION</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                {/* Sección izquierda: datos AI */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">INVOICE VENDOR (AI)</label>
                    <input type="text" className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs font-bold tracking-wide" value={generalInfo.vendor_ai ? generalInfo.vendor_ai.toUpperCase() : ''} readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">INVOICE VENDOR</label>
                    <input type="text" className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs font-bold tracking-wide" value={userVendor} onChange={e => setUserVendor(e.target.value.toUpperCase())} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">INVOICE DATE</label>
                    <input type="text" className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs" value={generalInfo.invoice_date} readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">INVOICE DUE</label>
                    <input type="text" className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs" value={generalInfo.due_date} readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">INVOICE NUMBER</label>
                    <input type="text" className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs" value={generalInfo.bill_number} readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">TERMS</label>
                    <input type="text" className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs" value={generalInfo.terms} readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 mt-6">DISCREPANCIES</label>
                    <div className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-2 text-xs">
                      {(() => {
                        const discrepancies = items.filter(item => item.discrepancies && item.discrepancies.trim() !== '');
                        if (!discrepancies.length) return <span className="text-gray-400">No discrepancies</span>;
                        return (
                          <table className="w-full text-xs">
                            <tbody>
                              {discrepancies.map((item, idx) => (
                                <tr key={idx} className="align-top">
                                  <td className="font-bold pr-2 align-top whitespace-nowrap" style={{ width: '40%' }}>{item.product_ai ? item.product_ai.toUpperCase() : 'PRODUCT'}</td>
                                  <td className="pl-2 text-gray-700 align-top">{item.discrepancies}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                {/* Sección derecha: totales y campos editables */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">SUBTOTAL</label>
                    <input type="text" className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs font-bold text-right" value={items.length > 0 ? items.reduce((sum, item) => { const val = typeof item.amount === 'string' ? parseFloat(item.amount.replace(/[^\d.-]/g, '')) : Number(item.amount); return sum + (isNaN(val) ? 0 : val); }, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''} readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">TAX</label>
                    <input type="number" step="any" className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs text-right" value={tax ?? ''} onChange={e => setTax(Number(e.target.value))} min={0} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">SHIPPING</label>
                    <input type="number" className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs text-right" value={shipping ?? ''} onChange={e => setShipping(Number(e.target.value))} min={0} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">INVOICE TOTAL</label>
                    <input type="text" className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs font-bold text-right" value={invoiceTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">ADJUSTMENT</label>
                    <input type="number" className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs text-right" value={adjustment ?? ''} onChange={e => setAdjustment(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">AFTER ADJUSTMENT</label>
                    <input type="text" className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs font-bold text-right" value={afterAdjustment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} readOnly />
                  </div>
                  {/* DISCREPANCIES section styled as a table, above CATEGORY SUMMARY */}
                  <div>
                    <label className="block text-xs font-bold mb-1 mt-6">CATEGORY SUMMARY</label>
                    <div className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs font-bold tracking-wide">
                      {(() => {
                        if (!items.length) return <span className="text-gray-400">No items</span>;
                        const totals: Record<string, number> = {};
                        let grandTotal = 0;
                        items.forEach(item => {
                          const cat = item.category ? item.category.toUpperCase() : 'UNCATEGORIZED';
                          const val = typeof item.amount === 'string' ? parseFloat(item.amount.replace(/[^\d.-]/g, '')) : Number(item.amount);
                          if (!isNaN(val)) {
                            totals[cat] = (totals[cat] || 0) + val;
                            grandTotal += val;
                          }
                        });
                        return (
                          <div className="space-y-1">
                            {Object.entries(totals).map(([cat, val]) => (
                              <div key={cat} className="flex justify-between">
                                <span>{cat}</span>
                                <span>
                                  ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  {' '}(
                                  {grandTotal > 0 ? ((val / grandTotal) * 100).toFixed(1) : '0.0'}%
                                  )
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
              {/* INVOICE ITEMS */}
              <h2 className="font-bold text-lg mb-2 uppercase mt-8">INVOICE ITEMS</h2>
              <div className="rounded-xl overflow-hidden border-2 border-gray-300 bg-white mb-8" style={{ minHeight: 340 }}>
                <div className="w-full max-w-[2200px] px-16 py-4">
                  <div className="flex flex-col items-center w-full">
                    <div className="w-full">
                      <table className="w-full bg-white text-sm">
                        <thead>
                          <tr className="bg-gray-100 text-black font-extrabold uppercase text-[15px]">
                            <th className="px-6 py-3 text-left whitespace-nowrap" style={{ width: '28%' }}>PRODUCT AI</th>
                            <th className="px-3 py-3 text-center whitespace-nowrap" style={{ width: '28%' }}>ITEM</th>
                            <th className="px-3 py-3 text-center whitespace-nowrap" style={{ width: '9%' }}>QTY</th>
                            <th className="px-3 py-3 text-center whitespace-nowrap" style={{ width: '9%' }}>UNITS</th>
                            <th className="px-3 py-3 text-center whitespace-nowrap" style={{ width: '8%' }}>UNIT PRICE</th>
                            <th className="px-3 py-3 text-center whitespace-nowrap" style={{ width: '4%' }}>AMOUNT</th>
                            <th className="px-3 py-3 text-center whitespace-nowrap" style={{ width: '30%' }}>CATEGORY</th>
                            <th className="px-3 py-3 text-center whitespace-nowrap" style={{ width: '12%' }}>DISCREPANCIES</th>
                            <th className="px-3 py-3 text-center whitespace-nowrap" style={{ width: '7%' }}>ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="text-center py-6 text-gray-400">No items</td>
                            </tr>
                          ) : (
                            <>
                              {items.map((item, idx) => (
                                <tr key={idx} className="border-t text-center hover:bg-gray-50">
                                  <td className="px-3 py-2">
                                    <input className="w-full px-4 py-1 rounded bg-[#f6f7f9] text-left" value={item.product_ai ? item.product_ai.toUpperCase() : ''} onChange={e => handleItemChange(idx, 'product_ai', e.target.value.toUpperCase())} />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input className="w-full px-2 py-1 rounded bg-[#f6f7f9] text-center" value={item.item ? item.item.toUpperCase() : ''} onChange={e => handleItemChange(idx, 'item', e.target.value.toUpperCase())} />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input className="w-full px-2 py-1 rounded bg-[#f6f7f9] text-center" value={item.qty ? String(item.qty).toUpperCase() : ''} onChange={e => handleItemChange(idx, 'qty', e.target.value.toUpperCase())} />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input className="w-full px-2 py-1 rounded bg-[#f6f7f9] text-center" value={item.units ? item.units.toUpperCase() : ''} onChange={e => handleItemChange(idx, 'units', e.target.value.toUpperCase())} />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input className="w-full px-2 py-1 rounded bg-[#f6f7f9] text-center" value={item.unit_price ? String(item.unit_price).toUpperCase() : ''} onChange={e => handleItemChange(idx, 'unit_price', e.target.value.toUpperCase())} />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input className="w-full px-2 py-1 rounded bg-[#f6f7f9] text-center font-bold" value={item.amount ? String(item.amount).toUpperCase() : ''} onChange={e => handleItemChange(idx, 'amount', e.target.value.toUpperCase())} />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input className="w-full px-2 py-1 rounded bg-[#f6f7f9] text-center" value={item.category ? item.category.toUpperCase() : ''} onChange={e => handleItemChange(idx, 'category', e.target.value.toUpperCase())} />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input className="w-full px-2 py-1 rounded bg-[#f6f7f9] text-center" value={item.discrepancies ? item.discrepancies.toUpperCase() : ''} onChange={e => handleItemChange(idx, 'discrepancies', e.target.value.toUpperCase())} />
                                  </td>
                                  <td className="px-3 py-2">
                                    <button type="button" className="text-red-500 font-bold px-2 uppercase text-[11px]" onClick={() => setItems(items.filter((_, i) => i !== idx))}>DELETE</button>
                                  </td>
                                </tr>
                              ))}
                              {/* SUBTOTAL row */}
                              <tr className="bg-gray-100 font-bold">
                                <td colSpan={5}></td>
                                <td className="px-3 py-2 text-right align-middle font-bold" style={{ width: '14%' }}>
                                  <span className="pr-2">SUBTOTAL</span>
                                  {(() => {
                                    const subtotal = items.reduce((sum, item) => {
                                      const val = typeof item.amount === 'string' ? parseFloat(item.amount.replace(/[^\d.-]/g, '')) : Number(item.amount);
                                      return sum + (isNaN(val) ? 0 : val);
                                    }, 0);
                                    return subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                  })()}
                                </td>
                                <td colSpan={3}></td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              {/* ADD PRODUCT button below table, left-aligned */}
              <div className="flex justify-start mt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-black text-white rounded font-bold text-xs shadow hover:bg-gray-800 transition-all duration-150"
                  onClick={() => setItems([...items, { product_ai: '', amount: '', item: '', qty: '', units: '', unit_price: '', category: '', discrepancies: '' }])}
                >
                  + ADD PRODUCT
                </button>
              </div>
              {/* SUBMIT INVOICE button for the page - moved inside the form */}
              <div className="flex justify-center mt-8">
                <button
                  type="submit"
                  className="px-6 py-2 bg-black text-white rounded font-bold text-base shadow hover:bg-gray-900 transition-all duration-150"
                  style={{ minWidth: 140 }}
                  disabled={loading}
                >
                  SUBMIT INVOICE
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
