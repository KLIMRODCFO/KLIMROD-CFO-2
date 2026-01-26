import React from "react";

const tabs = [
  { key: "recipes", label: "RECIPES" },
  { key: "recipes-directory", label: "RECIPES DIRECTORY" },
  { key: "food-menu", label: "FOOD MENU" },
  { key: "inventory", label: "FOOD INVENTORY" },
  { key: "ingredient-costs", label: "INGREDIENT COSTS" },
  { key: "food-orders", label: "FOOD ORDERS" },
  { key: "boh-directory", label: "BOH DIRECTORY" },
  { key: "boh-payroll", label: "BOH PAYROLL" },
];

export default function ChefTabs({ activeTab, onTabChange }: { activeTab: string; onTabChange: (key: string) => void }) {
  return (
    <div className="flex border-b mb-6 gap-2">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${activeTab === tab.key ? "border-black text-black" : "border-transparent text-neutral-400 hover:text-black"}`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
