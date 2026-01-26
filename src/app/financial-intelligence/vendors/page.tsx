"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useActiveBU } from "../../ActiveBUContext";
import { useUser } from "../../UserContext";

type Vendor = {
  id: string;
  vendor_legal_name: string;
  vendor_dba?: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  tax_id?: string;
  created_at?: string;
};

export default function VendorsPage() {
  const { activeBU } = useActiveBU();
  const { user } = useUser();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    vendor_legal_name: "",
    vendor_dba: "",
    contact: "",
    email: "",
    phone: "",
    address: "",
    tax_id: "",
  });
  const [editingVendorId, setEditingVendorId] = useState<string|null>(null);
  const [editForm, setEditForm] = useState({
    vendor_legal_name: "",
    vendor_dba: "",
    contact: "",
    email: "",
    phone: "",
    address: "",
    tax_id: "",
  });

  // Fetch vendors by BU
  useEffect(() => {
    if (!activeBU) return;
    setLoading(true);
    supabase
      .from("vendors")
      .select("*")
      .eq("bu_id", activeBU)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setVendors(data || []);
        setLoading(false);
      });
  }, [activeBU]);

  // Handle form input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  // Handle edit form input
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vendors")
        .insert([{ ...form, bu_id: activeBU }]);
      if (error) throw error;

      // Refresh list
      const { data: newData } = await supabase
        .from("vendors")
        .select("*")
        .eq("bu_id", activeBU)
        .order("created_at", { ascending: false });
      setVendors(newData || []);
      setForm({
        vendor_legal_name: "",
        vendor_dba: "",
        contact: "",
        email: "",
        phone: "",
        address: "",
        tax_id: "",
      });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (vendor: Vendor, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase
        .from("vendors")
        .update({ ...editForm })
        .eq("id", vendor.id);

      // Refresh list
      const { data } = await supabase
        .from("vendors")
        .select("*")
        .eq("bu_id", activeBU)
        .order("created_at", { ascending: false });
      setVendors(data || []);
      setEditingVendorId(null);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] py-12 px-2 md:px-0 flex flex-col items-center w-full">
      <h1 className="text-4xl font-extrabold text-center mb-10 tracking-wide">VENDORS</h1>
      {/* Formulario centrado y angosto */}
      <div className="w-full flex justify-center mb-8">
        <form onSubmit={handleSubmit} className="w-full max-w-4xl grid grid-cols-2 gap-x-6 gap-y-3 bg-white p-6 rounded-2xl shadow-lg border border-gray-200 text-base">
          
          <div className="flex flex-col col-span-1">
            <label htmlFor="vendor_legal_name" className="text-xs font-bold uppercase mb-1">Vendor Legal Name</label>
            <input id="vendor_legal_name" className="border border-gray-300 p-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-black uppercase text-base w-full" placeholder="Legal Name" name="vendor_legal_name" value={form.vendor_legal_name} onChange={handleChange} required />
          </div>
          <div className="flex flex-col col-span-1">
            <label htmlFor="vendor_dba" className="text-xs font-bold uppercase mb-1">Vendor DBA</label>
            <input id="vendor_dba" className="border border-gray-300 p-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-black uppercase text-base w-full" placeholder="DBA" name="vendor_dba" value={form.vendor_dba} onChange={handleChange} required />
          </div>
          <div className="flex flex-col col-span-1">
            <label htmlFor="email" className="text-xs font-bold uppercase mb-1">Email</label>
            <input id="email" className="border border-gray-300 p-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-black uppercase text-base w-full" placeholder="Email" name="email" type="email" value={form.email} onChange={handleChange} />
          </div>
          
          <div className="flex flex-col col-span-1">
            <label htmlFor="phone" className="text-xs font-bold uppercase mb-1">Phone</label>
            <input id="phone" className="border border-gray-300 p-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-black uppercase text-base w-full" placeholder="Phone" name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <div className="flex flex-col col-span-1">
            <label htmlFor="tax_id" className="text-xs font-bold uppercase mb-1">Tax ID</label>
            <input id="tax_id" className="border border-gray-300 p-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-black uppercase text-base w-full" placeholder="Tax ID (optional)" name="tax_id" value={form.tax_id} onChange={handleChange} />
          </div>
          
          <div className="flex flex-col col-span-2">
            <label htmlFor="address" className="text-xs font-bold uppercase mb-1">Address</label>
            <input id="address" className="border border-gray-300 p-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-black uppercase text-base w-full" placeholder="Address" name="address" value={form.address} onChange={handleChange} />
          </div>
          
          <div className="flex items-center col-span-2 justify-center mt-2">
            <button type="submit" disabled={loading} className="bg-black text-white rounded-full px-8 py-3 font-bold tracking-wide shadow hover:bg-gray-800 transition uppercase text-base disabled:opacity-50">{loading ? "ADDING..." : "ADD VENDOR"}</button>
          </div>
        </form>
      </div>

      <div className="w-full flex justify-center px-2 md:px-0">
        <div className="w-full max-w-7xl overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-2xl shadow-lg text-xs align-middle">
            <thead>
              <tr className="bg-black text-white font-bold uppercase whitespace-nowrap">
                <th className="py-3 px-4 border-b text-left">VENDOR LEGAL NAME</th>
                <th className="py-3 px-4 border-b text-left">VENDOR DBA</th>
                <th className="py-3 px-4 border-b text-left">CONTACT</th>
                <th className="py-3 px-4 border-b text-left">EMAIL</th>
                <th className="py-3 px-4 border-b text-left">PHONE</th>
                <th className="py-3 px-4 border-b text-left">ADDRESS</th>
                <th className="py-3 px-4 border-b text-left">TAX ID</th>
                <th className="py-3 px-4 border-b text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-gray-400 font-semibold uppercase">NO VENDORS REGISTERED.</td>
                </tr>
              ) : (
                vendors.map((vendor, idx) => (
                  <React.Fragment key={vendor.id}>
                    {editingVendorId === vendor.id ? (
                      <tr className="bg-white">
                        <td colSpan={9} className="p-4">
                          <form
                            onSubmit={(e) => handleEditSubmit(vendor, e)}
                          >
                            <div className="flex flex-col col-span-1">
                              <label className="text-xs font-bold uppercase mb-1">Vendor Legal Name</label>
                              <input name="vendor_legal_name" value={editForm.vendor_legal_name} onChange={handleEditChange} className="border border-gray-300 p-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-black uppercase text-base w-full" required />
                            </div>
                            <div className="flex flex-col col-span-1">
                              <label className="text-xs font-bold uppercase mb-1">Vendor DBA</label>
                              <input name="vendor_dba" value={editForm.vendor_dba} onChange={handleEditChange} className="border border-gray-300 p-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-black uppercase text-base w-full" required />
                            </div>
                            <div className="flex flex-col col-span-1">
                              <label className="text-xs font-bold uppercase mb-1">Contact</label>
                              <input name="contact" value={editForm.contact} onChange={handleEditChange} className="border border-gray-300 p-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-black uppercase text-base w-full" />
                            </div>
                            <div className="flex flex-col col-span-1">
                              <label className="text-xs font-bold uppercase mb-1">Email</label>
                              <input name="email" value={editForm.email} onChange={handleEditChange} className="border border-gray-300 p-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-black uppercase text-base w-full" type="email" />
                            </div>
                            <div className="flex flex-col col-span-1">
                              <label className="text-xs font-bold uppercase mb-1">Phone</label>
                              <input name="phone" value={editForm.phone} onChange={handleEditChange} className="border border-gray-300 p-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-black uppercase text-base w-full" />
                            </div>
                            <div className="flex flex-col col-span-1">
                              <label className="text-xs font-bold uppercase mb-1">Tax ID</label>
                              <input name="tax_id" value={editForm.tax_id} onChange={handleEditChange} className="border border-gray-300 p-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-black uppercase text-base w-full" />
                            </div>
                            <div className="flex flex-col col-span-2">
                              <label className="text-xs font-bold uppercase mb-1">Address</label>
                              <input name="address" value={editForm.address} onChange={handleEditChange} className="border border-gray-300 p-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-black uppercase text-base w-full" />
                            </div>
                            <div className="flex items-center col-span-2 justify-center mt-2 gap-2">
                              <button type="submit" disabled={loading} className="bg-black text-white rounded-full px-6 py-2 font-bold tracking-wide shadow hover:bg-gray-800 transition uppercase text-base disabled:opacity-50">Save</button>
                              <button type="button" onClick={() => setEditingVendorId(null)} className="bg-gray-300 text-black rounded-full px-6 py-2 font-bold tracking-wide shadow hover:bg-gray-400 transition uppercase text-base">Cancel</button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    ) : (
                      <tr className={"transition " + (idx % 2 === 0 ? "bg-white" : "bg-[#f4f5f7]") + " hover:bg-gray-100"}>
                        <td className="py-3 px-4 border-b font-semibold uppercase whitespace-nowrap">{vendor.vendor_legal_name}</td>
                        <td className="py-3 px-4 border-b uppercase whitespace-nowrap">{vendor.vendor_dba || '-'}</td>
                        <td className="py-3 px-4 border-b uppercase whitespace-nowrap">{vendor.contact}</td>
                        <td className="py-3 px-4 border-b uppercase whitespace-nowrap">{vendor.email}</td>
                        <td className="py-3 px-4 border-b uppercase whitespace-nowrap">{vendor.phone}</td>
                        <td className="py-3 px-4 border-b uppercase whitespace-nowrap">{vendor.address}</td>
                        <td className="py-3 px-4 border-b uppercase whitespace-nowrap">{vendor.tax_id || '-'}</td>
                        <td className="py-3 px-4 border-b text-center whitespace-nowrap">
                          <button
                            className="border border-black rounded-full px-3 py-1 font-bold uppercase text-xs hover:bg-black hover:text-white transition"
                            onClick={() => {
                              setEditingVendorId(vendor.id);
                              setEditForm({
                                vendor_legal_name: vendor.vendor_legal_name,
                                vendor_dba: vendor.vendor_dba || "",
                                contact: vendor.contact || "",
                                email: vendor.email || "",
                                phone: vendor.phone || "",
                                address: vendor.address || "",
                                tax_id: vendor.tax_id || "",
                              });
                            }}
                          >EDIT</button>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}