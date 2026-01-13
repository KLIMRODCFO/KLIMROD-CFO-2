"use client";
import { useActiveBU } from "../../ActiveBUContext";
import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";

export default function QuickOnboardingPage() {
  const { activeBU } = useActiveBU();
  const [buName, setBuName] = useState<string>("");
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [positions, setPositions] = useState<{ id: number; name: string; department_id: number }[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [filteredPositions, setFilteredPositions] = useState<{ id: number; name: string }[]>([]);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [submitMsg, setSubmitMsg] = useState("");

  useEffect(() => {
    const fetchBUName = async () => {
      if (activeBU) {
        const { data } = await supabase
          .from("master_business_units")
          .select("name")
          .eq("id", activeBU)
          .single();
        if (data && data.name) setBuName(data.name);
      }
    };
    fetchBUName();
  }, [activeBU]);

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data } = await supabase.from("master_departments").select("id, name");
      setDepartments(data || []);
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchPositions = async () => {
      const { data } = await supabase.from("master_positions").select("id, name, department_id");
      setPositions(data || []);
    };
    fetchPositions();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      setFilteredPositions(positions.filter(p => p.department_id === selectedDepartment));
    } else {
      setFilteredPositions([]);
    }
  }, [selectedDepartment, positions]);

  if (!activeBU) {
    return (
      <div className="text-2xl text-center mt-20 text-red-600 font-bold">
        Please select a business unit to continue.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full">
      <h1 className="text-3xl font-bold text-center mt-8 mb-4">QUICK ONBOARDING</h1>
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-gray-200 p-0">
        <form className="w-full" onSubmit={async (e) => {
          e.preventDefault();
          setSubmitMsg("");
          if (!activeBU || !selectedDepartment || !selectedPosition || !firstName || !lastName) {
            setSubmitMsg("Please fill all required fields.");
            return;
          }
          const employeeData = {
            business_unit_id: activeBU,
            department_id: selectedDepartment,
            position_id: selectedPosition,
            first_name: firstName.toUpperCase(),
            middle_name: middleName ? middleName.toUpperCase() : null,
            last_name: lastName.toUpperCase(),
            phone: phone || null,
            email: email || null,
            date_of_birth: dateOfBirth || null,
            address: address || null,
            start_date: startDate || null
          };
          const { error } = await supabase.from("master_employees_directory").insert([employeeData]);
          if (error) {
            setSubmitMsg("Error saving employee: " + error.message);
          } else {
            setSubmitMsg("Employee saved successfully!");
            setFirstName(""); setMiddleName(""); setLastName(""); setPhone(""); setEmail(""); setDateOfBirth(""); setAddress(""); setStartDate(""); setSelectedDepartment(null); setSelectedPosition(null);
          }
        }}>
          <table className="w-full text-base">
            <tbody>
              <tr>
                <td className="bg-gray-900 text-white font-bold px-6 py-3 w-1/3">BUSINESS UNIT</td>
                <td className="px-6 py-3 font-bold uppercase">{buName || activeBU}</td>
              </tr>
              <tr>
                <td className="bg-gray-900 text-white font-bold px-6 py-3 w-1/3">FIRST NAME *</td>
                <td className="px-6 py-3">
                  <input className="w-full border rounded px-2 py-1" value={firstName} onChange={e => setFirstName(e.target.value)} />
                </td>
              </tr>
              <tr>
                <td className="bg-gray-900 text-white font-bold px-6 py-3">MIDDLE NAME</td>
                <td className="px-6 py-3">
                  <input className="w-full border rounded px-2 py-1" value={middleName} onChange={e => setMiddleName(e.target.value)} />
                </td>
              </tr>
              <tr>
                <td className="bg-gray-900 text-white font-bold px-6 py-3">LAST NAME *</td>
                <td className="px-6 py-3">
                  <input className="w-full border rounded px-2 py-1" value={lastName} onChange={e => setLastName(e.target.value)} />
                </td>
              </tr>
              <tr>
                <td className="bg-gray-900 text-white font-bold px-6 py-3">DEPARTMENT *</td>
                <td className="px-6 py-3">
                  <select
                    className="w-full border rounded px-2 py-1"
                    value={selectedDepartment ?? ''}
                    onChange={e => setSelectedDepartment(Number(e.target.value) || null)}
                    required
                  >
                    <option value="">Select department</option>
                    {departments.map(dep => (
                      <option key={dep.id} value={dep.id}>{dep.name}</option>
                    ))}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="bg-gray-900 text-white font-bold px-6 py-3">POSITION *</td>
                <td className="px-6 py-3">
                  <select
                    className="w-full border rounded px-2 py-1"
                    value={selectedPosition ?? ''}
                    onChange={e => setSelectedPosition(Number(e.target.value) || null)}
                    required
                    disabled={!selectedDepartment}
                  >
                    <option value="">Select position</option>
                    {filteredPositions.map(pos => (
                      <option key={pos.id} value={pos.id}>{pos.name}</option>
                    ))}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="bg-gray-900 text-white font-bold px-6 py-3">PHONE</td>
                <td className="px-6 py-3">
                  <input className="w-full border rounded px-2 py-1" value={phone} onChange={e => setPhone(e.target.value)} />
                </td>
              </tr>
              <tr>
                <td className="bg-gray-900 text-white font-bold px-6 py-3">EMAIL</td>
                <td className="px-6 py-3">
                  <input className="w-full border rounded px-2 py-1" value={email} onChange={e => setEmail(e.target.value)} />
                </td>
              </tr>
              <tr>
                <td className="bg-gray-900 text-white font-bold px-6 py-3">DATE OF BIRTH</td>
                <td className="px-6 py-3">
                  <input type="date" className="w-full border rounded px-2 py-1" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
                </td>
              </tr>
              <tr>
                <td className="bg-gray-900 text-white font-bold px-6 py-3">ADDRESS</td>
                <td className="px-6 py-3">
                  <input className="w-full border rounded px-2 py-1" value={address} onChange={e => setAddress(e.target.value)} />
                </td>
              </tr>
              <tr>
                <td className="bg-gray-900 text-white font-bold px-6 py-3">START DATE</td>
                <td className="px-6 py-3">
                  <input type="date" className="w-full border rounded px-2 py-1" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </td>
              </tr>
            </tbody>
          </table>
          {submitMsg && (
            <div className={`text-center py-2 font-bold ${submitMsg.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>{submitMsg}</div>
          )}
          <div className="flex justify-center py-6">
            <button type="submit" className="bg-black text-white px-8 py-3 rounded font-bold text-lg shadow hover:bg-gray-800 transition">COMPLETE QUICK ONBOARDING</button>
          </div>
        </form>
      </div>
    </div>
  );
}
