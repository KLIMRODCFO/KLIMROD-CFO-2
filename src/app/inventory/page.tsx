"use client";
import React, { useState } from "react";
import { AddFoodForm } from "./AddItemForm";
import { FoodProductTable } from "./FoodProductTable";
import { useActiveBU } from "../ActiveBUContext";

const CATEGORY_TABS = [
	{ key: "FOOD", label: "FOOD" },
	{ key: "BEVERAGE", label: "BEVERAGE" },
	{ key: "SUPPLIES", label: "SUPPLIES" },
	{ key: "EQUIPMENT", label: "EQUIPMENT" },
];

const ALL_TABS = [
	{ key: "ADD_ITEM", label: "ADD ITEM" },
	...CATEGORY_TABS,
];

// Tabla de visualización/edición por categoría
function ProductTable({ category }: { category: string }) {
	const { activeBU } = useActiveBU();
	if (category === "FOOD") {
		return (
			<div className="border border-black rounded p-4">
				<FoodProductTable buId={activeBU} />
			</div>
		);
	}
	return <div className="border border-black rounded p-4 text-neutral-400">Tabla de productos {category} (próximamente)</div>;
}

export default function InventoryPage() {
	const [activeTab, setActiveTab] = useState("FOOD");
	return (
		<div className="min-h-screen bg-white text-black p-8">
			<div className="flex space-x-4 mb-8">
				{ALL_TABS.map(tab => (
					<button
						key={tab.key}
						className={`px-6 py-2 border-b-2 font-bold uppercase tracking-widest transition-colors duration-150 ${
							activeTab === tab.key
								? "border-black text-black"
								: "border-transparent text-neutral-400 hover:text-black"
						}`}
						onClick={() => setActiveTab(tab.key)}
					>
						{tab.label}
					</button>
				))}
			</div>
			{/* Visualización/edición por categoría */}
			{CATEGORY_TABS.some(tab => tab.key === activeTab) && (
				<div className="border p-4 rounded bg-white">
					<ProductTable category={activeTab} />
				</div>
			)}
			{/* Alta de producto desacoplada */}
			{activeTab === "ADD_ITEM" && (
				<div className="border p-4 rounded bg-white max-w-2xl mx-auto">
					<AddItemFormWrapper />
				</div>
			)}
		</div>
	);
}
// Wrapper para alta de producto desacoplado
function AddItemFormWrapper() {
	const [category, setCategory] = useState("FOOD");
	return (
		<div>
			<div className="mb-4 font-semibold text-lg">ADD NEW ITEM</div>
			<div className="mb-4">
				<label className="block text-xs font-bold mb-1 text-neutral-500">Categoría</label>
				<select
					className="w-full border rounded px-3 py-2 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black"
					value={category}
					onChange={e => setCategory(e.target.value)}
				>
					<option value="FOOD">FOOD</option>
					<option value="BEVERAGE">BEVERAGE</option>
					<option value="SUPPLIES">SUPPLIES</option>
					<option value="EQUIPMENT">EQUIPMENT</option>
				</select>
			</div>
			{category === "FOOD" && <AddFoodForm />}
			{category === "BEVERAGE" && (
				<div className="text-neutral-400">Alta de BEVERAGE (próximamente)</div>
			)}
			{category === "SUPPLIES" && (
				<div className="text-neutral-400">Alta de SUPPLIES (próximamente)</div>
			)}
			{category === "EQUIPMENT" && (
				<div className="text-neutral-400">Alta de EQUIPMENT (próximamente)</div>
			)}
		</div>
	);
}
