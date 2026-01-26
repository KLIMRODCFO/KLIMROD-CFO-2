import React from "react";

export default function RecipeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-xl relative">
        <button
          className="absolute top-4 right-4 text-neutral-400 hover:text-black text-xl"
          onClick={onClose}
        >
          ×
        </button>
        <h3 className="text-lg font-bold mb-6">NEW RECIPE</h3>
        {/* Formulario minimalista para crear receta */}
        <form className="space-y-4">
          <input
            type="text"
            placeholder="Recipe name"
            className="w-full border rounded px-3 py-2 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black"
          />
          <select className="w-full border rounded px-3 py-2 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black">
            <option value="">Select category</option>
            <option value="STARTER">STARTER</option>
            <option value="MAIN">MAIN</option>
            <option value="DESSERT">DESSERT</option>
          </select>
          <textarea
            placeholder="Description (optional)"
            className="w-full border rounded px-3 py-2 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black"
            rows={3}
          />
          {/* Aquí iría el selector de ingredientes y el cálculo de food cost */}
          <div className="border rounded p-4 bg-neutral-50 text-neutral-400 text-center">Ingredient selector & food cost (coming soon)</div>
          <button
            type="submit"
            className="w-full py-2 rounded bg-black text-white font-bold hover:bg-neutral-800 transition-colors"
          >
            SAVE RECIPE
          </button>
        </form>
      </div>
    </div>
  );
}
