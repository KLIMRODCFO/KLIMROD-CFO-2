import React from "react";

const tabs = [
  { key: "recipes", label: "RECIPES" },
  { key: "recipes-directory", label: "RECIPES DIRECTORY" },
  { key: "food-menu", label: "FOOD MENU" },
  { key: "inventory", label: "FOOD INVENTORY" },
  { key: "ingredient-costs", label: "INGREDIENT COSTS" },
  { key: "food-orders", label: "FOOD ORDERS" },
  { key: "orders-directory", label: "ORDERS DIRECTORY" },
  { key: "boh-directory", label: "BOH DIRECTORY" },
  { key: "boh-payroll", label: "BOH PAYROLL" },
];

export default function ChefTabs({ activeTab, onTabChange }: { activeTab: string; onTabChange: (key: string) => void }) {
  return (
    <div className="flex border-b border-neutral-200 mb-6 gap-0 bg-white/80">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`px-3 py-2 text-xs md:text-sm font-bold tracking-widest uppercase border-b-2 transition-all duration-150
            ${activeTab === tab.key
              ? "border-black text-black bg-white shadow-sm"
              : "border-transparent text-neutral-400 hover:text-black hover:bg-neutral-100"}
          `}
          style={{ letterSpacing: '0.12em' }}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
