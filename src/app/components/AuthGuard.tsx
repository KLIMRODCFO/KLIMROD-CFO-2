"use client";
import React from "react";
import { useUser } from "../UserContext";
import { usePathname, useRouter } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  React.useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.replace("/login");
    }
  }, [user, loading, isLoginPage, router]);
  if (loading && !isLoginPage) {
    return <div className="w-full h-screen flex items-center justify-center">Cargando...</div>;
  }
  return <>{children}</>;
}
