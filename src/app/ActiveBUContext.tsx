"use client";
import React, { createContext, useContext, useState } from "react";

interface ActiveBUContextType {
  activeBU: string | null;
  setActiveBU: (bu: string | null) => void;
}

const ActiveBUContext = createContext<ActiveBUContextType | undefined>(undefined);

export const ActiveBUProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log("[ActiveBUProvider] Rendered");
  // Persistencia en localStorage
  const getInitialBU = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("activeBU") || "11c3b1c9-7e95-48c0-9e6e-af5e558e5798";
    }
    return "11c3b1c9-7e95-48c0-9e6e-af5e558e5798";
  };
  const [activeBU, setActiveBUState] = useState<string | null>(getInitialBU());
  const setActiveBU = (bu: string | null) => {
    setActiveBUState(bu);
    if (typeof window !== "undefined" && bu) {
      localStorage.setItem("activeBU", bu);
    }
  };
  React.useEffect(() => {
    if (typeof window !== "undefined" && activeBU) {
      localStorage.setItem("activeBU", activeBU);
    }
  }, [activeBU]);
  return (
    <ActiveBUContext.Provider value={{ activeBU, setActiveBU }}>
      {children}
    </ActiveBUContext.Provider>
  );
};

export const useActiveBU = () => {
  const context = useContext(ActiveBUContext);
  if (!context) {
    throw new Error("useActiveBU must be used within an ActiveBUProvider");
  }
  return context;
};
