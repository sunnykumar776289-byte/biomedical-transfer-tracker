import React from 'react';
import { Home, Search, Send, CheckSquare, RotateCcw, BarChart3, Settings, UserCheck, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TransferRecord } from '../types';
import { getDepartmentName } from '../utils/formatters';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  transfers: TransferRecord[];
  onOpenStaffSwitcher: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  transfers,
  onOpenStaffSwitcher
}) => {
  const { currentUser, isBiomedical, isAdmin } = useAuth();

  // Count pending receipts specifically requiring this user's department
  const pendingCount = transfers.filter(t => {
    if (t.status !== 'Pending Receipt') return false;
    if (isAdmin || isBiomedical) return true;
    return t.toDepartment === currentUser.department;
  }).length;

  // Count returns that require action (either requested or dispatched)
  const returnsCount = transfers.filter(t => {
    if (t.status !== 'On Loan') return false;
    if (isAdmin || isBiomedical) return t.returnRequested || t.returnDispatched;
    // If current dept is owning dept and return is dispatched, need to close
    if (t.owningDepartment === currentUser.department && t.returnDispatched) return true;
    // If current dept borrowed it and return was requested by owner
    if (t.toDepartment === currentUser.department && t.returnRequested && !t.returnDispatched) return true;
    return false;
  }).length;

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'equipment', label: 'Find Equipment', icon: Search },
    { id: 'transfer', label: 'Transfer', icon: Send, highlight: true },
    { id: 'acknowledge', label: 'Acknowledge', icon: CheckSquare, badge: pendingCount },
    { id: 'returns', label: 'Returns', icon: RotateCcw, badge: returnsCount },
    { id: 'biomedical', label: 'Biomedical', icon: BarChart3 },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Settings }] : [])
  ];

  return (
    <>
      {/* Top Clinical Header for Desktop & Mobile */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Hospital Brand & App Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center font-black text-xl shadow-xs ring-2 ring-blue-600/20">
              +
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-base leading-tight tracking-tight">
                  Biomedical Equipment Transfer Register
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                  Apollo Hospital
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Direct Ward-to-Ward Clinical Handover & Dual Acknowledgement
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : item.highlight
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-blue-700' : 'bg-rose-500 text-white animate-pulse'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Authenticated Staff Button */}
          <button
            onClick={onOpenStaffSwitcher}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group bg-white shadow-2xs"
            title="Switch Hospital User Profile"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
              currentUser.role === 'ADMIN'
                ? 'bg-rose-600'
                : currentUser.role === 'BIOMEDICAL'
                ? 'bg-blue-600'
                : 'bg-emerald-600'
            }`}>
              {currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                  {currentUser.name}
                </span>
                <span className="text-[10px] font-mono font-semibold px-1 rounded bg-slate-100 text-slate-600">
                  {currentUser.staffId}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                <span className="font-semibold text-slate-700">{currentUser.department}</span>
                <span>•</span>
                <span className="capitalize">{currentUser.role.toLowerCase()}</span>
              </div>
            </div>
            <UserCheck className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Android Optimized, Touch-Friendly, Large Hit-Boxes) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-xl px-2 py-1 safe-area-bottom">
        <div className="grid grid-cols-6 gap-1">
          {navItems.slice(0, 6).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative py-1.5 px-0.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                  isActive
                    ? 'text-blue-600 font-bold bg-blue-50/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
