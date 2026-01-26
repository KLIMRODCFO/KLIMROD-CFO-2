
import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useActiveBU } from "../../ActiveBUContext";

interface Recipe {
  id: number;
  name: string;
  menu_category_id?: number;
  cuisine_category_id?: number;
  course_category_id?: number;
  menu_price?: number;
  active: boolean;
  ingredients?: { qty: number; unitCost: number }[];
  labor_units?: number;
  labor_unit_cost?: number;
}

interface Category { id: number; name: string; }

// Filtros de búsqueda
interface FiltersProps {
  allRecipes: Recipe[];
  courseCategories: Category[];
  onFilter: (filtered: Recipe[]) => void;
}
function Filters({ allRecipes, courseCategories, onFilter }: FiltersProps) {
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [active, setActive] = useState("");

  useEffect(() => {
    let filtered = allRecipes;
    if (name.trim()) {
      filtered = filtered.filter(r => r.name.toLowerCase().includes(name.trim().toLowerCase()));
    }
    if (course) {
      filtered = filtered.filter(r => String(r.course_category_id) === course);
    }
    if (active) {
      filtered = filtered.filter(r => (active === "yes" ? r.active : !r.active));
    }
    onFilter(filtered);
    // eslint-disable-next-line
  }, [name, course, active, allRecipes]);

  return (
    <div className="flex flex-wrap gap-4 mb-6 items-end">
      <div>
        <label className="block text-xs font-bold mb-1 uppercase">Recipe Name</label>
        <input
          type="text"
          className="border border-neutral-300 rounded-md px-3 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black"
          placeholder="Search by name..."
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-xs font-bold mb-1 uppercase">Course</label>
        <select
          className="border border-neutral-300 rounded-md px-3 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black"
          value={course}
          onChange={e => setCourse(e.target.value)}
        >
          <option value="">All</option>
          {courseCategories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold mb-1 uppercase">Active in Menu</label>
        <select
          className="border border-neutral-300 rounded-md px-3 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black"
          value={active}
          onChange={e => setActive(e.target.value)}
        >
          <option value="">All</option>
          <option value="yes">YES</option>
          <option value="no">NO</option>
        </select>
      </div>
    </div>
  );
}

export default function RecipesDirectory() {
  const { activeBU } = useActiveBU();
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuCategories, setMenuCategories] = useState<Category[]>([]);
  const [courseCategories, setCourseCategories] = useState<Category[]>([]);

  // Fetch categories for display
  useEffect(() => {
    supabase.from('master_menu_category').select('id, name').then(({ data }) => setMenuCategories(data || []));
    supabase.from('master_course_category').select('id, name').then(({ data }) => setCourseCategories(data || []));
  }, []);

  useEffect(() => {
    if (!activeBU) {
      setAllRecipes([]);
      setFilteredRecipes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("master_recipes")
      .select("id, name, menu_category_id, cuisine_category_id, course_category_id, menu_price, active, ingredients, labor_units, labor_unit_cost, bu_id")
      .eq("bu_id", activeBU)
      .then(({ data }) => {
        setAllRecipes(data || []);
        setFilteredRecipes(data || []);
        setLoading(false);
      });
  }, [activeBU]);

  if (!activeBU) {
    return (
      <div className="max-w-7xl mx-auto py-10">
        <div className="text-center text-red-600 font-bold text-lg">No hay unidad de negocio activa seleccionada.</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10">
      {/* Filtros de búsqueda */}
      <Filters allRecipes={allRecipes} courseCategories={courseCategories} onFilter={setFilteredRecipes} />
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          <table className="w-full border text-xs md:text-sm">


            <thead>
              <tr className="bg-neutral-900 text-white">
                <th className="px-4 py-2 whitespace-nowrap font-bold uppercase">RECIPE NAME</th>
                <th className="px-4 py-2 whitespace-nowrap font-bold uppercase">COURSE</th>
                <th className="px-4 py-2 whitespace-nowrap font-bold uppercase">MENU PRICE</th>
                <th className="px-4 py-2 whitespace-nowrap font-bold uppercase">FOOD COST</th>
                <th className="px-4 py-2 whitespace-nowrap font-bold uppercase">LABOR COST</th>
                <th className="px-4 py-2 whitespace-nowrap font-bold uppercase">TOTAL COST</th>
                <th className="px-4 py-2 whitespace-nowrap font-bold uppercase">TOTAL COST %</th>
                <th className="px-4 py-2 whitespace-nowrap font-bold uppercase">ACTIVE IN MENU</th>
                <th className="px-4 py-2 whitespace-nowrap font-bold uppercase">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecipes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-neutral-500 py-10 text-lg font-semibold">No recipes found</td>
                </tr>
              ) : (
                filteredRecipes.map((r) => {
                  const courseCat = courseCategories.find(c => c.id === r.course_category_id)?.name || "-";
                  // Safe cost calculations
                  let foodCost = 0;
                  if (Array.isArray(r.ingredients)) {
                    try {
                      foodCost = r.ingredients.reduce((sum, ing) => sum + ((ing?.qty || 0) * (ing?.unitCost || 0)), 0);
                    } catch { foodCost = 0; }
                  }
                  let laborCost = 0;
                  if (r.labor_units && r.labor_unit_cost) {
                    laborCost = (r.labor_units / 60) * r.labor_unit_cost;
                  }
                  const totalCost = foodCost + laborCost;
                  const totalCostPct = r.menu_price && r.menu_price > 0 ? ((totalCost / r.menu_price) * 100).toFixed(1) : "-";
                  return (
                    <tr key={r.id} className="border-b">
                      <td className="px-4 py-2">{r.name}</td>
                      <td className="px-4 py-2 text-center">{courseCat}</td>
                      <td className="px-4 py-2 text-center">{r.menu_price ?? "-"}</td>
                      <td className="px-4 py-2 text-center">${foodCost.toFixed(2)}</td>
                      <td className="px-4 py-2 text-center">${laborCost.toFixed(2)}</td>
                      <td className="px-4 py-2 text-center">${totalCost.toFixed(2)}</td>
                      <td className="px-4 py-2 text-center">{totalCostPct !== "-" ? `${totalCostPct}%` : "-"}</td>
                      <td className="px-4 py-2 text-center font-bold">
                        {r.active ? <span className="text-black">YES</span> : <span className="text-black">NO</span>}
                      </td>
                      <td className="px-4 py-2 text-center flex gap-2 justify-center">
                        <button className="text-xs border border-neutral-300 px-3 py-1 rounded-full hover:bg-neutral-900 hover:text-white transition-all font-semibold uppercase bg-white" title="View">View</button>
                        <button className="text-xs border border-blue-400 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-700 hover:text-white transition-all font-semibold uppercase bg-white" title="Edit">Edit</button>
                        <button className="text-xs border border-red-400 text-red-700 px-3 py-1 rounded-full hover:bg-red-700 hover:text-white transition-all font-semibold uppercase bg-white" title="Delete">Delete</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
