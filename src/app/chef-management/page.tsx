
"use client";
import React, { useState } from "react";
import ChefTabs from "./components/ChefTabs";

function Placeholder({ label }: { label: string }) {
  return (
    <div className="p-8 text-center text-2xl text-neutral-400 border rounded bg-neutral-50 mt-8">
      {label} (CONTENT WILL GO HERE)
    </div>
  );
}

import RecipesTab from "./recipes/RecipesTab";
import RecipesDirectory from "./recipes/directory";
import BohDirectory from "./boh-directory/page";
import FoodOrdersTable from "./food-orders/FoodOrdersTable";

const tabContent: Record<string, React.ReactNode> = {
  recipes: <RecipesTab />,
  "recipes-directory": <RecipesDirectory />,
  "food-menu": <Placeholder label="FOOD MENU" />,
  inventory: <Placeholder label="FOOD INVENTORY" />,
  "ingredient-costs": <Placeholder label="INGREDIENT COSTS" />,
  "food-orders": <FoodOrdersTable />,
  "boh-directory": <BohDirectory />,
  "boh-payroll": <Placeholder label="BOH PAYROLL" />,
};

export default function ChefManagementPage() {
  const [activeTab, setActiveTab] = useState("recipes");
  return (
    <div className="w-full min-h-screen bg-neutral-50">
      <div className="w-full px-8 py-10 border-b bg-white flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-wide text-black">CHEF MANAGEMENT</h1>
        <ChefTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <div className="w-full max-w-7xl mx-auto px-8 py-10">
        {tabContent[activeTab]}
      </div>
    </div>
  );
}
