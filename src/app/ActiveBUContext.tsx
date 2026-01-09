"use client";
import React, { createContext, useContext, useState } from "react";

interface ActiveBUContextType {
  activeBU: string | null;
  setActiveBU: (bu: string | null) => void;
}

const ActiveBUContext = createContext<ActiveBUContextType | undefined>(undefined);

export const ActiveBUProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeBU, setActiveBU] = useState<string | null>(null);
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
