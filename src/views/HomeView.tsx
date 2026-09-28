import React from 'react';
import { useAuth } from '../context/AuthContext';
import { TransferRecord, Equipment } from '../types';
import { Send, CheckSquare, RotateCcw, Search, AlertTriangle, Clock, ArrowRight, ShieldCheck, CheckCircle2, QrCode } from 'lucide-react';
import { getDepartmentName, getStatusBadge } from '../utils/formatters';

interface HomeViewProps {
  onNavigateTab: (tab: string) => void;
  transfers: TransferRecord[];
  equipment: Equipment[];
  onOpenQR: () => void;
  onSelectTransferReceipt: (transfer: TransferRecord) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigateTab,
  transfers,
  equipment,
  onOpenQR,
  onSelectTransferReceipt
}) => {
  const { currentUser, isBiomedical } = useAuth();

  // Transfers waiting for this user's department to acknowledge
  const pendingReceipts = transfers.filter(
    t => t.status === 'Pending Receipt' && (isBiomedical || t.toDepartment === currentUser.department)
  );

  // Transfers currently borrowed by this user's department
  const borrowedByMe = transfers.filter(
    t => t.status === 'On Loan' && (isBiomedical || t.toDepartment === currentUser.department)
  );

  // Transfers loaned out by this user's department
  const loanedOutByMe = transfers.filter(
    t => t.status === 'On Loan' && (isBiomedical || t.owningDepartment === currentUser.department)
  );

  // Open discrepancies
  const openDiscrepancies = transfers.filter(t => t.hasOpenDiscrepancy);

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Welcome & Clinical Alert Banner */}
      <div className="bg-linear-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-2xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600/60 border border-blue-400/40 text-blue-100 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Authenticated: {currentUser.name} ({currentUser.staffId})
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
            Direct Ward-to-Ward Equipment Transfer
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-1 leading-relaxed">
            Eliminate double handling. ICU can transfer directly to PICU with dual digital acknowledgement, keeping Biomedical automatically informed with verified audit trails.
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigateTab('transfer')}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-sm flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Send className="w-4 h-4 text-slate-950" />
              <span>Transfer Equipment Now</span>
            </button>
            <button
              onClick={onOpenQR}
              className="px-4 py-3 bg-blue-600/80 hover:bg-blue-600 text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition-all border border-blue-400/40 active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan Asset QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Immediate Attention Alert Box if Pending Receipts */}
      {pendingReceipts.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckSquare className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-amber-950 text-base">
                  {pendingReceipts.length} Equipment Transfer{pendingReceipts.length > 1 ? 's' : ''} Awaiting Receipt!
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Dispatched to your ward. Please physically inspect equipment & accessories, then confirm receipt.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('acknowledge')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 flex items-center gap-1.5"
            >
              <span>Review & Acknowledge</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pendingReceipts.slice(0, 2).map((t) => (
              <div
                key={t.id}
                onClick={() => onNavigateTab('acknowledge')}
                className="bg-white p-3 rounded-xl border border-amber-200 cursor-pointer hover:border-amber-400 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                      {t.assetId}
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
                      {t.equipmentName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    From: <span className="font-medium text-slate-700">{t.fromDepartment}</span> • Ref: {t.transferRef}
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-700">Acknowledge →</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Action Touch Cards for Busy Staff */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <button
          onClick={() => onNavigateTab('transfer')}
          className="p-4 bg-white rounded-2xl border-2 border-emerald-500/20 hover:border-emerald-500 hover:shadow-md transition-all text-left flex flex-col justify-between group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <span className="block font-bold text-slate-900 text-sm">Transfer</span>
            <span className="text-[11px] text-slate-500">Dispatch to another ward</span>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('acknowledge')}
          className="p-4 bg-white rounded-2xl border-2 border-blue-500/20 hover:border-blue-500 hover:shadow-md transition-all text-left flex flex-col justify-between group relative"
        >
          {pendingReceipts.length > 0 && (
            <span className="absolute top-3 right-3 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
              {pendingReceipts.length}
            </span>
          )}
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="block font-bold text-slate-900 text-sm">Acknowledge</span>
            <span className="text-[11px] text-slate-500">Confirm received items</span>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('returns')}
          className="p-4 bg-white rounded-2xl border-2 border-purple-500/20 hover:border-purple-500 hover:shadow-md transition-all text-left flex flex-col justify-between group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <span className="block font-bold text-slate-900 text-sm">Returns</span>
            <span className="text-[11px] text-slate-500">Return borrowed equipment</span>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('equipment')}
          className="p-4 bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-400 hover:shadow-md transition-all text-left flex flex-col justify-between group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <span className="block font-bold text-slate-900 text-sm">Find Equipment</span>
            <span className="text-[11px] text-slate-500">Search hospital assets</span>
          </div>
        </button>
      </div>

      {/* Department Summary Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-base text-slate-900">
              {currentUser.department} Department Status
            </h2>
            <p className="text-xs text-slate-500">
              Active equipment transfers linked to {getDepartmentName(currentUser.department)}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('biomedical')}
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>Hospital Overview</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Equipment Borrowed from Other Wards */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-slate-600">Borrowed On Loan</span>
              <span className="font-bold text-lg text-blue-700">{borrowedByMe.length}</span>
            </div>
            {borrowedByMe.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No equipment currently borrowed.</p>
            ) : (
              <div className="space-y-2 mt-2">
                {borrowedByMe.map(t => (
                  <div key={t.id} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold font-mono text-slate-900">{t.assetId}</div>
                      <div className="text-[11px] text-slate-500">Owner: {t.owningDepartment}</div>
                    </div>
                    <button
                      onClick={() => onNavigateTab('returns')}
                      className="px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded text-[11px] font-semibold"
                    >
                      Return
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 2: Equipment Loaned Out to Other Wards */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-slate-600">Loaned to Others</span>
              <span className="font-bold text-lg text-indigo-700">{loanedOutByMe.length}</span>
            </div>
            {loanedOutByMe.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No equipment on loan to other wards.</p>
            ) : (
              <div className="space-y-2 mt-2">
                {loanedOutByMe.map(t => (
                  <div key={t.id} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold font-mono text-slate-900">{t.assetId}</div>
                      <div className="text-[11px] text-slate-500">At: {t.toDepartment}</div>
                    </div>
                    <button
                      onClick={() => onSelectTransferReceipt(t)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold"
                    >
                      Receipt
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 3: Discrepancy & Issue Alerts */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-slate-600">Reported Issues</span>
              <span className={`font-bold text-lg ${openDiscrepancies.length > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                {openDiscrepancies.length}
              </span>
            </div>
            {openDiscrepancies.length === 0 ? (
              <p className="text-xs text-slate-400 italic">All accessories and equipment intact.</p>
            ) : (
              <div className="space-y-2 mt-2">
                {openDiscrepancies.map(t => (
                  <div key={t.id} className="bg-red-50 p-2.5 rounded-lg border border-red-200 text-xs">
                    <div className="font-bold font-mono text-red-900">{t.assetId}</div>
                    <div className="text-[11px] text-red-700 truncate">
                      {t.discrepancies[t.discrepancies.length - 1]?.description || 'Issue flagged for Biomedical'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clinical Workflow Explanation Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800">
        <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          The 3-Status Handover Cycle: Pending Receipt → On Loan → Closed
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <strong className="text-amber-300 block mb-1">1. Pending Receipt</strong>
            Sending nurse photographs equipment & confirms dispatch. Equipment location remains sender ward until physically accepted.
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <strong className="text-blue-300 block mb-1">2. On Loan</strong>
            Receiving nurse checks accessories and condition, taps "Received". Location updates to receiving ward.
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <strong className="text-emerald-300 block mb-1">3. Closed</strong>
            Borrowing ward sends equipment back; owning ward inspects and taps "Received Back & Close". Full audit record saved.
          </div>
        </div>
      </div>
    </div>
  );
};
