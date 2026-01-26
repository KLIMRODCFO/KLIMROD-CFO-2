import React, { useState } from "react";
import { FoodGodAutocomplete } from "./FoodGodAutocomplete";
import { supabase } from "../../../lib/supabaseClient";
import { useActiveBU } from "../ActiveBUContext";
import { useUser } from "../UserContext";
import { useCategories } from "./useCategories";
import { useSubcategories } from "./useSubcategories";
import { useUOMs } from "./useUOMs";

interface AddItemFormProps {
  category: string;
  onCategoryChange: (cat: string) => void;
}

// Mock de subcategorías (reemplazar por fetch a Supabase)
const SUBCATEGORIES = [
  { id: "subcat-1", name: "Verduras", category_id: "food-cat-uuid" },
  { id: "subcat-2", name: "Carnes", category_id: "food-cat-uuid" },
  { id: "subcat-3", name: "Vinos", category_id: "beverage-cat-uuid" },
];
const PURCHASE_UOMS = [
  { id: "uom-kg", name: "Kilogramo" },
  { id: "uom-lt", name: "Litro" },
  { id: "uom-un", name: "Unidad" },
];

// Formulario desacoplado solo para FOOD
export function AddFoodForm() {
  const [form, setForm] = useState<any>({});
  const [selectedGodItem, setSelectedGodItem] = useState<any>(null);
  const [selectedItemName, setSelectedItemName] = useState<string>("");
  const [lockedSubcategory, setLockedSubcategory] = useState<string>("");
  const [varietyOptions, setVarietyOptions] = useState<string[]>([]);
  const { categories, loading: loadingCategories } = useCategories();
  const selectedCategory = categories.find((c: any) => c.name === "FOOD");
  const { subcategories, loading: loadingSubcategories } = useSubcategories(selectedCategory?.id);
  const { uoms, loading: loadingUOMs } = useUOMs();
  const { activeBU } = useActiveBU();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  // Eliminado success, ya no se usa para ocultar el formulario
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Si se cambia variedad tras seleccionar un item, deselecciona el god item
    if (name === "VARIETY" && selectedGodItem) {
      setSelectedGodItem(null);
    }
    if (
      type === "text" ||
      name === "ITEM_NAME" ||
      name === "VARIETY" ||
      name === "SPECIFICATIONS"
    ) {
      setForm({ ...form, [name]: value.toUpperCase() });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    let godItemId = selectedGodItem?.id;
    // Si el usuario escribió en el input pero form.ITEM_NAME está vacío, usar el valor del input
    const itemNameInput = document.querySelector('input[placeholder="Item name..."]') as HTMLInputElement;
    let itemName = form.ITEM_NAME;
    if ((!itemName || itemName.trim() === "") && itemNameInput && itemNameInput.value.trim() !== "") {
      itemName = itemNameInput.value.trim().toUpperCase();
      setForm((f: any) => ({ ...f, ITEM_NAME: itemName }));
    }
    // Validar que ITEM_NAME esté presente
    if (!itemName || itemName.trim() === "") {
      setLoading(false);
      setError("Debes ingresar un nombre de producto (ITEM NAME) antes de crear en FOOD GOD.");
      return;
    }
    // Si no existe en god, verificar si ya existe antes de crear SOLO por ITEM_NAME y VARIETY
    if (!godItemId) {
      const { data: existingGod, error: existingError } = await supabase
        .from("master_food_god")
        .select("id")
        .eq("item_name", itemName)
        .eq("variety", form.VARIETY);
      if (existingGod && existingGod.length > 0) {
        // Ya existe en GOD, solo agregar a INVENTORY FOOD
        godItemId = existingGod[0].id;
      } else {
        // Crear en GOD
        const { data: godData, error: godError } = await supabase.from("master_food_god").insert({
          item_name: itemName,
          variety: form.VARIETY,
          subcategory_id: form.SUBCATEGORY_ID || null,
          purchase_uom_id: form.PURCHASE_UOM_ID || null,
          usage_uom_id: form.USAGE_UOM_ID || null,
          yield_percentage: form.YIELD_PERCENTAGE ? Number(form.YIELD_PERCENTAGE) : null,
          created_by_bu: activeBU,
        }).select();
        if (godError) {
          setLoading(false);
          if (godError.message.includes("duplicate key value")) {
            setError("Ya existe un producto con ese nombre y variedad en FOOD GOD.");
          } else if (godError.message.includes("null value in column 'item_name'")) {
            setError("Debes ingresar un nombre de producto (ITEM NAME) antes de crear en FOOD GOD.");
          } else {
            setError("Error al crear en FOOD GOD: " + godError.message);
          }
          return;
        }
        godItemId = godData?.[0]?.id;
      }
    }
    // Verificar si ya existe en el inventario local (BU)
    const { data: existingInventory, error: invError } = await supabase
      .from("master_inventory_food")
      .select("id")
      .eq("bu_id", activeBU)
      .eq("item_name", itemName)
      .eq("variety", form.VARIETY)
      .eq("subcategory_id", form.SUBCATEGORY_ID);
    if (existingInventory && existingInventory.length > 0) {
      setLoading(false);
      setError("Ya existe este producto en el inventario de la unidad de negocio.");
      return;
    }
    // Mapear los campos del formulario a los de la tabla de inventario
    const payload = {
      bu_id: activeBU,
      created_by: user?.id,
      item_name: itemName,
      variety: form.VARIETY,
      category_id: selectedCategory?.id,
      subcategory_id: form.SUBCATEGORY_ID || null,
      purchase_uom_id: form.PURCHASE_UOM_ID || null,
      usage_uom_id: form.USAGE_UOM_ID || null,
      specifications: form.SPECIFICATIONS || null,
      yield_percentage: form.YIELD_PERCENTAGE ? Number(form.YIELD_PERCENTAGE) : null,
      food_god_id: godItemId,
    };
    const { error: supaError } = await supabase.from("master_inventory_food").insert([payload]);
    setLoading(false);
    if (supaError) {
      setError("Error al guardar: " + supaError.message);
    } else {
      setForm({});
      setSelectedGodItem(null);
      setSelectedItemName("");
      setLockedSubcategory("");
      setVarietyOptions([]);
      // Limpiar el input del autocompletado manualmente
      const itemNameInput = document.querySelector('input[placeholder="Item name..."]') as HTMLInputElement;
      if (itemNameInput) itemNameInput.value = "";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-600 font-bold">{error}</div>}
      {loading && <div className="text-neutral-500">Saving...</div>}
      {/* Autocompletado de FOOD GOD */}
      <div>
        <label className="block text-xs font-bold mb-1 text-neutral-500">ITEM NAME & VARIETY</label>
        <FoodGodAutocomplete
          onSelect={item => {
            setSelectedItemName(item?.item_name || "");
            setSelectedGodItem(null);
            // Limpiar VARIETY y opciones cada vez que se selecciona un nuevo ITEM NAME
            setForm((f: any) => ({ ...f, ITEM_NAME: item?.item_name || "", VARIETY: "" }));
            if (item?.item_name) {
              supabase
                .from("master_food_god")
                .select("subcategory_id,variety")
                .eq("item_name", item.item_name)
                .then(({ data }) => {
                  if (data && data.length > 0) {
                    const uniqueSubcats = Array.from(new Set(data.map((d: any) => d.subcategory_id)));
                    if (uniqueSubcats.length === 1) {
                      setLockedSubcategory(uniqueSubcats[0]);
                      setForm((f: any) => ({ ...f, ITEM_NAME: item.item_name, SUBCATEGORY_ID: uniqueSubcats[0], VARIETY: "" }));
                    } else {
                      setLockedSubcategory("");
                      setForm((f: any) => ({ ...f, ITEM_NAME: item.item_name, VARIETY: "" }));
                    }
                    const uniqueVarieties = Array.from(new Set(data.map((d: any) => d.variety).filter(Boolean)));
                    setVarietyOptions(uniqueVarieties);
                  } else {
                    setVarietyOptions([]);
                  }
                });
            } else {
              setLockedSubcategory("");
              setVarietyOptions([]);
              setForm((f: any) => ({ ...f, ITEM_NAME: "", VARIETY: "" }));
            }
          }}
          onInputChange={value => {
            setForm((f: any) => ({ ...f, ITEM_NAME: value }));
          }}
        />
      </div>
      {/* VARIETY (editable si se quiere crear nueva) */}
      <div>
        <label className="block text-xs font-bold mb-1 text-neutral-500">VARIETY</label>
        <div className="flex gap-2">
          {varietyOptions.length > 0 && (
            <select
              className="w-1/2 border rounded px-3 py-2 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black"
              name="VARIETY"
              value={form.VARIETY || ""}
              onChange={handleChange}
            >
              <option value="">SELECT VARIETY</option>
              {varietyOptions.map((v, idx) => (
                <option key={idx} value={v}>{v}</option>
              ))}
            </select>
          )}
          <input
            className={`border rounded px-3 py-2 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black ${varietyOptions.length > 0 ? 'w-1/2' : 'w-full'}`}
            type="text"
            name="VARIETY"
            value={form.VARIETY || ""}
            onChange={handleChange}
            placeholder={varietyOptions.length > 0 ? "Or write new variety" : "VARIETY"}
            autoComplete="off"
          />
        </div>
      </div>
      {/* SUBCATEGORY: bloqueado si el item existe en GOD, editable si es nuevo */}
      <div>
        <label className="block text-xs font-bold mb-1 text-neutral-500">SUBCATEGORY</label>
        <select
          className="w-full border rounded px-3 py-2 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black"
          name="SUBCATEGORY_ID"
          value={lockedSubcategory || form.SUBCATEGORY_ID || ""}
          onChange={handleChange}
          disabled={!!lockedSubcategory || loadingSubcategories || !selectedCategory}
        >
          <option value="">SELECT SUBCATEGORY</option>
          {subcategories.map((sub: any) => (
            <option key={sub.id} value={sub.id}>{sub.name.toUpperCase()}</option>
          ))}
        </select>
        {lockedSubcategory && (
          <div className="text-xs text-neutral-400 mt-1">Subcategory is set automatically for this item and cannot be changed.</div>
        )}
      </div>
      {/* PURCHASE UOM */}
      <div>
        <label className="block text-xs font-bold mb-1 text-neutral-500">PURCHASE UOM</label>
        <select
          className="w-full border rounded px-3 py-2 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black"
          name="PURCHASE_UOM_ID"
          value={form.PURCHASE_UOM_ID || ""}
          onChange={handleChange}
          disabled={loadingUOMs}
        >
          <option value="">SELECT UOM</option>
          {uoms.map((uom: any) => (
            <option key={uom.id} value={uom.id}>{uom.name.toUpperCase()}</option>
          ))}
        </select>
      </div>
      {/* USAGE UOM */}
      <div>
        <label className="block text-xs font-bold mb-1 text-neutral-500">USAGE UOM</label>
        <select
          className="w-full border rounded px-3 py-2 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black"
          name="USAGE_UOM_ID"
          value={form.USAGE_UOM_ID || ""}
          onChange={handleChange}
          disabled={loadingUOMs}
        >
          <option value="">SELECT UOM</option>
          {uoms.map((uom: any) => (
            <option key={uom.id} value={uom.id}>{uom.name.toUpperCase()}</option>
          ))}
        </select>
      </div>
      {/* SPECIFICATIONS */}
      <div>
        <label className="block text-xs font-bold mb-1 text-neutral-500">SPECIFICATIONS</label>
        <input
          className="w-full border rounded px-3 py-2 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black"
          type="text"
          name="SPECIFICATIONS"
          value={form.SPECIFICATIONS || ""}
          onChange={handleChange}
        />
      </div>
      {/* YIELD PERCENTAGE */}
      <div>
        <label className="block text-xs font-bold mb-1 text-neutral-500">YIELD PERCENTAGE (%)</label>
        <input
          className="w-full border rounded px-3 py-2 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black"
          type="number"
          name="YIELD_PERCENTAGE"
          value={form.YIELD_PERCENTAGE || ""}
          onChange={handleChange}
          min="0"
          max="100"
          step="0.01"
        />
      </div>
      <button
        type="submit"
        className="w-full py-2 rounded bg-black text-white font-bold hover:bg-neutral-800 transition-colors"
      >
        ADD PRODUCT
      </button>
    </form>
  );
}
