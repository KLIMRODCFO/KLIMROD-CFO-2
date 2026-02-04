"use client";
import React from 'react';
import Link from 'next/link';
import { useUser } from '../app/UserContext';
import { supabase } from '../../lib/supabaseClient';



const Sidebar = () => {
  // Menús desplegables
  const [openMenus, setOpenMenus] = React.useState<{ [key: string]: boolean }>({});
  const { user } = useUser();
  const allowedModules = user ? user.permissions : [];

  const toggleMenu = (menu: string) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  return (
    <aside className="bg-gray-900 text-white w-64 min-h-screen flex flex-col justify-between">
      <div>
        <nav className="mt-6">
          <ul className="space-y-1">
            {/* KLIMTAB main module and submodules (just below ROLE MANAGEMENT) */}
            {allowedModules.includes('KLIMTAB') && (
              <li>
                <button type="button" className="w-full text-left px-4 py-2 hover:bg-gray-800 flex justify-between items-center" onClick={() => toggleMenu('KLIMTAB')}>
                  KLIMTAB
                  <span>{openMenus['KLIMTAB'] ? '▲' : '▼'}</span>
                </button>
                {openMenus['KLIMTAB'] && (
                  <ul className="ml-4 space-y-1 text-sm">
                    {allowedModules.includes('KLIMTAB EMPLOYEE ACCESS') && (
                      <li><Link href="/klimtab/employee-access" className="block px-2 py-1 hover:bg-gray-700 cursor-pointer">KLIMTAB EMPLOYEE ACCESS</Link></li>
                    )}
                    {allowedModules.includes('KLIMTAB SETTINGS') && (
                      <li><Link href="/klimtab/settings" className="block px-2 py-1 hover:bg-gray-700 cursor-pointer">KLIMTAB SETTINGS</Link></li>
                    )}
                    {allowedModules.includes('KLIMTAB SECURITY CENTER') && (
                      <li><Link href="/klimtab/security-center" className="block px-2 py-1 hover:bg-gray-700 cursor-pointer">KLIMTAB SECURITY CENTER</Link></li>
                    )}
                  </ul>
                )}
              </li>
            )}
            {allowedModules.includes('MATRIX') && (
              <li>
                <Link href="/matrix" className="block px-4 py-2 hover:bg-gray-800 cursor-pointer">MATRIX</Link>
              </li>
            )}
            {allowedModules.includes('BUSINESS UNIT') && (
              <li>
                <Link href="/business-unit" className="block px-4 py-2 hover:bg-gray-800 cursor-pointer">BUSINESS UNIT</Link>
              </li>
            )}
            {allowedModules.includes('USERS') && (
              <li>
                <Link href="/users" className="block px-4 py-2 hover:bg-gray-800 cursor-pointer">USERS</Link>
              </li>
            )}
            {allowedModules.includes('ROLE MANAGEMENT') && (
              <li>
                <Link href="/role-management" className="block px-4 py-2 hover:bg-gray-800 cursor-pointer">ROLE MANAGEMENT</Link>
              </li>
            )}
            {[
              'QUICK ONBOARDING',
              'HIRING PROCESS',
              'TIME & ATTENDANCE',
              'GRATUITY REPORT',
              'PAYROLL SUMMARY',
              'PERFORMANCE REPORT',
              'STAFF DIRECTORY',
            ].some(sub => allowedModules.includes(sub)) && (
              <li>
                <button type="button" className="w-full text-left px-4 py-2 hover:bg-gray-800 flex justify-between items-center" onClick={() => toggleMenu('HR DEPARTMENT')}>
                  HR DEPARTMENT
                  <span>{openMenus['HR DEPARTMENT'] ? '▲' : '▼'}</span>
                </button>
                {openMenus['HR DEPARTMENT'] && (
                  <ul className="ml-4 space-y-1 text-sm">
                    {allowedModules.includes('QUICK ONBOARDING') && <li><Link href="/hr-department/quick-onboarding" className="block px-2 py-1 hover:bg-gray-700 cursor-pointer">QUICK ONBOARDING</Link></li>}
                    {allowedModules.includes('HIRING PROCESS') && <li><Link href="/hr-department/hiring-process" className="block px-2 py-1 hover:bg-gray-700 cursor-pointer">HIRING PROCESS</Link></li>}
                    {allowedModules.includes('TIME & ATTENDANCE') && <li><Link href="/hr-department/time-attendance" className="block px-2 py-1 hover:bg-gray-700 cursor-pointer">TIME & ATTENDANCE</Link></li>}
                    {allowedModules.includes('GRATUITY REPORT') && <li><Link href="/hr-department/gratuity-report" className="block px-2 py-1 hover:bg-gray-700 cursor-pointer">GRATUITY REPORT</Link></li>}
                    {allowedModules.includes('PAYROLL SUMMARY') && <li><Link href="/hr-department/payroll-summary" className="block px-2 py-1 hover:bg-gray-700 cursor-pointer">PAYROLL SUMMARY</Link></li>}
                    {allowedModules.includes('PERFORMANCE REPORT') && <li><Link href="/hr-department/performance-report" className="block px-2 py-1 hover:bg-gray-700 cursor-pointer">PERFORMANCE REPORT</Link></li>}
                    {allowedModules.includes('STAFF DIRECTORY') && <li><Link href="/hr-department/staff-directory" className="block px-2 py-1 hover:bg-gray-700 cursor-pointer">STAFF DIRECTORY</Link></li>}
                  </ul>
                )}
              </li>
            )}
            {[
              'NEW CLOSEOUT',
              'CLOSED EVENTS',
              'POS RECONCILIATION',
            ].some(sub => allowedModules.includes(sub)) && (
              <li>
                <button type="button" className="w-full text-left px-4 py-2 hover:bg-gray-800 flex justify-between items-center" onClick={() => toggleMenu('SALES REPORT')}>
                  SALES REPORT
                  <span>{openMenus['SALES REPORT'] ? '▲' : '▼'}</span>
                </button>
                {openMenus['SALES REPORT'] && (
                  <ul className="ml-4 space-y-1 text-sm">
                    {allowedModules.includes('NEW CLOSEOUT') && <li><Link href="/sales-report/new-closeout" className="block px-2 py-1 hover:bg-gray-700 cursor-pointer">NEW CLOSEOUT</Link></li>}
                    {allowedModules.includes('CLOSED EVENTS') && <li><Link href="/sales-report/closed-events" className="block px-2 py-1 hover:bg-gray-700 cursor-pointer">CLOSED EVENTS</Link></li>}
                    {allowedModules.includes('POS RECONCILIATION') && <li><Link href="/sales-report/pos-reconciliation" className="block px-2 py-1 hover:bg-gray-700 cursor-pointer">POS RECONCILIATION</Link></li>}
                  </ul>
                )}
              </li>
            )}
            {allowedModules.includes('MENU') && (
              <li>
                <Link href="/menu" className="block px-4 py-2 hover:bg-gray-800 cursor-pointer">MENU</Link>
              </li>
            )}
            {allowedModules.includes('INVENTORY') && (
              <li>
                <Link href="/inventory" className="block px-4 py-2 hover:bg-gray-800 cursor-pointer">INVENTORY</Link>
              </li>
            )}
            {allowedModules.includes('SOMMELIER MANAGEMENT') && (
              <li>
                <Link href="/sommelier-management" className="block px-4 py-2 hover:bg-gray-800 cursor-pointer">SOMMELIER MANAGEMENT</Link>
              </li>
            )}
            {allowedModules.includes('CHEF MANAGEMENT') && (
              <li>
                <Link href="/chef-management" className="block px-4 py-2 hover:bg-gray-800 cursor-pointer">CHEF MANAGEMENT</Link>
              </li>
            )}
            {[
              'FINANCIAL INTELLIGENCE',
              'REVENUE MANAGEMENT',
              'VENDORS',
              'INVOICE ALLOCATION',
              'INVOICE DIRECTORY',
              'FINANCIAL REPORTS',
              'TAX',
            ].some(mod => allowedModules.includes(mod)) && (
              <li>
                <button type="button" className="w-full text-left px-4 py-2 hover:bg-gray-800 flex justify-between items-center" onClick={() => toggleMenu('FINANCIAL INTELLIGENCE')}>
                  FINANCIAL INTELLIGENCE
                  <span>{openMenus['FINANCIAL INTELLIGENCE'] ? '▲' : '▼'}</span>
                </button>
                {openMenus['FINANCIAL INTELLIGENCE'] && (
                  <ul className="ml-4 space-y-1 text-sm">
                    {allowedModules.includes('REVENUE MANAGEMENT') && <li><Link href="/financial-intelligence/revenue-management" className="px-2 py-1 hover:bg-gray-700 cursor-pointer block">REVENUE MANAGEMENT</Link></li>}
                    {allowedModules.includes('VENDORS') && <li><Link href="/financial-intelligence/vendors" className="px-2 py-1 hover:bg-gray-700 cursor-pointer block">VENDORS</Link></li>}
                    {allowedModules.includes('INVOICE ALLOCATION') && <li><Link href="/financial-intelligence/invoice-allocation" className="px-2 py-1 hover:bg-gray-700 cursor-pointer block">INVOICE ALLOCATION</Link></li>}
                    {allowedModules.includes('INVOICE DIRECTORY') && <li><Link href="/financial-intelligence/invoice-directory" className="px-2 py-1 hover:bg-gray-700 cursor-pointer block">INVOICE DIRECTORY</Link></li>}
                    {allowedModules.includes('FINANCIAL REPORTS') && <li><Link href="/financial-intelligence/financial-reports" className="px-2 py-1 hover:bg-gray-700 cursor-pointer block">FINANCIAL REPORTS</Link></li>}
                    {allowedModules.includes('TAX') && <li><Link href="/financial-intelligence/tax" className="px-2 py-1 hover:bg-gray-700 cursor-pointer block">TAX</Link></li>}
                  </ul>
                )}
              </li>
            )}
            {allowedModules.includes('OWNERSHIP') && (
              <li>
                <Link href="/ownership" className="block px-4 py-2 hover:bg-gray-800 cursor-pointer">OWNERSHIP</Link>
              </li>
            )}
            {allowedModules.includes('INVESTOR RELATIONSHIP') && (
              <li>
                <Link href="/investor-relationship" className="block px-4 py-2 hover:bg-gray-800 cursor-pointer">INVESTOR RELATIONSHIP</Link>
              </li>
            )}
            {allowedModules.includes('BUSINESS SETTINGS') && (
              <li>
                <Link href="/business-settings" className="block px-4 py-2 hover:bg-gray-800 cursor-pointer">BUSINESS SETTINGS</Link>
              </li>
            )}
            {allowedModules.includes('CHAT KLIMROD AI') && (
              <li>
                <Link href="/chat-klimrod-ai" className="block px-4 py-2 hover:bg-gray-800 cursor-pointer">CHAT KLIMROD AI</Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
      {/* Sign Out button removed as requested */}
    </aside>
  );
};

export default Sidebar;
