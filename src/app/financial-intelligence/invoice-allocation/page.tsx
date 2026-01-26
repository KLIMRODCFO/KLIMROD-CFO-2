"use client";
import React, { useState } from "react";
import { useActiveBU } from "../../ActiveBUContext";

// Helper to convert file to base64
function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

export default function InvoiceAllocationPage() {
	const { activeBU } = useActiveBU();
	const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
	const [generalInfo, setGeneralInfo] = useState({
		vendor_master: "",
		vendor_ai: "",
		invoice_number: "",
		invoice_date: "",
		due_date: "",
		terms: "",
		subtotal: "",
		tax: "",
		shipping: "",
		adjustments: "",
		total_amount: "",
	});
	const [items, setItems] = useState<any[]>([]);
	const [extracting, setExtracting] = useState(false);
	const [extractError, setExtractError] = useState<string | null>(null);
	const [extractRaw, setExtractRaw] = useState<string | null>(null);

	// Drag & drop handler with AI extraction
	const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setExtractError(null);
		const files = Array.from(e.dataTransfer.files);
		setUploadedFiles((prev) => [...prev, ...files]);
		if (!activeBU) {
			setExtractError("No active Business Unit. Please select a BU.");
			return;
		}
		setExtracting(true);
		try {
			// Convert all files to base64
			const base64Images = await Promise.all(files.map(fileToBase64));
			// Call API route
			const res = await fetch("/api/extract-invoice-ai", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ base64Images, bu_id: activeBU }),
			});
			const data = await res.json();
			// Mostrar la respuesta cruda para depuración
			setExtractRaw(JSON.stringify(data, null, 2));

			// Combinar todos los items de todas las páginas/imágenes
			if (data?.results && Array.isArray(data.results)) {
				// Buscar el primer resultado válido para generalInfo
				const firstValid = data.results.find((r: any) => r.data && r.data.generalInfo);
				if (firstValid) {
					const extracted = firstValid.data;
					setGeneralInfo((prev) => ({
						...prev,
						vendor_ai: extracted.generalInfo.vendor_ai || "",
						invoice_number: extracted.generalInfo.bill_number || "",
						invoice_date: extracted.generalInfo.invoice_date || "",
						due_date: extracted.generalInfo.due_date || "",
						terms: extracted.generalInfo.terms || "",
					}));
				}
				// Combinar todos los items de todos los resultados válidos
				   const allItems = data.results
					   .filter((r: any) => r.data && Array.isArray(r.data.items))
					   .flatMap((r: any) => r.data.items);
				setItems(allItems);
				// Mostrar errores individuales si existen
				const errors = data.results.filter((r: any) => r.error).map((r: any) => r.error).join(" | ");
				if (errors) setExtractError(errors);
				else setExtractError(null);
			} else {
				setExtractError("AI extraction failed or returned no data.");
			}
		} catch (err: any) {
			setExtractError("Error extracting invoice: " + (err.message || "Unknown error"));
		} finally {
			setExtracting(false);
		}
	};
	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	};

	return (
		<div className="min-h-screen bg-white text-black py-10 px-4 flex flex-col gap-8 items-center w-full">
			<h1 className="text-3xl font-extrabold text-center mb-6 tracking-wide">INVOICE ALLOCATION</h1>

			{/* Block 1: Drag & Drop Invoices */}
			<div className="w-full max-w-3xl mb-8">
				<div
					className="border-2 border-dashed border-black rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 cursor-pointer"
					onDrop={handleDrop}
					onDragOver={handleDragOver}
				>
					<span className="font-bold text-lg mb-2">Drag your invoices here (PDF/JPG/PNG)</span>
					<span className="text-xs text-gray-500 mb-4">Files will only be processed when the BU is active</span>
					{extracting && <span className="text-xs text-blue-600 mb-2">Extracting invoice data with AI...</span>}
					{extractError && <span className="text-xs text-red-600 mb-2">{extractError}</span>}
					{extractRaw && (
						<pre className="text-xs bg-gray-100 border border-gray-300 rounded p-2 mt-2 max-h-60 overflow-auto text-left whitespace-pre-wrap">
							{extractRaw}
						</pre>
					)}
					{uploadedFiles.length > 0 && (
						<ul className="mt-4 w-full text-left text-sm">
							{uploadedFiles.map((file, idx) => (
								<li key={idx} className="mb-1">{file.name}</li>
							))}
						</ul>
					)}
				</div>
			</div>

			{/* Block 2: Invoice General Information */}
			<div className="w-full max-w-3xl bg-white border border-black rounded-xl p-6 mb-8">
				<h2 className="font-bold text-lg mb-4">General Information</h2>
				<form className="grid grid-cols-2 gap-6">
					<div className="flex flex-col mb-2">
						<label className="text-xs font-bold uppercase mb-1">Vendor Master</label>
						<select className="border border-gray-300 p-2 rounded-lg" value={generalInfo.vendor_master} onChange={e => setGeneralInfo({ ...generalInfo, vendor_master: e.target.value })}>
							<option value="">Select vendor</option>
							{/* Dynamic vendor options */}
						</select>
					</div>
					<div className="flex flex-col mb-2">
						<label className="text-xs font-bold uppercase mb-1">Vendor AI</label>
						<input className="border border-gray-300 p-2 rounded-lg bg-gray-100" value={generalInfo.vendor_ai} readOnly />
					</div>
					<div className="flex flex-col mb-2">
						<label className="text-xs font-bold uppercase mb-1">Invoice Number</label>
						<input className="border border-gray-300 p-2 rounded-lg" value={generalInfo.invoice_number} onChange={e => setGeneralInfo({ ...generalInfo, invoice_number: e.target.value })} />
					</div>
					<div className="flex flex-col mb-2">
						<label className="text-xs font-bold uppercase mb-1">Invoice Date</label>
						<input type="date" className="border border-gray-300 p-2 rounded-lg" value={generalInfo.invoice_date} onChange={e => setGeneralInfo({ ...generalInfo, invoice_date: e.target.value })} />
					</div>
					<div className="flex flex-col mb-2">
						<label className="text-xs font-bold uppercase mb-1">Due Date</label>
						<input type="date" className="border border-gray-300 p-2 rounded-lg" value={generalInfo.due_date} onChange={e => setGeneralInfo({ ...generalInfo, due_date: e.target.value })} />
					</div>
					<div className="flex flex-col mb-2">
						<label className="text-xs font-bold uppercase mb-1">Terms</label>
						<input className="border border-gray-300 p-2 rounded-lg" value={generalInfo.terms} onChange={e => setGeneralInfo({ ...generalInfo, terms: e.target.value })} />
					</div>
					<div className="flex flex-col mb-2">
						<label className="text-xs font-bold uppercase mb-1">Subtotal</label>
						<input className="border border-gray-300 p-2 rounded-lg" value={generalInfo.subtotal} onChange={e => setGeneralInfo({ ...generalInfo, subtotal: e.target.value })} />
					</div>
					<div className="flex flex-col mb-2">
						<label className="text-xs font-bold uppercase mb-1">Tax</label>
						<input className="border border-gray-300 p-2 rounded-lg" value={generalInfo.tax} onChange={e => setGeneralInfo({ ...generalInfo, tax: e.target.value })} />
					</div>
					<div className="flex flex-col mb-2">
						<label className="text-xs font-bold uppercase mb-1">Shipping / Freight</label>
						<input className="border border-gray-300 p-2 rounded-lg" value={generalInfo.shipping} onChange={e => setGeneralInfo({ ...generalInfo, shipping: e.target.value })} />
					</div>
					<div className="flex flex-col mb-2">
						<label className="text-xs font-bold uppercase mb-1">Adjustments</label>
						<input className="border border-gray-300 p-2 rounded-lg" value={generalInfo.adjustments} onChange={e => setGeneralInfo({ ...generalInfo, adjustments: e.target.value })} />
					</div>
					<div className="flex flex-col mb-2 col-span-2">
						<label className="text-xs font-bold uppercase mb-1">Total Amount</label>
						<input className="border border-gray-300 p-2 rounded-lg" value={generalInfo.total_amount} onChange={e => setGeneralInfo({ ...generalInfo, total_amount: e.target.value })} />
					</div>
				</form>
			</div>

			{/* Block 3: Line Item Details */}
			<div className="w-full max-w-5xl bg-white border border-black rounded-xl p-6">
				<h2 className="font-bold text-lg mb-4">Line Item Details</h2>
				<table className="min-w-full text-xs border border-black rounded-xl">
					<thead>
						<tr className="bg-black text-white">
							<th className="py-2 px-3">PRODUCT AI</th>
							<th className="py-2 px-3">SKU / ITEM CODE</th>
							<th className="py-2 px-3">QTY</th>
							<th className="py-2 px-3">UNITS</th>
							<th className="py-2 px-3">UNIT PRICE</th>
							<th className="py-2 px-3">CATEGORY</th>
							<th className="py-2 px-3">DISCREPANCIES / NOTES</th>
							<th className="py-2 px-3">AMOUNT</th>
						</tr>
					</thead>
					<tbody>
						{items.length === 0 ? (
							<tr>
								<td colSpan={8} className="text-center py-6 text-gray-400 font-semibold uppercase">No items</td>
							</tr>
						) : (
							items.map((item, idx) => (
								<tr key={idx} className="border-b">
									<td className="py-2 px-3">{item.product_ai}</td>
									<td className="py-2 px-3">{item.item}</td>
									<td className="py-2 px-3">{item.qty}</td>
									<td className="py-2 px-3">{item.units}</td>
									<td className="py-2 px-3">{item.unit_price}</td>
									<td className="py-2 px-3">
										<select className="border border-gray-300 p-1 rounded-lg" value={item.category || ""} onChange={e => {
											const newItems = [...items];
											newItems[idx].category = e.target.value;
											setItems(newItems);
										}}>
											<option value="">Select category</option>
											<option value="Protein">Protein</option>
											<option value="Dairy">Dairy</option>
											<option value="Vegetables">Vegetables</option>
											<option value="Chemicals">Chemicals</option>
										</select>
									</td>
									<td className="py-2 px-3">{item.discrepancies}</td>
									<td className="py-2 px-3">{item.amount}</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
