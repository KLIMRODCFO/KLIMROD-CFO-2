"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useActiveBU } from "../../ActiveBUContext";


const GratuityReportPage: React.FC = () => {
	const { activeBU } = useActiveBU();
	const [data, setData] = useState<any[]>([]);
	const [filters, setFilters] = useState({
		week: "",
		shift: "",
		dateFrom: "",
		dateTo: "",
		employee: "",
		position: "",
		mode: "detail" // "detail" o "total"
	});
	const [weeks, setWeeks] = useState<string[]>([]);
	const [shifts, setShifts] = useState<string[]>([]);
	const [employees, setEmployees] = useState<string[]>([]);
	const [positions, setPositions] = useState<string[]>([]);

	// Cargar opciones de filtro basadas en los datos ya traídos (data)
	useEffect(() => {
		setWeeks(Array.from(new Set(data.map((row: any) => row.week_code)).values()).filter(Boolean));
		setShifts(Array.from(new Set(data.map((row: any) => row.closeout_reports?.shift_name)).values()).filter(Boolean));
		setEmployees(Array.from(new Set(data.map((row: any) => row.employee_name)).values()).filter(Boolean));
		setPositions(Array.from(new Set(data.map((row: any) => row.position_name)).values()).filter(Boolean));
	}, [data]);

	useEffect(() => {
		if (!activeBU) return;
		let query = supabase
			.from("closeout_report_employees")
			.select(`
				id,
				week_code,
				points,
				share_cc_gratuity,
				share_cash_gratuity,
				employee_name,
				position_name,
				closeout_reports (
					date,
					shift_name
				)
			`)
			.eq("business_unit_id", activeBU);

		if (filters.week) query = query.eq("week_code", filters.week);
		if (filters.shift) query = query.eq("closeout_reports.shift_name", filters.shift);
		if (filters.employee) query = query.eq("employee_name", filters.employee);
		if (filters.position) query = query.eq("position_name", filters.position);

		query.then(({ data }) => {
			let filtered = data || [];
			if (filters.dateFrom) {
				filtered = filtered.filter(row => {
					const report = row.closeout_reports as { date?: string } | undefined;
					return report && typeof report.date === "string" && report.date >= filters.dateFrom;
				});
			}
			if (filters.dateTo) {
				filtered = filtered.filter(row => {
					const report = row.closeout_reports as { date?: string } | undefined;
					return report && typeof report.date === "string" && report.date <= filters.dateTo;
				});
			}
			setData(filtered);
		});
	}, [activeBU, filters]);

	// Calcular totales de CC y CASH GRATUITY según los datos filtrados
	const totalCCGratuity = data.reduce((sum, row) => sum + (Number(row.share_cc_gratuity) || 0), 0);
	const totalCashGratuity = data.reduce((sum, row) => sum + (Number(row.share_cash_gratuity) || 0), 0);

	return (
		<div className="min-h-screen bg-bg py-8">
			<h1 className="text-2xl font-bold text-primary text-center mb-8 uppercase tracking-widest">Gratuity Report</h1>
			<div className="flex flex-wrap justify-center gap-8 mb-6">
				<div className="bg-white rounded-xl shadow-card px-8 py-4 flex flex-col items-center">
					<span className="text-xs font-semibold text-gray-500 uppercase mb-1">Total CC Gratuity</span>
					<span className="text-2xl font-bold text-primary">{totalCCGratuity.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
				</div>
				<div className="bg-white rounded-xl shadow-card px-8 py-4 flex flex-col items-center">
					<span className="text-xs font-semibold text-gray-500 uppercase mb-1">Total Cash Gratuity</span>
					<span className="text-2xl font-bold text-primary">{totalCashGratuity.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
				</div>
			</div>
			<div className="bg-white rounded-xl shadow-card p-6 mb-8 w-full max-w-6xl mx-auto grid grid-cols-8 gap-4 items-end">
								<div>
									<label className="text-xs font-semibold mb-2 uppercase tracking-wide text-gray-700">VIEW</label>
									<select value={filters.mode} onChange={e => setFilters(f => ({ ...f, mode: e.target.value }))} className="bg-gray-50 rounded-lg px-4 py-2 text-gray-900 w-full">
										<option value="detail">Detail</option>
										<option value="total">Total by employee</option>
									</select>
								</div>
				<div>
					<label className="text-xs font-semibold mb-2 uppercase tracking-wide text-gray-700">WEEK</label>
					<select value={filters.week} onChange={e => setFilters(f => ({ ...f, week: e.target.value }))} className="bg-gray-50 rounded-lg px-4 py-2 text-gray-900 w-full">
						<option value="">All</option>
						{weeks.map(week => <option key={week} value={week}>{week}</option>)}
					</select>
				</div>
				<div>
					<label className="text-xs font-semibold mb-2 uppercase tracking-wide text-gray-700">SHIFT</label>
					<select value={filters.shift} onChange={e => setFilters(f => ({ ...f, shift: e.target.value }))} className="bg-gray-50 rounded-lg px-4 py-2 text-gray-900 w-full">
						<option value="">All</option>
						{shifts.map(shift => <option key={shift} value={shift}>{shift}</option>)}
					</select>
				</div>
				<div>
					<label className="text-xs font-semibold mb-2 uppercase tracking-wide text-gray-700">DATE FROM</label>
					<input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} className="bg-gray-50 rounded-lg px-4 py-2 text-gray-900 w-full" />
				</div>
				<div>
					<label className="text-xs font-semibold mb-2 uppercase tracking-wide text-gray-700">DATE TO</label>
					<input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} className="bg-gray-50 rounded-lg px-4 py-2 text-gray-900 w-full" />
				</div>
				<div>
					<label className="text-xs font-semibold mb-2 uppercase tracking-wide text-gray-700">EMPLOYEE</label>
					<select value={filters.employee} onChange={e => setFilters(f => ({ ...f, employee: e.target.value }))} className="bg-gray-50 rounded-lg px-4 py-2 text-gray-900 w-full">
						<option value="">All</option>
						{employees.map(emp => <option key={emp} value={emp}>{emp}</option>)}
					</select>
				</div>
				<div>
					<label className="text-xs font-semibold mb-2 uppercase tracking-wide text-gray-700">POSITION</label>
					<select value={filters.position} onChange={e => setFilters(f => ({ ...f, position: e.target.value }))} className="bg-gray-50 rounded-lg px-4 py-2 text-gray-900 w-full">
						<option value="">All</option>
						{positions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
					</select>
				</div>
			</div>
			<div className="overflow-x-auto w-full max-w-7xl mx-auto">
				{filters.mode === "detail" ? (
					<table className="min-w-full text-sm bg-white rounded-xl shadow-card">
						<thead>
							<tr className="bg-black text-white text-xs uppercase tracking-wider text-center">
								<th className="px-3 py-2">WEEK</th>
								<th className="px-3 py-2">DATE</th>
								<th className="px-3 py-2">SHIFT</th>
								<th className="px-3 py-2">EMPLOYEE</th>
								<th className="px-3 py-2">POSITION</th>
								<th className="px-3 py-2">CC GRATUITY</th>
								<th className="px-3 py-2">CASH GRATUITY</th>
								<th className="px-3 py-2">POINTS</th>
							</tr>
						</thead>
						<tbody>
							{data.map(row => (
								<tr key={row.id} className="border-b text-center">
									<td className="px-2 py-2 font-bold">{row.week_code}</td>
									<td className="px-2 py-2">{row.closeout_reports?.date || ""}</td>
									<td className="px-2 py-2">{row.closeout_reports?.shift_name || ""}</td>
									<td className="px-2 py-2">{row.employee_name}</td>
									<td className="px-2 py-2">{row.position_name}</td>
									<td className="px-2 py-2">{Number(row.share_cc_gratuity).toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
									<td className="px-2 py-2">{Number(row.share_cash_gratuity).toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
									<td className="px-2 py-2">{row.points}</td>
								</tr>
							))}
						</tbody>
					</table>
				) : (
					<table className="min-w-full text-sm bg-white rounded-xl shadow-card">
						<thead>
							<tr className="bg-black text-white text-xs uppercase tracking-wider text-center">
								<th className="px-3 py-2">WEEK</th>
								<th className="px-3 py-2">EMPLOYEE</th>
								<th className="px-3 py-2">POSITION</th>
								<th className="px-3 py-2">CC GRATUITY</th>
								<th className="px-3 py-2">CASH GRATUITY</th>
								<th className="px-3 py-2">POINTS</th>
							</tr>
						</thead>
						<tbody>
							{Object.values(
								data.reduce((acc, row) => {
									const key = `${row.employee_name}|${row.position_name}|${row.week_code}`;
									if (!acc[key]) {
										acc[key] = {
											employee_name: row.employee_name,
											position_name: row.position_name,
											week_code: row.week_code,
											share_cc_gratuity: 0,
											share_cash_gratuity: 0,
											points: 0
										};
									}
									acc[key].share_cc_gratuity += Number(row.share_cc_gratuity) || 0;
									acc[key].share_cash_gratuity += Number(row.share_cash_gratuity) || 0;
									acc[key].points += Number(row.points) || 0;
									return acc;
								}, {})
							).map((row: any, idx) => (
								<tr key={idx} className="border-b text-center">
									<td className="px-2 py-2 font-bold">{row.week_code}</td>
									<td className="px-2 py-2">{row.employee_name}</td>
									<td className="px-2 py-2">{row.position_name}</td>
									<td className="px-2 py-2">{row.share_cc_gratuity.toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
									<td className="px-2 py-2">{row.share_cash_gratuity.toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
									<td className="px-2 py-2">{row.points}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
};

export default GratuityReportPage;
