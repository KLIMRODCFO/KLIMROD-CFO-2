"use client";

import React, { useState, useEffect } from "react";
import { getWeekCode } from "../../../../utils/getWeekCode";
import { useActiveBU } from "../../ActiveBUContext";
import { supabase } from "../../../../lib/supabaseClient";
import { useUser } from "../../UserContext";


const GeneralInformation: React.FC<{
	totals: any,
	buName: string,
	setBuName: (name: string) => void,
	date: string,
	setDate: (date: string) => void,
	day: string,
	setDay: (day: string) => void,
	events: { id: string; name: string }[],
	setEvents: (events: { id: string; name: string }[]) => void,
	shifts: { id: string; name: string }[],
	setShifts: (shifts: { id: string; name: string }[]) => void,
	managers: { id: string; name: string }[],
	setManagers: (managers: { id: string; name: string }[]) => void,
	event: string,
	setEvent: (event: string) => void,
	shift: string,
	setShift: (shift: string) => void,
	manager: string,
	setManager: (manager: string) => void,
	activeBU: string | null,
	weekCode: string,
	setWeekCode: (code: string) => void
}> = ({ totals, buName, setBuName, date, setDate, day, setDay, events, setEvents, shifts, setShifts, managers, setManagers, event, setEvent, shift, setShift, manager, setManager, activeBU, weekCode, setWeekCode }) => {
	const [startDate, setStartDate] = useState<string>("");
	       useEffect(() => {
		       if (activeBU) {
			       supabase
				       .from("master_business_units")
				       .select("name, week1_start_date")
				       .eq("id", activeBU)
				       .single()
				       .then(({ data }) => {
					       setBuName(data?.name ? data.name.toUpperCase() : "");
					       setStartDate(data?.week1_start_date || "");
				       });
		       } else {
			       setBuName("");
			       setStartDate("");
		       }
	       }, [activeBU]);
	       useEffect(() => {
		       if (date) {
			       const [year, month, dayNum] = date.split('-').map(Number);
			       const utcDate = new Date(Date.UTC(year, month - 1, dayNum));
			       setDay(utcDate.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }));
			       // Calcular weekCode automáticamente
			       if (startDate) {
				       try {
					       setWeekCode(getWeekCode(startDate, date));
				       } catch {
					       setWeekCode("");
				       }
			       } else {
				       setWeekCode("");
			       }
		       } else {
			       setDay("");
			       setWeekCode("");
		       }
	       }, [date, startDate]);
	useEffect(() => {
		supabase
			.from("master_event")
			.select("id, name")
			.then(({ data }) => setEvents(data || []));
		supabase
			.from("master_shift")
			.select("id, name")
			.then(({ data }) => setShifts(data || []));
		if (activeBU) {
			supabase
				.from("master_employees_directory")
				.select("id, name")
				.eq("business_unit_id", activeBU)
				.eq("department_id", 3)
				.eq("is_active", true)
				.then(({ data }) => setManagers(data || []));
		}
	}, [activeBU]);

	return (
		<div className="bg-white rounded-xl shadow-card p-8 mb-8 w-full max-w-5xl mx-auto">
			<h2 className="text-lg font-bold mb-6 text-black uppercase">General Information</h2>
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
				<div>
					<div className="text-xs font-bold text-gray-700 mb-1 uppercase">RESTAURANT</div>
					<input type="text" value={buName} disabled className="w-full bg-gray-100 rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 uppercase" />
				</div>
				<div>
					<div className="text-xs font-bold text-gray-700 mb-1 uppercase">DATE</div>
					<input type="date" value={date} onChange={e => setDate(e.target.value.toUpperCase())} className="w-full bg-gray-100 rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 uppercase" />
				</div>
				<div>
					<div className="text-xs font-bold text-gray-700 mb-1 uppercase">DAY</div>
					<input type="text" value={day.toUpperCase()} disabled className="w-full bg-gray-100 rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 uppercase" />
				</div>
				       <div>
					       <div className="text-xs font-bold text-gray-700 mb-1 uppercase">WEEK CODE</div>
					       <input type="text" value={weekCode} disabled className="w-full bg-gray-100 rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 uppercase" />
				       </div>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
				<div>
					<div className="text-xs font-bold text-gray-700 mb-1 uppercase">EVENT</div>
					<select value={event} onChange={e => setEvent(e.target.value.toUpperCase())} className="w-full bg-gray-100 rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 uppercase">
						<option value="">SELECT EVENT</option>
						{events.map(ev => (
							<option key={ev.id} value={ev.id}>{ev.name.toUpperCase()}</option>
						))}
					</select>
				</div>
				<div>
					<div className="text-xs font-bold text-gray-700 mb-1 uppercase">SHIFT</div>
					<select value={shift} onChange={e => setShift(e.target.value.toUpperCase())} className="w-full bg-gray-100 rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 uppercase">
						<option value="">SELECT SHIFT</option>
						{shifts.map(sh => (
							<option key={sh.id} value={sh.id}>{sh.name.toUpperCase()}</option>
						))}
					</select>
				</div>
				<div>
					<div className="text-xs font-bold text-gray-700 mb-1 uppercase">MANAGER</div>
					<select value={manager} onChange={e => setManager(e.target.value.toUpperCase())} className="w-full bg-gray-100 rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 uppercase">
						<option value="">SELECT MANAGER</option>
						{managers.map(m => (
							<option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>
						))}
					</select>
				</div>
			</div>
			   <div className="w-full mt-6">
				   <div className="bg-gray-100 rounded-lg p-4 flex flex-col">
					   <div className="grid grid-cols-6 gap-4 mb-2">
						   <div className="text-xs font-bold text-gray-700 uppercase text-center">Net Sales</div>
						   <div className="text-xs font-bold text-gray-700 uppercase text-center">CC Sales</div>
						   <div className="text-xs font-bold text-gray-700 uppercase text-center">Cash Sales</div>
						   <div className="text-xs font-bold text-gray-700 uppercase text-center">CC Gratuity</div>
						   <div className="text-xs font-bold text-gray-700 uppercase text-center">Cash Gratuity</div>
						   <div className="text-xs font-bold text-gray-700 uppercase text-center">Points</div>
					   </div>
					   <div className="grid grid-cols-6 gap-4">
						   <div className="bg-white rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 text-right">{totals.netSales.toLocaleString("en-US", { style: "currency", currency: "USD" }).toUpperCase()}</div>
						   <div className="bg-white rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 text-right">{totals.ccSales.toLocaleString("en-US", { style: "currency", currency: "USD" }).toUpperCase()}</div>
						   <div className="bg-white rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 text-right">{totals.cashSales.toLocaleString("en-US", { style: "currency", currency: "USD" }).toUpperCase()}</div>
						   <div className="bg-white rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 text-right">{totals.ccGratuity.toLocaleString("en-US", { style: "currency", currency: "USD" }).toUpperCase()}</div>
						   <div className="bg-white rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 text-right">{totals.cashGratuity.toLocaleString("en-US", { style: "currency", currency: "USD" }).toUpperCase()}</div>
						   <div className="bg-white rounded-md px-3 py-2 text-sm border border-gray-200 text-gray-700 text-right">{String(totals.points).toUpperCase()}</div>
					   </div>
				   </div>
			   </div>
			   </div>
	   );
	}


// --- Sales and Employees Details Block ---
const SalesEmployeesDetails: React.FC<{
	onTotalsChange: (totals: any) => void;
	activeBU: string | null;
	rows: any[];
	setRows: (rows: any[]) => void;
}> = ({ onTotalsChange, activeBU, rows, setRows }) => {
	const [employees, setEmployees] = useState<any[]>([]);

	// Totales
	const totals = rows.reduce((acc, row) => {
		acc.netSales += Number(row.netSales) || 0;
		acc.cashSales += Number(row.cashSales) || 0;
		acc.ccSales += Number(row.ccSales) || 0;
		acc.ccGratuity += Number(row.ccGratuity) || 0;
		acc.cashGratuity += Number(row.cashGratuity) || 0;
		acc.points += Number(row.points) || 0;
		return acc;
	}, { netSales: 0, cashSales: 0, ccSales: 0, ccGratuity: 0, cashGratuity: 0, points: 0 });

	useEffect(() => {
		onTotalsChange(totals);
	}, [rows]);

	useEffect(() => {
		if (activeBU) {
			supabase
				.from("master_employees_directory")
				.select("id, name, position_id")
				.eq("business_unit_id", activeBU)
				.eq("department_id", 1) // 1 es el ID de FOH
				.eq("is_active", true)
				.then(async ({ data }) => {
					if (!data) { setEmployees([]); return; }
					// Obtener los nombres de las posiciones
					const positionIds = [...new Set(data.map(e => e.position_id).filter(Boolean))];
		let positionsMap: Record<string, string> = {};
		if (positionIds.length > 0) {
			const { data: posData } = await supabase
				.from("master_positions")
				.select("id, name")
				.in("id", positionIds);
			positionsMap = Object.fromEntries((posData || []).map(p => [String(p.id), p.name]));
		}
		setEmployees(data.map(e => ({ ...e, position: positionsMap[String(e.position_id)] || "" })));
				});
		}
	}, [activeBU]);

	const handleRowChange = (idx: number, field: string, value: string) => {
		setRows(rows.map((row, i) => i === idx ? { ...row, [field]: value } : row));
	};

	const handleEmployeeSelect = (idx: number, empId: string) => {
		const emp = employees.find(e => String(e.id) === String(empId));
		setRows(rows.map((row, i) =>
			i === idx
				? {
						...row,
						employee: empId,
						employee_name: emp?.name || "",
						position: emp?.position || ""
					}
				: row
		));
	};

	const handleAddRow = () => {
		setRows([...rows, { employee: "", position: "", netSales: "", cashSales: "", ccSales: "", ccGratuity: "", cashGratuity: "", points: "" }]);
	};

	const handleDeleteRow = (idx: number) => {
		setRows(rows.length === 1 ? rows : rows.filter((_, i) => i !== idx));
	};

	return (
		<div className="bg-white rounded-xl shadow-card p-6 mb-8 w-full max-w-6xl mx-auto">
			<h2 className="text-lg font-bold mb-4 text-primary uppercase">Sales and Employees Details</h2>
			<div className="overflow-x-auto">
				<table className="min-w-full text-sm">
					<thead>
						<tr className="bg-black text-white text-xs uppercase tracking-wider">
							<th className="px-4 py-3 text-left">EMPLOYEE</th>
							<th className="px-4 py-3 text-left">POSITION</th>
							<th className="px-4 py-3 text-right">NET SALES</th>
							<th className="px-4 py-3 text-right">CASH SALES</th>
							<th className="px-4 py-3 text-right">CC SALES</th>
							<th className="px-4 py-3 text-right">CC GRATUITY</th>
							<th className="px-4 py-3 text-right">CASH GRATUITY</th>
							<th className="px-4 py-3 text-right">POINTS</th>
							<th className="px-4 py-3 text-center">ACTIONS</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row, idx) => (
							<tr key={idx} className="border-b">
								<td className="px-2 py-2">
									<select
										value={row.employee}
										onChange={e => handleEmployeeSelect(idx, e.target.value)}
										className="w-40 bg-gray-100 rounded-md px-2 py-1 border border-gray-200 text-gray-700"
									>
										<option value="">SELECT EMPLOYEE</option>
										{employees.map(emp => (
											<option key={emp.id} value={emp.id}>{emp.name.toUpperCase()}</option>
										))}
									</select>
								</td>
								<td className="px-2 py-2">
									<input
										type="text"
										value={row.position}
										disabled
										placeholder="Position"
										className="w-32 bg-gray-100 rounded-md px-2 py-1 border border-gray-200 text-gray-700 uppercase"
									/>
								</td>
								<td className="px-2 py-2 text-center">
									<input
										type="text"
										inputMode="numeric"
										pattern="[0-9]*"
										value={row.netSales === undefined ? '' : row.netSales}
										onChange={e => handleRowChange(idx, "netSales", e.target.value.replace(/[^0-9.]/g, ""))}
										className="w-24 bg-gray-100 rounded-md px-2 py-1 border border-gray-200 text-gray-700 text-center appearance-none"
										placeholder=""
										autoComplete="off"
									/>
								</td>
								<td className="px-2 py-2 text-center">
									<input
										type="text"
										inputMode="numeric"
										pattern="[0-9]*"
										value={row.cashSales === undefined ? '' : row.cashSales}
										onChange={e => handleRowChange(idx, "cashSales", e.target.value.replace(/[^0-9.]/g, ""))}
										className="w-24 bg-gray-100 rounded-md px-2 py-1 border border-gray-200 text-gray-700 text-center appearance-none"
										placeholder=""
										autoComplete="off"
									/>
								</td>
								<td className="px-2 py-2 text-center">
									<input
										type="text"
										inputMode="numeric"
										pattern="[0-9]*"
										value={row.ccSales === undefined ? '' : row.ccSales}
										onChange={e => handleRowChange(idx, "ccSales", e.target.value.replace(/[^0-9.]/g, ""))}
										className="w-24 bg-gray-100 rounded-md px-2 py-1 border border-gray-200 text-gray-700 text-center appearance-none"
										placeholder=""
										autoComplete="off"
									/>
								</td>
								<td className="px-2 py-2 text-center">
									<input
										type="text"
										inputMode="numeric"
										pattern="[0-9]*"
										value={row.ccGratuity === undefined ? '' : row.ccGratuity}
										onChange={e => handleRowChange(idx, "ccGratuity", e.target.value.replace(/[^0-9.]/g, ""))}
										className="w-24 bg-gray-100 rounded-md px-2 py-1 border border-gray-200 text-gray-700 text-center appearance-none"
										placeholder=""
										autoComplete="off"
									/>
								</td>
								<td className="px-2 py-2 text-center">
									<input
										type="text"
										inputMode="numeric"
										pattern="[0-9]*"
										value={row.cashGratuity === undefined ? '' : row.cashGratuity}
										onChange={e => handleRowChange(idx, "cashGratuity", e.target.value.replace(/[^0-9.]/g, ""))}
										className="w-24 bg-gray-100 rounded-md px-2 py-1 border border-gray-200 text-gray-700 text-center appearance-none"
										placeholder=""
										autoComplete="off"
									/>
								</td>
								<td className="px-2 py-2 text-center">
									<input
										type="text"
										inputMode="numeric"
										pattern="[0-9]*"
										value={row.points === undefined ? '' : row.points}
										onChange={e => handleRowChange(idx, "points", e.target.value.replace(/[^0-9.]/g, ""))}
										className="w-20 bg-gray-100 rounded-md px-2 py-1 border border-gray-200 text-gray-700 text-center appearance-none"
										placeholder=""
										autoComplete="off"
									/>
								</td>
								<td className="px-2 py-2 text-center">
									<button onClick={() => handleDeleteRow(idx)} className="text-red-600 font-bold hover:underline uppercase">DELETE</button>
								</td>
							</tr>
						))}
						{/* Totals row */}
						<tr className="bg-gray-50 font-bold text-center">
							<td className="px-2 py-2" colSpan={2}>TOTALS</td>
							<td className="px-2 py-2">{totals.netSales.toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
							<td className="px-2 py-2">{totals.cashSales.toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
							<td className="px-2 py-2">{totals.ccSales.toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
							<td className="px-2 py-2">{totals.ccGratuity.toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
							<td className="px-2 py-2">{totals.cashGratuity.toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
							<td className="px-2 py-2">{totals.points}</td>
							<td></td>
						</tr>
					</tbody>
				</table>
			</div>
			<div className="mt-4">
				<button onClick={handleAddRow} className="bg-black text-white px-4 py-1.5 rounded-xl font-bold shadow hover:bg-gray-800 transition uppercase tracking-wider text-sm">+ Add Employee</button>
			</div>
		</div>
	);
};


import * as XLSX from "xlsx";

const GratuityDistribution: React.FC<{ rows: any[]; totals: any }> = ({ rows, totals }) => {
	// Obtener lista de empleados únicos con id y nombre
	const employeesList = React.useMemo(() => {
		const map = new Map<string, string>();
		rows.forEach(row => {
			if (row.employee_name && row.employee) {
				map.set(row.employee, row.employee_name);
			}
		});
		return map;
	}, [rows]);

	// Calcular puntos totales
	const totalPoints = rows.reduce((acc, row) => acc + (Number(row.points) || 0), 0);
	// Distribución proporcional
	const getShare = (value: number, points: number) => totalPoints > 0 ? (value * points) / totalPoints : 0;
	const getPercent = (points: number) => totalPoints > 0 ? (100 * points) / totalPoints : 0;

	// Buscar nombre del empleado por id
	const getEmployeeName = (row: any) => {
		if (row.employee_name) return row.employee_name;
		if (row.employee && row.employees && Array.isArray(row.employees)) {
			const found = row.employees.find((e: any) => String(e.id) === String(row.employee));
			return found ? found.name : row.employee;
		}
		return row.employee;
	};

	const handleExportExcel = () => {
		const data = rows.map(row => ({
			Employee: getEmployeeName(row),
			Position: row.position,
			"CC Gratuity": getShare(totals.ccGratuity, Number(row.points)),
			"Cash Gratuity": getShare(totals.cashGratuity, Number(row.points)),
			Points: row.points,
			Percent: getPercent(Number(row.points)),
		}));
		const ws = XLSX.utils.json_to_sheet(data);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Gratuity Distribution");
		XLSX.writeFile(wb, "gratuity_distribution.xlsx");
	};

	return (
		<div className="bg-white rounded-xl shadow-card p-6 mb-8 w-full max-w-4xl mx-auto">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-lg font-bold text-primary uppercase">Gratuity Distribution</h2>
				<button
					onClick={handleExportExcel}
					  className="bg-black text-white px-3 py-1.5 rounded-lg font-semibold shadow hover:bg-gray-800 transition text-sm uppercase"
				>
					Export to Excel
				</button>
			</div>
			<div className="overflow-x-auto">
				<table className="min-w-full text-sm">
					<thead>
						<tr className="bg-black text-white text-xs uppercase tracking-wider text-center">
							<th className="px-3 py-2 text-center">EMPLOYEE</th>
							<th className="px-3 py-2 text-center">POSITION</th>
							<th className="px-3 py-2 text-center">CC GRATUITY</th>
							<th className="px-3 py-2 text-center">CASH GRATUITY</th>
							<th className="px-3 py-2 text-center">POINTS</th>
							<th className="px-3 py-2 text-center">%</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row, idx) => (
							<tr key={idx} className="border-b text-center">
								<td className="px-2 py-2 text-center">{getEmployeeName(row)}</td>
								<td className="px-2 py-2 text-center">{row.position}</td>
								<td className="px-2 py-2 text-center">{getShare(totals.ccGratuity, Number(row.points)).toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
								<td className="px-2 py-2 text-center">{getShare(totals.cashGratuity, Number(row.points)).toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
								<td className="px-2 py-2 text-center">{row.points}</td>
								<td className="px-2 py-2 text-center">{getPercent(Number(row.points)).toFixed(2)}%</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

const NewCloseoutPage: React.FC = () => {
	const { activeBU } = useActiveBU();
	const { user } = useUser();
	const [totals, setTotals] = useState({
		netSales: 0,
		ccSales: 0,
		cashSales: 0,
		ccGratuity: 0,
		cashGratuity: 0,
		points: 0,
	});
	const [rows, setRows] = useState<any[]>([{
		employee: "",
		employee_name: "",
		position: "",
		netSales: "",
		cashSales: "",
		ccSales: "",
		ccGratuity: "",
		cashGratuity: "",
		points: "",
	}]);
	// Estados levantados para General Information
	const [buName, setBuName] = useState("");
	const [date, setDate] = useState("");
	const [day, setDay] = useState("");
	const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
	const [shifts, setShifts] = useState<{ id: string; name: string }[]>([]);
	const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);
	const [event, setEvent] = useState("");
	const [shift, setShift] = useState("");
	const [manager, setManager] = useState("");
	const [weekCode, setWeekCode] = useState<string>("");

	const [successMsg, setSuccessMsg] = useState("");
	return (
		<div className="min-h-screen bg-bg py-8">
			<h1 className="text-2xl font-bold text-primary text-center mb-8 uppercase tracking-widest">New Closeout</h1>
			{successMsg && (
				<div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
					<div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
						<span className="text-black font-bold text-lg mb-4 uppercase tracking-widest">Report submitted successfully!</span>
						<button
							className="bg-black text-white px-6 py-2 rounded-lg font-semibold text-base shadow hover:bg-gray-800 transition uppercase tracking-widest"
							onClick={() => setSuccessMsg("")}
						>
							Accept
						</button>
					</div>
				</div>
			)}
			       <GeneralInformation
				       totals={totals}
				       buName={buName}
				       setBuName={setBuName}
				       date={date}
				       setDate={setDate}
				       day={day}
				       setDay={setDay}
				       events={events}
				       setEvents={setEvents}
				       shifts={shifts}
				       setShifts={setShifts}
				       managers={managers}
				       setManagers={setManagers}
				       event={event}
				       setEvent={setEvent}
				       shift={shift}
				       setShift={setShift}
				       manager={manager}
				       setManager={setManager}
				       activeBU={activeBU}
				       weekCode={weekCode}
				       setWeekCode={setWeekCode}
			       />
			<SalesEmployeesDetails onTotalsChange={setTotals} activeBU={activeBU} rows={rows} setRows={setRows} />
			<GratuityDistribution rows={rows} totals={totals} />
			<div className="flex justify-center mt-8">
				<button
					className="bg-black text-white px-6 py-2 rounded-lg font-semibold text-base shadow hover:bg-gray-800 transition uppercase tracking-widest"
					onClick={async () => {
						       // Preparar datos para closeout_reports
							       const reportData = {
								       business_unit_id: activeBU,
								       business_unit_name: buName,
								       date,
								       day,
								       event_id: event,
								       event_name: events.find(e => String(e.id) === String(event))?.name || "",
								       shift_id: shift,
								       shift_name: shifts.find(s => String(s.id) === String(shift))?.name || "",
								       manager_id: manager,
								       manager_name: managers.find(m => String(m.id) === String(manager))?.name || "",
								       totals_net_sales: totals.netSales,
								       totals_cc_sales: totals.ccSales,
								       totals_cash_sales: totals.cashSales,
								       totals_cc_gratuity: totals.ccGratuity,
								       totals_cash_gratuity: totals.cashGratuity,
								       totals_points: totals.points,
								       user_id: user?.id || null,
									   week_code: weekCode,
									   business_unit_id: activeBU
							       };
						// Insertar en closeout_reports
						const { data: report, error: reportError } = await supabase
							.from("closeout_reports")
							.insert([reportData])
							.select()
							.single();
						if (reportError) {
							alert("Error al guardar el reporte: " + reportError.message);
							return;
						}
						// Preparar datos para closeout_report_employees
						   const employeesData = rows.map(row => ({
							   report_id: report.id,
							   employee_id: row.employee,
							   employee_name: row.employee_name,
							   position_id: row.position_id || null,
							   position_name: row.position,
							   net_sales: row.netSales === "" ? 0 : Number(row.netSales),
							   cash_sales: row.cashSales === "" ? 0 : Number(row.cashSales),
							   cc_sales: row.ccSales === "" ? 0 : Number(row.ccSales),
							   cc_gratuity: row.ccGratuity === "" ? 0 : Number(row.ccGratuity),
							   cash_gratuity: row.cashGratuity === "" ? 0 : Number(row.cashGratuity),
							   points: row.points === "" ? 0 : Number(row.points),
							   share_cc_gratuity: totals.ccGratuity && totals.points ? (totals.ccGratuity * (row.points === "" ? 0 : Number(row.points)) / totals.points) : 0,
							   share_cash_gratuity: totals.cashGratuity && totals.points ? (totals.cashGratuity * (row.points === "" ? 0 : Number(row.points)) / totals.points) : 0,
							   percent: totals.points ? (100 * (row.points === "" ? 0 : Number(row.points)) / totals.points) : 0,
							   week_code: weekCode,
							   business_unit_id: activeBU
						   }));
						// Insertar empleados
						const { error: empError } = await supabase
							.from("closeout_report_employees")
							.insert(employeesData);
						if (empError) {
							alert("Error al guardar empleados: " + empError.message);
							return;
						}
						setSuccessMsg("success");
						// Limpiar formulario
						setRows([{ employee: "", employee_name: "", position: "", netSales: "", cashSales: "", ccSales: "", ccGratuity: "", cashGratuity: "", points: "" }]);
						setTotals({ netSales: 0, ccSales: 0, cashSales: 0, ccGratuity: 0, cashGratuity: 0, points: 0 });
						setBuName("");
						setDate("");
						setDay("");
						setEvent("");
						setShift("");
						setManager("");
					}}
				>
					Submit Report
				</button>
			</div>
		</div>
	);
};

export default NewCloseoutPage;
