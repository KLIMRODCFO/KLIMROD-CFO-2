"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "lib/supabaseClient";
import { CloseoutForm } from "@/app/sales-report/CloseoutForm";

const EditClosedEventPage = () => {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<any>(null);
  const [employeeRows, setEmployeeRows] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      supabase
        .from("closeout_reports")
        .select("*")
        .eq("id", id)
        .single(),
      supabase
        .from("closeout_report_employees")
        .select("*")
        .eq("report_id", id)
    ]).then(([reportRes, employeesRes]) => {
      if (reportRes.error) setError("No se pudo cargar el evento");
      else setInitialData(reportRes.data || {});
      if (employeesRes.data) setEmployeeRows(employeesRes.data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="p-8 text-center">Cargando...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <CloseoutForm
      mode="edit"
      initialData={initialData}
      employeeRows={employeeRows}
      closeoutId={id}
    />
  );
};

export default EditClosedEventPage;
