"use client";
import React, { useState, useEffect } from "react";
import { useActiveBU } from "../../ActiveBUContext";
import { useUser } from "../../UserContext";
import { supabase } from "../../../../lib/supabaseClient";

const FoodMenuPage: React.FC = () => {
  const { activeBU } = useActiveBU();
  const { user } = useUser();
  const [categories, setCategories] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [form, setForm] = useState({
    name: "",
    price: "",
    category_id: "",
    description: "",
    recipe_id: ""
  });
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    // Fetch categories and recipes for dropdowns
    supabase.from("master_course_category").select("id, name").then(({ data }) => setCategories(data || []));
    supabase.from("master_recipes").select("id, name").then(({ data }) => setRecipes(data || []));
    // Fetch menu items for active BU
    if (activeBU) {
      supabase.from("master_food_menu").select("*").eq("business_unit_id", activeBU).then(({ data }) => setMenuItems(data || []));
    }
  }, [activeBU]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("master_food_menu").insert([
      {
        name: form.name.toUpperCase(),
        price: form.price,
        category_id: form.category_id.toUpperCase(),
        description: form.description.toUpperCase(),
        recipe_id: form.recipe_id.toUpperCase(),
        business_unit_id: activeBU,
        created_by: user?.id ? String(user.id).toUpperCase() : null
      }
    ]);
    setLoading(false);
    if (!error) {
      setForm({ name: "", price: "", category_id: "", description: "", recipe_id: "" });
      // Refresh menu items
      supabase.from("master_food_menu").select("*").eq("business_unit_id", activeBU).then(({ data }) => setMenuItems(data || []));
    } else {
      alert("Error creating menu item: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-bg p-8">
      {/* Form Section */}
      <form className="bg-white rounded-xl shadow-card p-6 mb-8 max-w-2xl mx-auto grid gap-4" onSubmit={handleSubmit}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="border rounded px-4 py-2" required autoComplete="off" />
        <input
          name="price"
          value={form.price}
          onChange={handleChange}
          placeholder="Price"
          type="text"
          inputMode="numeric"
          pattern="[0-9.]*"
          className="border rounded px-4 py-2"
          required
          autoComplete="off"
        />
        <select name="category_id" value={form.category_id} onChange={handleChange} className="border rounded px-4 py-2" required>
          <option value="">Select Category</option>
          {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="border rounded px-4 py-2" />
        <select name="recipe_id" value={form.recipe_id} onChange={handleChange} className="border rounded px-4 py-2">
          <option value="">Select Recipe (optional)</option>
          {recipes.map((rec: any) => <option key={rec.id} value={rec.id}>{rec.name}</option>)}
        </select>
        <button type="submit" className="bg-black text-white px-6 py-2 rounded font-bold" disabled={loading}>{loading ? "Saving..." : "Add Menu Item"}</button>
      </form>
      {/* Menu Items Table */}
      <div className="overflow-x-auto w-full max-w-4xl mx-auto">
        <table className="min-w-full text-sm bg-white rounded-xl shadow-card">
          <thead>
            <tr className="bg-black text-white text-xs uppercase tracking-wider text-center">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Recipe</th>
              <th className="px-3 py-2">Created By</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map((item: any) => (
              <tr key={item.id} className="border-b text-center">
                <td className="px-2 py-2 font-bold">{item.name}</td>
                <td className="px-2 py-2">{item.price}</td>
                <td className="px-2 py-2">{categories.find((cat: any) => cat.id === item.category_id)?.name || ""}</td>
                <td className="px-2 py-2">{item.description}</td>
                <td className="px-2 py-2">{recipes.find((rec: any) => rec.id === item.recipe_id)?.name || ""}</td>
                <td className="px-2 py-2">{item.created_by || ""}</td>
                <td className="px-2 py-2 flex gap-2 justify-center">
                  <button className={`px-3 py-1 rounded font-bold text-xs uppercase ${item.is_active ? 'bg-black text-white' : 'bg-gray-300 text-black'}`}
                    onClick={() => {/* TODO: toggle active state */}}
                  >{item.is_active ? 'Active' : 'Inactive'}</button>
                  <button className="px-3 py-1 rounded font-bold text-xs uppercase bg-blue-600 text-white hover:bg-blue-800"
                    onClick={() => {/* TODO: edit item */}}
                  >Edit</button>
                  <button className="px-3 py-1 rounded font-bold text-xs uppercase bg-red-600 text-white hover:bg-red-800"
                    onClick={() => {
                      setDeleteTargetId(item.id);
                      setShowDeleteModal(true);
                    }}
                  >Delete</button>
                </td>
                    {/* Delete Confirmation Modal */}
                    {showDeleteModal && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <div className="bg-white max-w-sm w-full rounded-xl shadow-xl p-8 flex flex-col items-center border border-black pointer-events-auto" style={{boxShadow: '0 4px 32px rgba(0,0,0,0.10)'}}>
                          <h2 className="text-xl font-bold mb-6 text-black tracking-widest text-center" style={{letterSpacing: '0.12em'}}>ARE YOU SURE YOU WANT TO REMOVE THIS MENU ITEM?</h2>
                          <div className="flex gap-4 mt-2">
                            <button
                              className="px-6 py-2 rounded-full border border-black bg-white text-black font-semibold tracking-widest transition hover:bg-black hover:text-white focus:outline-none"
                              onClick={() => {
                                setShowDeleteModal(false);
                                setDeleteTargetId(null);
                              }}
                            >Cancel</button>
                            <button
                              className="px-6 py-2 rounded-full border border-black bg-black text-white font-semibold tracking-widest transition hover:bg-white hover:text-black focus:outline-none"
                              onClick={async () => {
                                if (!deleteTargetId) return;
                                setLoading(true);
                                await supabase.from("master_food_menu").delete().eq("id", deleteTargetId);
                                setMenuItems(items => items.filter((item: any) => item.id !== deleteTargetId));
                                setShowDeleteModal(false);
                                setDeleteTargetId(null);
                                setLoading(false);
                                setShowSuccessModal(true);
                              }}
                            >Delete</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Success Modal */}
                    {showSuccessModal && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <div className="bg-white max-w-sm w-full rounded-xl shadow-xl p-8 flex flex-col items-center border border-black pointer-events-auto" style={{boxShadow: '0 4px 32px rgba(0,0,0,0.10)'}}>
                          <h2 className="text-xl font-bold mb-6 text-black tracking-widest text-center" style={{letterSpacing: '0.12em'}}>SUCCESSFULLY DELETED</h2>
                          <button
                            className="px-6 py-2 rounded-full border border-black bg-black text-white font-semibold tracking-widest transition hover:bg-white hover:text-black focus:outline-none mt-2"
                            onClick={() => setShowSuccessModal(false)}
                          >OK</button>
                        </div>
                      </div>
                    )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FoodMenuPage;
