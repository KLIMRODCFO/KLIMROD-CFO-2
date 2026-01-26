import React, { useEffect, useState } from "react";
import { ConfirmModal } from "./ConfirmModal";
import { supabase } from "../../../lib/supabaseClient";
import { useCategories } from "./useCategories";
import { useSubcategories } from "./useSubcategories";
import { useUOMs } from "./useUOMs";

interface FoodProduct {
  id: string;
  item_name: string;
  variety: string;
  subcategory_id: string;
  purchase_uom_id: string;
  usage_uom_id: string;
  yield_percentage: number | null;
  specifications: string | null;
}

interface Props {
  buId: string | null;
}


export const FoodProductTable: React.FC<Props> = ({ buId }) => {
  const [products, setProducts] = useState<FoodProduct[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<Partial<FoodProduct>>({});
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchName, setSearchName] = useState("");
  const [searchSubcat, setSearchSubcat] = useState("");

  // Obtener categorías para subcategorías (solo FOOD)
  const { categories } = useCategories();
  const foodCategory = categories.find((c: any) => c.name === "FOOD");
  const { subcategories } = useSubcategories(foodCategory?.id);
  const { uoms } = useUOMs();

  useEffect(() => {
    if (!buId) return;
    setLoading(true);
    supabase
      .from("master_inventory_food")
      .select("id, item_name, variety, subcategory_id, purchase_uom_id, usage_uom_id, yield_percentage, specifications")
      .eq("bu_id", buId)
      .then(({ data }) => {
        setProducts(data || []);
        setLoading(false);
      });
  }, [buId]);

  const startEdit = (row: FoodProduct) => {
    setEditingId(row.id);
    setEditRow({ ...row });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRow({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setLoading(true);
    const { error } = await supabase
      .from("master_inventory_food")
      .update(editRow)
      .eq("id", editingId);
    if (!error) {
      setProducts(products.map(p => (p.id === editingId ? { ...p, ...editRow } as FoodProduct : p)));
      setEditingId(null);
      setEditRow({});
    }
    setLoading(false);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    const { error } = await supabase
      .from("master_inventory_food")
      .delete()
      .eq("id", deleteId);
    if (!error) {
      setProducts(products.filter(p => p.id !== deleteId));
    }
    setDeleteId(null);
    setLoading(false);
  };

  const cancelDelete = () => {
    setDeleteId(null);
  };

  // Filtrado
  const filteredProducts = products.filter(row => {
    const nameMatch = row.item_name.toLowerCase().includes(searchName.toLowerCase());
    const subcatMatch = !searchSubcat || row.subcategory_id === searchSubcat;
    return nameMatch && subcatMatch;
  });

  return (
    <div>
      {/* Buscadores */}
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div>
          <label className="block text-xs font-bold mb-1 text-neutral-500">Search by Name</label>
          <input
            className="border rounded px-3 py-2 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black"
            type="text"
            placeholder="Item name..."
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1 text-neutral-500">Filter by Subcategory</label>
          <select
            className="border rounded px-3 py-2 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black"
            value={searchSubcat}
            onChange={e => setSearchSubcat(e.target.value)}
          >
            <option value="">All</option>
            {subcategories.map((sub: any) => (
              <option key={sub.id} value={sub.id}>{sub.name.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-xs">
          <thead>
            <tr className="bg-neutral-100">
              <th className="border px-2 py-1">ITEM NAME</th>
              <th className="border px-2 py-1">VARIETY</th>
              <th className="border px-2 py-1">SUBCATEGORY</th>
              <th className="border px-2 py-1">PURCHASE UOM</th>
              <th className="border px-2 py-1">USAGE UOM</th>
              <th className="border px-2 py-1">YIELD</th>
              <th className="border px-2 py-1">SPECIFICATION</th>
              <th className="border px-2 py-1">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(row => (
              <tr key={row.id} className={editingId === row.id ? "bg-yellow-50" : ""}>
                <td className="border px-2 py-1">
                  {editingId === row.id ? (
                    <input
                      className="w-full border rounded px-1"
                      value={editRow.item_name || ""}
                      onChange={e => setEditRow({ ...editRow, item_name: e.target.value.toUpperCase() })}
                    />
                  ) : (
                    row.item_name
                  )}
                </td>
                <td className="border px-2 py-1">
                  {editingId === row.id ? (
                    <input
                      className="w-full border rounded px-1"
                      value={editRow.variety || ""}
                      onChange={e => setEditRow({ ...editRow, variety: e.target.value.toUpperCase() })}
                    />
                  ) : (
                    row.variety
                  )}
                </td>
                <td className="border px-2 py-1">
                  {editingId === row.id ? (
                    <select
                      className="w-full border rounded px-1"
                      value={editRow.subcategory_id || ""}
                      onChange={e => setEditRow({ ...editRow, subcategory_id: e.target.value })}
                    >
                      <option value="">SELECT</option>
                      {subcategories.map((sub: any) => (
                        <option key={sub.id} value={sub.id}>{sub.name.toUpperCase()}</option>
                      ))}
                    </select>
                  ) : (
                    subcategories.find((s: any) => s.id === row.subcategory_id)?.name?.toUpperCase() || ""
                  )}
                </td>
                <td className="border px-2 py-1">
                  {editingId === row.id ? (
                    <select
                      className="w-full border rounded px-1"
                      value={editRow.purchase_uom_id || ""}
                      onChange={e => setEditRow({ ...editRow, purchase_uom_id: e.target.value })}
                    >
                      <option value="">SELECT</option>
                      {uoms.map((u: any) => (
                        <option key={u.id} value={u.id}>{u.name.toUpperCase()}</option>
                      ))}
                    </select>
                  ) : (
                    uoms.find((u: any) => u.id === row.purchase_uom_id)?.name?.toUpperCase() || ""
                  )}
                </td>
                <td className="border px-2 py-1">
                  {editingId === row.id ? (
                    <select
                      className="w-full border rounded px-1"
                      value={editRow.usage_uom_id || ""}
                      onChange={e => setEditRow({ ...editRow, usage_uom_id: e.target.value })}
                    >
                      <option value="">SELECT</option>
                      {uoms.map((u: any) => (
                        <option key={u.id} value={u.id}>{u.name.toUpperCase()}</option>
                      ))}
                    </select>
                  ) : (
                    uoms.find((u: any) => u.id === row.usage_uom_id)?.name?.toUpperCase() || ""
                  )}
                </td>
                <td className="border px-2 py-1">
                  {editingId === row.id ? (
                    <input
                      className="w-full border rounded px-1"
                      type="number"
                      value={editRow.yield_percentage ?? ""}
                      onChange={e => setEditRow({ ...editRow, yield_percentage: Number(e.target.value) })}
                    />
                  ) : (
                    row.yield_percentage
                  )}
                </td>
                <td className="border px-2 py-1">
                  {editingId === row.id ? (
                    <input
                      className="w-full border rounded px-1"
                      value={editRow.specifications || ""}
                      onChange={e => setEditRow({ ...editRow, specifications: e.target.value })}
                    />
                  ) : (
                    row.specifications
                  )}
                </td>
                <td className="border px-2 py-1">
                  {editingId === row.id ? (
                    <>
                      <button className="text-green-600 mr-2" onClick={saveEdit} disabled={loading}>Save</button>
                      <button className="text-gray-400 mr-2" onClick={cancelEdit} disabled={loading}>Cancel</button>
                      <button className="text-red-600" onClick={() => handleDelete(row.id)} disabled={loading}>Delete</button>
                    </>
                  ) : (
                    <>
                      <button className="text-blue-600 mr-2" onClick={() => startEdit(row)} disabled={loading}>Edit</button>
                      <button className="text-red-600" onClick={() => handleDelete(row.id)} disabled={loading}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="text-neutral-400 mt-2">Loading...</div>}
        {!loading && filteredProducts.length === 0 && <div className="text-neutral-400 mt-2">No products found.</div>}
        <ConfirmModal
          open={!!deleteId}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          message="Are you sure you want to remove this item?"
        />
      </div>
    </div>
  );
};
