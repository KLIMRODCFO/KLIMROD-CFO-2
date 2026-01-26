"use client";
import { useMenuAllergies } from "../../utils/useMenuAllergies";
import { useMenuCategories, useCuisineCategories, useCourseCategories } from "../../utils/useMenuFields";
import { useUOMs } from "../../inventory/useUOMs";

type Category = { id: number; name: string };
type Allergy = { id: number; name: string; description?: string };

import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { FoodGodAutocomplete } from "../../inventory/FoodGodAutocomplete";
import { useActiveBU } from "../../ActiveBUContext";

export default function RecipeForm() {
  const { activeBU } = useActiveBU();
  if (!activeBU) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <div className="text-center text-red-600 font-bold text-lg">No hay unidad de negocio activa seleccionada.</div>
      </div>
    );
  }
  // Estados principales
    // Unidades de medida (UOM)
    const { uoms } = useUOMs();
  const [ingredients, setIngredients] = useState<any[]>([]);
  // Guarda variedades, subcategoryName y uomName por ingrediente
  const [varietyOptions, setVarietyOptions] = useState<{[key: number]: string[]}>({});
  const [subcategoryNames, setSubcategoryNames] = useState<{[key: number]: string}>({});
  const [uomNames, setUomNames] = useState<{[key: number]: string}>({});
  const [activeInMenu, setActiveInMenu] = useState(true);


  // Pasos estructurados: [{ text: string, minutes: number }]
  const [steps, setSteps] = useState([{ text: "", minutes: 0 }]);
    // Ocultar flechas de los inputs numéricos
    // tailwind no soporta pseudo-elementos, así que agregamos un style global aquí
    React.useEffect(() => {
      const style = document.createElement('style');
      style.innerHTML = `
        input.hide-arrows::-webkit-outer-spin-button,
        input.hide-arrows::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input.hide-arrows {
          -moz-appearance: textfield;
        }
      `;
      document.head.appendChild(style);
      return () => { document.head.removeChild(style); };
    }, []);
  // Estados principales
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const menuAllergies = useMenuAllergies() as Allergy[];
  const [menuPrice, setMenuPrice] = useState<number | "">("");
  const [instructions, setInstructions] = useState("");
  const [notes, setNotes] = useState("");
  const [laborUnits, setLaborUnits] = useState(0);
  const [laborUnitCost, setLaborUnitCost] = useState(0);
  // Nuevos estados para categorías
  const [menuCategoryId, setMenuCategoryId] = useState("");
  const [cuisineCategoryId, setCuisineCategoryId] = useState("");
  const [courseCategoryId, setCourseCategoryId] = useState("");
  // Hooks para obtener datos
  const menuCategories = useMenuCategories() as Category[];
  const cuisineCategories = useCuisineCategories() as Category[];
  const courseCategories = useCourseCategories() as Category[];

  // Cálculos simples
  const foodCost = ingredients.reduce((sum, ing) => sum + ((ing.qty || 0) * (ing.unitCost || 0)), 0);
  // Convertir laborUnits de minutos a horas para el cálculo
  const laborCost = ((laborUnits || 0) / 60) * (laborUnitCost || 0);
  const totalCost = foodCost + laborCost;

  // Handler para añadir ingrediente
  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", variety: "", qty: 0, unitCost: 0 }]);
  };

  // Handler para actualizar ingrediente
  const updateIngredient = (idx: number, field: string | null, value: any) => {
    setIngredients(ingredients.map((ing, i) => {
      if (i !== idx) return ing;
      if (field === null) return value; // replace whole ingredient
      return { ...ing, [field]: value };
    }));
  };

  // Handler para eliminar ingrediente
  const removeIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const [saveMessage, setSaveMessage] = useState("");
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Construir objeto receta
    const receta = {
      bu_id: activeBU,
      name,
      menu_category_id: menuCategoryId ? Number(menuCategoryId) : null,
      cuisine_category_id: cuisineCategoryId ? Number(cuisineCategoryId) : null,
      course_category_id: courseCategoryId ? Number(courseCategoryId) : null,
      menu_price: menuPrice === "" ? null : Number(menuPrice),
      labor_units: laborUnits === 0 ? null : laborUnits,
      labor_unit_cost: laborUnitCost === 0 ? null : laborUnitCost,
      notes,
      ingredients,
      steps,
      allergies: menuAllergies.filter(a => allergies.includes(a.name)).map(a => a.id),
      active: activeInMenu,
    };
    const { error } = await supabase.from('master_recipes').insert([receta]);
    if (!error) {
      // Limpiar todos los campos del formulario
      setName("");
      setMenuCategoryId("");
      setCuisineCategoryId("");
      setCourseCategoryId("");
      setMenuPrice("");
      setLaborUnits(0);
      setLaborUnitCost(0);
      setAllergies([]);
      setNotes("");
      setIngredients([]);
      setSteps([{ text: "", minutes: 0 }]);
      setActiveInMenu(true);
    }
  };

  // Prevenir submit con Enter en cualquier campo
  const preventEnterSubmit = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <form className="w-full grid grid-cols-1 gap-10 py-10" onSubmit={handleSubmit} onKeyDown={preventEnterSubmit}>
      {/* GENERAL INFO - BLOQUE 1 */}
      <div className="w-full max-w-4xl mx-auto">
        <section className="border border-neutral-200 rounded-xl bg-white p-5 mb-8 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900 tracking-wide mb-5 border-b border-neutral-200 pb-2 uppercase">GENERAL INFORMATION</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 mb-5 items-center">
                        {/* ...existing code... */}
            {/* Recipe Name */}
            <label className="text-xs font-medium text-neutral-700 tracking-wide col-span-1 uppercase text-left">RECIPE NAME</label>
            <input
              type="text"
              placeholder="E.G. RED WINE REDUCTION"
              className="border border-neutral-300 rounded-md px-3 py-1.5 text-base bg-white focus:outline-none focus:ring-1 focus:ring-black w-full col-span-2 transition-all uppercase"
              value={name.toUpperCase()}
              onChange={e => setName(e.target.value.toUpperCase())}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
            />
            {/* Menu Category */}
            <label className="text-xs font-medium text-neutral-700 tracking-wide col-span-1 uppercase text-left">MENU CATEGORY</label>
            <select
              className="border border-neutral-300 rounded-md px-3 py-1.5 text-base bg-white focus:outline-none focus:ring-1 focus:ring-black w-full col-span-2 transition-all uppercase"
              value={menuCategoryId}
              onChange={e => setMenuCategoryId(e.target.value)}
            >
              <option value="">SELECT...</option>
              {menuCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {/* Cuisine Category */}
            <label className="text-xs font-medium text-neutral-700 tracking-wide col-span-1 uppercase text-left">CUISINE</label>
            <select
              className="border border-neutral-300 rounded-md px-3 py-1.5 text-base bg-white focus:outline-none focus:ring-1 focus:ring-black w-full col-span-2 transition-all uppercase"
              value={cuisineCategoryId}
              onChange={e => setCuisineCategoryId(e.target.value)}
            >
              <option value="">SELECT...</option>
              {cuisineCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {/* Course Category */}
            <label className="text-xs font-medium text-neutral-700 tracking-wide col-span-1 uppercase text-left">COURSE</label>
            <select
              className="border border-neutral-300 rounded-md px-3 py-1.5 text-base bg-white focus:outline-none focus:ring-1 focus:ring-black w-full col-span-2 transition-all uppercase"
              value={courseCategoryId}
              onChange={e => setCourseCategoryId(e.target.value)}
            >
              <option value="">SELECT...</option>
              {courseCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {/* Menu Price */}
            <label className="text-xs font-medium text-neutral-700 tracking-wide col-span-1 uppercase text-left">MENU PRICE ($)</label>
            <input
              type="number"
              className="border border-neutral-300 rounded-md px-3 py-1.5 text-base bg-white focus:outline-none focus:ring-1 focus:ring-black w-full col-span-2 transition-all hide-arrows"
              value={menuPrice}
              onChange={e => setMenuPrice(e.target.value === '' ? '' : Number(e.target.value))}
              min="0"
              step="0.01"
            />
            {/* Labor Units */}
            <label className="text-xs font-medium text-neutral-700 tracking-wide col-span-1 uppercase text-left">LABOR (MINUTES)</label>
            <input
              type="number"
              className="border border-neutral-300 rounded-md px-3 py-1.5 text-base bg-white focus:outline-none focus:ring-1 focus:ring-black w-full col-span-2 transition-all hide-arrows"
              value={laborUnits}
              onChange={e => setLaborUnits(Number(e.target.value))}
              min="0"
              step="1"
            />
            {/* Labor Unit Cost */}
            <label className="text-xs font-medium text-neutral-700 tracking-wide col-span-1 uppercase text-left">LABOR RATE ($/HOUR)</label>
            <input
              type="number"
              className="border border-neutral-300 rounded-md px-3 py-1.5 text-base bg-white focus:outline-none focus:ring-1 focus:ring-black w-full col-span-2 transition-all hide-arrows"
              value={laborUnitCost}
              onChange={e => setLaborUnitCost(Number(e.target.value))}
              min="0"
              step="0.01"
            />
            {/* Allergies */}
            <label className="text-xs font-medium text-neutral-700 tracking-wide col-span-1 uppercase text-left">ALLERGIE(S)</label>
            <div className="col-span-2 flex flex-wrap gap-2">
              {menuAllergies.map(opt => (
                <label key={opt.id} className="flex items-center text-xs font-medium text-neutral-700">
                  <input
                    type="checkbox"
                    className="mr-1"
                    checked={allergies.includes(opt.name)}
                    onChange={e => {
                      if (e.target.checked) setAllergies([...allergies, opt.name]);
                      else setAllergies(allergies.filter(a => a !== opt.name));
                    }}
                  />
                  {opt.name}
                </label>
              ))}
            </div>
            {/* Active in Menu Checkbox */}
            <label className="text-xs font-medium text-neutral-700 tracking-wide col-span-1 uppercase text-left mt-4">ACTIVE IN MENU</label>
            <div className="col-span-2 flex items-center mt-4">
              <input
                type="checkbox"
                className="mr-2 h-5 w-5 accent-black"
                checked={activeInMenu}
                onChange={e => setActiveInMenu(e.target.checked)}
                id="active-in-menu-checkbox"
              />
            </div>
          </div>
          {/* Costos debajo del cuadro principal */}
          <div className="flex flex-col md:flex-row justify-between items-stretch bg-neutral-900 rounded-lg p-3 w-full mt-2">
            <div className="flex flex-row w-full divide-x divide-neutral-700">
              <div className="flex flex-col items-center flex-1">
                <span className="text-xs font-semibold text-neutral-200 tracking-wide uppercase">FOOD COST</span>
                <span className="text-lg font-bold text-white">${foodCost.toFixed(2)}</span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-xs font-semibold text-neutral-200 tracking-wide uppercase">LABOR COST</span>
                <span className="text-lg font-bold text-white">${laborCost.toFixed(2)}</span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-xs font-semibold text-neutral-200 tracking-wide uppercase">TOTAL COST</span>
                <span className="text-lg font-bold text-white">${totalCost.toFixed(2)}</span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-xs font-semibold text-neutral-200 tracking-wide uppercase">TOTAL COST %</span>
                <span className="text-lg font-bold text-white">{menuPrice && Number(menuPrice) > 0 ? ((totalCost / Number(menuPrice)) * 100).toFixed(1) : '0.0'}%</span>
              </div>
            </div>
          </div>
        </section>
      </div>
      {/* INGREDIENTS TABLE */}
      <section className="border border-neutral-200 rounded-xl mb-8 shadow-sm w-full bg-white">
        <div className="px-2 py-4 sm:px-4 lg:px-6">
          <h2 className="text-lg font-semibold text-neutral-900 tracking-wide uppercase mb-6">INGREDIENTS & COMPONENTS</h2>
          <div className="w-full overflow-x-auto relative" style={{minHeight: '80px', zIndex: 1}}>
            <table className="w-full text-left text-xs align-middle">
              <thead>
                <tr className="bg-black">
                  <th className="px-6 py-2 text-white font-bold text-center align-middle">ITEM NAME</th>
                  <th className="px-6 py-2 text-white font-bold text-center align-middle">VARIETY</th>
                  <th className="px-6 py-2 text-white font-bold text-center align-middle">SUBCATEGORY</th>
                  <th className="px-6 py-2 text-white font-bold text-center align-middle">UOM</th>
                  <th className="px-6 py-2 text-white font-bold text-center align-middle">QTY</th>
                  <th className="px-6 py-2 text-white font-bold text-center align-middle">UNIT COST</th>
                  <th className="px-6 py-2 text-white font-bold text-center align-middle">TOTAL</th>
                  <th className="px-6 py-2 text-white font-bold text-center align-middle">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ing, idx) => (
                  <tr key={idx} className="border-b border-neutral-200 align-middle h-14">
                    <td className="px-2 py-2 align-middle w-[220px]">
                      <div className="min-w-[180px] relative z-20 flex items-center h-12">
                        <FoodGodAutocomplete
                          activeBU={activeBU}
                          onSelect={async item => {
                            if (item) {
                              // Consulta la primera coincidencia para autocompletar subcategory (nombre)
                              const { data: match } = await supabase
                                .from("master_inventory_food")
                                .select("subcategory_id")
                                .eq("item_name", item.item_name)
                                .eq("bu_id", activeBU)
                                .limit(1)
                                .single();
                              let subcategoryName = '';
                              if (match?.subcategory_id) {
                                const { data: subcatData } = await supabase
                                  .from('master_subcategory')
                                  .select('name')
                                  .eq('id', match.subcategory_id)
                                  .single();
                                subcategoryName = subcatData?.name || '';
                              }
                              // Obtener varieties para el item seleccionado
                              const { data: varietiesData } = await supabase
                                .from("master_inventory_food")
                                .select("variety")
                                .eq("item_name", item.item_name)
                                .eq("bu_id", activeBU);
                              const uniqueVarieties = Array.from(new Set((varietiesData || []).map((row: any) => row.variety).filter(Boolean)));
                              setVarietyOptions(prev => ({ ...prev, [idx]: uniqueVarieties }));
                              updateIngredient(idx, null, {
                                ...ing,
                                id: item.id,
                                name: item.item_name,
                                foodGodItem: item,
                                variety: '',
                                subcategory: subcategoryName
                              });
                            }
                          }}
                        />
                      </div>
                    </td>
                    {/* VARIETY column: select, readonly input, or empty */}
                    <td className="px-2 py-2 align-middle w-[180px]">
                      {Array.isArray(varietyOptions[idx]) && varietyOptions[idx].length > 1 && (
                        <select
                          className="border border-neutral-300 rounded-md px-4 py-2 w-full text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black uppercase h-10"
                          value={ing.variety || ''}
                          onChange={e => updateIngredient(idx, 'variety', e.target.value)}
                        >
                          <option value="">Selecciona variedad...</option>
                          {varietyOptions[idx].map((v, i) => (
                            <option key={i} value={v}>{v}</option>
                          ))}
                        </select>
                      )}
                      {Array.isArray(varietyOptions[idx]) && varietyOptions[idx].length === 1 && (
                        <input
                          className="border border-neutral-300 rounded-md px-4 py-2 w-full text-sm bg-neutral-100 focus:outline-none focus:ring-1 focus:ring-black uppercase h-10"
                          value={varietyOptions[idx][0]}
                          readOnly
                          placeholder="VARIETY"
                        />
                      )}
                      {(!Array.isArray(varietyOptions[idx]) || varietyOptions[idx].length === 0) && (
                        <input
                          className="border border-neutral-300 rounded-md px-4 py-2 w-full text-sm bg-neutral-100 focus:outline-none focus:ring-1 focus:ring-black uppercase h-10"
                          value=""
                          readOnly
                          placeholder="VARIETY"
                        />
                      )}
                    </td>
                    <td className="px-2 py-2 align-middle w-[220px]">
                      <input
                        className="border border-neutral-300 rounded-md px-4 py-2 text-sm bg-neutral-100 focus:outline-none focus:ring-1 focus:ring-black uppercase h-12 w-full"
                        value={ing.subcategory || ''}
                        readOnly
                        placeholder="SUBCATEGORY"
                      />
                    </td>
                    <td className="px-2 py-2 align-middle w-[100px]">
                      <select
                        className="border border-neutral-300 rounded-md px-4 py-2 w-full text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black uppercase h-10"
                        value={ing.uom || ''}
                        onChange={e => updateIngredient(idx, 'uom', e.target.value)}
                      >
                        <option value="">Selecciona UOM...</option>
                        {uoms.map(uom => (
                          <option key={uom.id} value={uom.id}>{uom.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <input
                        type="number"
                        step="any"
                        className="border border-neutral-300 rounded-md px-4 py-2 w-20 text-center text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black hide-arrows h-10"
                        value={ing.qty === 0 ? '' : ing.qty}
                        onChange={e => updateIngredient(idx, 'qty', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        placeholder=""
                        min="0"
                      />
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <input
                        type="number"
                        className="border border-neutral-300 rounded-md px-4 py-2 w-24 text-center text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black hide-arrows h-10"
                        value={ing.unitCost === 0 ? '' : ing.unitCost}
                        onChange={e => updateIngredient(idx, 'unitCost', Number(e.target.value))}
                        placeholder=""
                        min="0"
                      />
                    </td>
                    <td className="px-2 py-2 align-middle font-semibold text-neutral-900 h-10 text-center">
                      ${(ing.qty * ing.unitCost).toFixed(2)}
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <button
                        type="button"
                        onClick={() => removeIngredient(idx)}
                        className="text-xs border border-neutral-300 px-4 py-2 rounded-full hover:bg-neutral-900 hover:text-white transition-all font-semibold uppercase bg-white h-10"
                      >
                        DELETE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* End of ingredients.map and table */}
          <div className="flex mt-4">
            <button
              type="button"
              onClick={addIngredient}
              className="text-xs border border-neutral-900 bg-neutral-900 text-white px-6 py-2 rounded-full hover:bg-neutral-700 transition-all font-semibold uppercase tracking-wider shadow-md"
              style={{minWidth: '160px'}}>
              + ADD INGREDIENT
            </button>
          </div>
        </div>
      </section>
      {/* Preparation Instructions */}
      <section className="w-full max-w-4xl mx-auto mt-8">
        <div className="flex flex-col gap-4">
          <label className="text-xs font-bold text-black uppercase tracking-widest mb-2">Preparation Instructions</label>
          <ol className="flex flex-col gap-2">
            {steps.map((step, idx) => (
              <li key={idx} className="flex items-center gap-2 py-1">
                <span className="font-bold text-neutral-500 select-none w-6 text-right">{idx + 1}.</span>
                <textarea
                  className="border border-black rounded-lg px-4 py-2 bg-white min-h-[48px] flex-1 align-middle"
                  value={step.text}
                  onChange={e => {
                    const newSteps = [...steps];
                    newSteps[idx].text = e.target.value;
                    setSteps(newSteps);
                  }}
                  placeholder={`Step ${idx + 1}`}
                />
                <div className="flex flex-col items-center ml-2">
                  <input
                    type="number"
                    className="border border-neutral-300 rounded-md px-2 py-1 w-20 text-center text-xs bg-white focus:outline-none focus:ring-1 focus:ring-black hide-arrows"
                    value={step.minutes}
                    onChange={e => {
                      const newSteps = [...steps];
                      newSteps[idx].minutes = Number(e.target.value);
                      setSteps(newSteps);
                    }}
                    min="0"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1">MIN</span>
                </div>
                <button
                  type="button"
                  className="ml-2 text-xs border border-neutral-300 px-4 py-2 rounded-full hover:bg-neutral-900 hover:text-white transition-all font-semibold uppercase bg-white h-10"
                  onClick={() => setSteps(steps.filter((_, i) => i !== idx))}
                  disabled={steps.length === 1}
                >
                  DELETE
                </button>
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="mt-2 text-xs border border-neutral-900 bg-neutral-900 text-white px-4 py-2 rounded-full hover:bg-neutral-700 transition-all font-semibold uppercase tracking-wider shadow-md w-fit"
            onClick={() => setSteps([...steps, { text: "", minutes: 0 }])}
          >
            + Add Step
          </button>
        </div>
      </section>
      {/* Notes */}
      <section className="w-full max-w-4xl mx-auto mt-8">
        <label className="text-xs font-bold text-black uppercase tracking-widest mb-2">Notes</label>
        <textarea
          className="border border-neutral-300 rounded-md px-3 py-2 w-full min-h-[60px]"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Additional notes..."
        />
      </section>
      {/* Save Message & Submit */}
      <div className="w-full max-w-4xl mx-auto mt-8 flex flex-col items-center">
        {/* saveMessage eliminado por solicitud */}
        <button
          type="submit"
          className="bg-black text-white px-8 py-3 rounded-full font-bold uppercase tracking-wider shadow-md hover:bg-neutral-800 transition-all"
        >
          Save Recipe
        </button>
      </div>
    </form>
  );
}
