import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TransferRecord, AccessoryItem, EquipmentCondition } from '../types';
import { api } from '../services/api';
import { RotateCcw, CheckCircle2, AlertTriangle, ArrowRight, Camera, FileText, Send, Share2, Clock, Check } from 'lucide-react';
import { getDepartmentName, formatIST, getStatusBadge } from '../utils/formatters';
import { IssueReportModal } from '../components/IssueReportModal';

interface ReturnsViewProps {
  transfers: TransferRecord[];
  onRefresh: () => void;
  onOpenReceipt: (transfer: TransferRecord) => void;
  onNavigateTab: (tab: string) => void;
}

export const ReturnsView: React.FC<ReturnsViewProps> = ({
  transfers,
  onRefresh,
  onOpenReceipt,
  onNavigateTab
}) => {
  const { currentUser, isBiomedical, isAdmin } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'borrowed' | 'loaned' | 'closed'>('borrowed');
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRecord | null>(null);

  // Return Dispatch Modal state (Borrower sending back)
  const [isReturnDispatchOpen, setIsReturnDispatchOpen] = useState(false);
  const [returnPhotoUrl, setReturnPhotoUrl] = useState('');
  const [returnCondition, setReturnCondition] = useState<EquipmentCondition>('GOOD');
  const [returnAccessories, setReturnAccessories] = useState<AccessoryItem[]>([]);
  const [returnNotes, setReturnNotes] = useState('');

  // Close Loan Modal state (Owner receiving back & closing)
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closeCondition, setCloseCondition] = useState<EquipmentCondition>('EXCELLENT');
  const [closeAccessories, setCloseAccessories] = useState<AccessoryItem[]>([]);
  const [closeNotes, setCloseNotes] = useState('');

  // Request Return modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestReason, setRequestReason] = useState('Urgent patient admission in owning department.');

  // Onward transfer modal state
  const [isOnwardModalOpen, setIsOnwardModalOpen] = useState(false);
  const [onwardDept, setOnwardDept] = useState<any>('OT-1');
  const [onwardReason, setOnwardReason] = useState('Emergency surgical requirement');

  // Issue modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  // Filter transfers based on current department:
  // 1. Borrowed by current department
  const borrowedTransfers = transfers.filter(t => 
    t.status === 'On Loan' && (isAdmin || isBiomedical || t.toDepartment === currentUser.department)
  );

  // 2. Loaned out by current department
  const loanedOutTransfers = transfers.filter(t => 
    t.status === 'On Loan' && (isAdmin || isBiomedical || t.owningDepartment === currentUser.department)
  );

  // 3. Closed records
  const closedTransfers = transfers.filter(t => 
    t.status === 'Closed' && (isAdmin || isBiomedical || t.owningDepartment === currentUser.department || t.toDepartment === currentUser.department)
  );

  // Open Return Dispatch Modal
  const handleOpenReturnDispatch = (transfer: TransferRecord) => {
    setSelectedTransfer(transfer);
    setReturnPhotoUrl(transfer.receivedPhotoUrl || transfer.dispatchPhotoUrl);
    setReturnCondition(transfer.receivedCondition || 'GOOD');
    setReturnAccessories(transfer.accessoriesReceived?.map(a => ({ ...a })) || []);
    setReturnNotes('Decontaminated and wiped down. Ready for return handover.');
    setIsReturnDispatchOpen(true);
  };

  const handleConfirmReturnDispatch = async () => {
    if (!selectedTransfer) return;
    setLoading(true);
    try {
      await api.dispatchReturn(selectedTransfer.id, {
        user: currentUser,
        returnDispatchPhotoUrl: returnPhotoUrl,
        returnDispatchCondition: returnCondition,
        returnAccessoriesSent: returnAccessories,
        returnDispatchNotes: returnNotes
      });
      setIsReturnDispatchOpen(false);
      onRefresh();
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Open Close Loan Modal (Original Owner receiving back)
  const handleOpenCloseModal = (transfer: TransferRecord) => {
    setSelectedTransfer(transfer);
    setCloseCondition(transfer.returnDispatchCondition || 'EXCELLENT');
    setCloseAccessories(transfer.accessoriesSent.map(a => ({ ...a, included: true })));
    setCloseNotes('All accessories verified and accounted for. Returned to department inventory.');
    setIsCloseModalOpen(true);
  };

  const handleConfirmClose = async () => {
    if (!selectedTransfer) return;
    setLoading(true);
    try {
      await api.closeTransfer(selectedTransfer.id, {
        user: currentUser,
        closeCondition,
        closeAccessoriesChecked: closeAccessories,
        closeNotes
      });
      setIsCloseModalOpen(false);
      onRefresh();
      alert(`Loan closed successfully! Asset ${selectedTransfer.assetId} confirmed back in ${selectedTransfer.owningDepartment}. Status is now Closed.`);
    } catch (e: any) {
      alert(e.message || 'Failed to close loan');
    } finally {
      setLoading(false);
    }
  };

  // Request Return
  const handleOpenRequestReturn = (transfer: TransferRecord) => {
    setSelectedTransfer(transfer);
    setIsRequestModalOpen(true);
  };

  const handleConfirmRequestReturn = async () => {
    if (!selectedTransfer) return;
    setLoading(true);
    try {
      await api.requestReturn(selectedTransfer.id, {
        user: currentUser,
        reason: requestReason
      });
      setIsRequestModalOpen(false);
      onRefresh();
      alert('Return request sent to ' + selectedTransfer.toDepartment);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Onward Transfer
  const handleOpenOnward = (transfer: TransferRecord) => {
    setSelectedTransfer(transfer);
    setIsOnwardModalOpen(true);
  };

  const handleConfirmOnward = async () => {
    if (!selectedTransfer) return;
    setLoading(true);
    try {
      await api.onwardTransfer({
        currentTransferId: selectedTransfer.id,
        toDepartment: onwardDept,
        user: currentUser,
        reason: onwardReason
      });
      setIsOnwardModalOpen(false);
      onRefresh();
      alert(`Onward transfer initiated to ${onwardDept}! Original owner (${selectedTransfer.owningDepartment}) preserved in movement chain.`);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReportIssue = (transfer: TransferRecord) => {
    setSelectedTransfer(transfer);
    setIsIssueModalOpen(true);
  };

  const handleIssueSubmit = async (report: { type: any; description: string; photoUrl?: string }) => {
    if (!selectedTransfer) return;
    try {
      await api.reportIssue(selectedTransfer.id, {
        user: currentUser,
        type: report.type,
        description: report.description,
        photoUrl: report.photoUrl
      });
      setIsIssueModalOpen(false);
      onRefresh();
      alert('Discrepancy registered! The transaction is held open for Biomedical review.');
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Equipment Return Tracking</h1>
          <p className="text-xs text-slate-500">
            3-Stage Handover Cycle: <strong className="text-slate-800">Pending Receipt → On Loan → Closed</strong>
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl max-w-xl">
        <button
          onClick={() => setActiveSubTab('borrowed')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'borrowed'
              ? 'bg-white text-purple-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Borrowed by Us ({borrowedTransfers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('loaned')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'loaned'
              ? 'bg-white text-blue-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Loaned Out ({loanedOutTransfers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('closed')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'closed'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Closed ({closedTransfers.length})</span>
        </button>
      </div>

      {/* 1. Borrowed Equipment Tab */}
      {activeSubTab === 'borrowed' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500 font-medium">
            Equipment currently in <strong className="text-slate-800">{currentUser.department}</strong> on loan from other departments. Tap "Return Equipment" when patient no longer requires it.
          </div>

          {borrowedTransfers.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center max-w-md mx-auto">
              <RotateCcw className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-sm">No Borrowed Equipment</p>
              <p className="text-xs text-slate-400 mt-1">Your department currently has no active borrowed loans.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {borrowedTransfers.map((t) => (
                <div key={t.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                          {t.assetId}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{t.equipmentName}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{t.transferRef}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <img src={t.receivedPhotoUrl || t.dispatchPhotoUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                      <div className="text-xs space-y-1">
                        <div>Owning Department: <strong className="text-indigo-700">{t.owningDepartment}</strong></div>
                        <div>Received on: <span className="font-mono text-slate-600">{t.receivedAt || t.dispatchedAt}</span></div>
                        <div>Acknowledged By: <span className="font-medium text-slate-800">{t.receivedBy?.name || 'Pending'}</span></div>
                        {t.expectedReturnDate && (
                          <div className="text-rose-700 font-semibold">
                            Due Back: {t.expectedReturnDate}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Return requested banner */}
                    {t.returnRequested && !t.returnDispatched && (
                      <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Return Requested by Owner:</strong> {t.returnRequestReason}
                        </div>
                      </div>
                    )}

                    {t.returnDispatched && (
                      <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Return dispatched by you! Awaiting {t.owningDepartment} receipt & close.</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    {!t.returnDispatched ? (
                      <button
                        onClick={() => handleOpenReturnDispatch(t)}
                        className="flex-1 py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Return Equipment</span>
                      </button>
                    ) : (
                      <span className="flex-1 text-center py-2 text-xs font-bold text-amber-700 bg-amber-50 rounded-xl border border-amber-200">
                        In Transit Back to {t.owningDepartment}
                      </span>
                    )}

                    <button
                      onClick={() => handleOpenOnward(t)}
                      className="py-2.5 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1"
                      title="Transfer onward to a 3rd ward while preserving original owner"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Onward</span>
                    </button>

                    <button
                      onClick={() => onOpenReceipt(t)}
                      className="py-2.5 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>

                    <button
                      onClick={() => handleReportIssue(t)}
                      className="py-2.5 px-2.5 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold"
                      title="Report issue with equipment"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Loaned Out Equipment Tab */}
      {activeSubTab === 'loaned' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500 font-medium">
            Equipment owned by <strong className="text-slate-800">{currentUser.department}</strong> currently on loan to other wards. Tap "Request Return" or verify and tap "Received Back & Close".
          </div>

          {loanedOutTransfers.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center max-w-md mx-auto">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-sm">No Active Outgoing Loans</p>
              <p className="text-xs text-slate-400 mt-1">All department equipment is currently present in your ward.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loanedOutTransfers.map((t) => (
                <div key={t.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                          {t.assetId}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{t.equipmentName}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{t.transferRef}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <img src={t.dispatchPhotoUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                      <div className="text-xs space-y-1">
                        <div>Currently Loaned To: <strong className="text-blue-700">{t.toDepartment}</strong></div>
                        <div>Dispatched by: <span className="font-medium text-slate-800">{t.dispatchedBy.name}</span></div>
                        <div>Acknowledged by: <span className="font-medium text-slate-800">{t.receivedBy?.name || 'Pending'}</span></div>
                        {t.expectedReturnDate && (
                          <div className="text-rose-700 font-semibold">
                            Due Back: {t.expectedReturnDate}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Return status */}
                    {t.returnDispatched ? (
                      <div className="mt-3 p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl text-xs text-emerald-950 flex items-center justify-between">
                        <div>
                          <strong>Returned by {t.toDepartment}!</strong>
                          <div className="text-[11px] text-emerald-800">Equipment has arrived back at your ward. Inspect accessories & close.</div>
                        </div>
                      </div>
                    ) : t.returnRequested ? (
                      <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                        Return request submitted. Awaiting {t.toDepartment} return dispatch.
                      </div>
                    ) : null}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    {t.returnDispatched ? (
                      <button
                        onClick={() => handleOpenCloseModal(t)}
                        className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md active:scale-98"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Received Back & Close Loan</span>
                      </button>
                    ) : (
                      <>
                        {!t.returnRequested && (
                          <button
                            onClick={() => handleOpenRequestReturn(t)}
                            className="flex-1 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Request Return</span>
                          </button>
                        )}
                        {/* Allow direct close if returned physically without advance button */}
                        <button
                          onClick={() => handleOpenCloseModal(t)}
                          className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl"
                          title="If equipment was physically brought back, verify and close"
                        >
                          Verify & Close
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => onOpenReceipt(t)}
                      className="py-2.5 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>

                    <button
                      onClick={() => handleReportIssue(t)}
                      className="py-2.5 px-2.5 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold"
                      title="Report issue or missing accessory"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Closed Records Tab */}
      {activeSubTab === 'closed' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500 font-medium">
            Searchable historical archive of closed and verified equipment loans with complete proof and dual signatures.
          </div>

          <div className="space-y-2.5">
            {closedTransfers.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                    ✓
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {t.assetId}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{t.equipmentName}</span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Closed
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Loaned: {t.fromDepartment} → {t.toDepartment} • Closed by: <strong>{t.closedBy?.name || 'Verified'}</strong> on {t.closedAt || t.dispatchedAt}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onOpenReceipt(t)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Audit Certificate</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Return Dispatch Modal (Borrower -> Owner) */}
      {isReturnDispatchOpen && selectedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  Dispatch Return to Owner
                </span>
                <h3 className="font-black text-base text-slate-900 mt-1">
                  Return {selectedTransfer.assetId} to {selectedTransfer.owningDepartment}
                </h3>
              </div>
              <button onClick={() => setIsReturnDispatchOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {/* Condition */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Return Condition (Observed)
              </label>
              <select
                value={returnCondition}
                onChange={(e) => setReturnCondition(e.target.value as EquipmentCondition)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
              >
                <option value="EXCELLENT">Excellent (Decontaminated, Complete)</option>
                <option value="GOOD">Good Working Condition</option>
                <option value="MINOR_WEAR">Minor Wear</option>
                <option value="NEEDS_CLEANING">Needs Surface Disinfection</option>
              </select>
            </div>

            {/* Accessories Checklist */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Check Accessories Packed for Return
              </label>
              <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                {returnAccessories.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setReturnAccessories(prev =>
                        prev.map(a => a.id === acc.id ? { ...a, included: !a.included } : a)
                      );
                    }}
                    className={`w-full p-2 rounded-lg border text-left text-xs flex items-center justify-between ${
                      acc.included ? 'bg-white border-emerald-500 font-semibold text-slate-900' : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                    }`}
                  >
                    <span>{acc.name}</span>
                    <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${acc.included ? 'bg-emerald-600 text-white' : 'border border-slate-300'}`}>
                      {acc.included && '✓'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Return Notes / Decontamination Statement
              </label>
              <input
                type="text"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
              <span>Authenticated By: <strong>{currentUser.name}</strong> ({currentUser.staffId})</span>
              <span className="text-slate-400 font-mono text-[10px]">IST Timestamped</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsReturnDispatchOpen(false)}
                className="flex-1 py-2.5 px-4 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReturnDispatch}
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                {loading ? 'Dispatching...' : 'Confirm Return Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Loan Modal (Original Department Staff checks and taps Received Back & Close) */}
      {isCloseModalOpen && selectedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Step 4: Close Transaction
                </span>
                <h3 className="font-black text-base text-slate-900 mt-1">
                  Received Back & Close Loan: {selectedTransfer.assetId}
                </h3>
              </div>
              <button onClick={() => setIsCloseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950">
              <strong>Return Verification:</strong> Original department staff check the equipment and accessories, then tap "Received Back & Close". Confirmed location returns to <strong>{selectedTransfer.owningDepartment}</strong>.
            </div>

            {/* Condition */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Inspected Physical Condition
              </label>
              <select
                value={closeCondition}
                onChange={(e) => setCloseCondition(e.target.value as EquipmentCondition)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
              >
                <option value="EXCELLENT">Excellent (Ready for next patient)</option>
                <option value="GOOD">Good Working Condition</option>
                <option value="MINOR_WEAR">Minor Wear</option>
                <option value="NEEDS_CLEANING">Needs Disinfection</option>
              </select>
            </div>

            {/* Accessories Checklist */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Verify All Accessories Returned Intact
              </label>
              <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                {closeAccessories.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setCloseAccessories(prev =>
                        prev.map(a => a.id === acc.id ? { ...a, included: !a.included } : a)
                      );
                    }}
                    className={`w-full p-2 rounded-lg border text-left text-xs flex items-center justify-between ${
                      acc.included ? 'bg-white border-emerald-500 font-semibold text-slate-900' : 'bg-red-50 border-red-300 text-red-800 line-through'
                    }`}
                  >
                    <span>{acc.name}</span>
                    <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${acc.included ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                      {acc.included ? '✓' : '✗'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Closing Remarks & Confirmation
              </label>
              <input
                type="text"
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
              <span>Closing Staff: <strong>{currentUser.name}</strong> ({currentUser.staffId})</span>
              <span className="text-slate-500 font-mono text-[10px]">{currentUser.department}</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCloseModalOpen(false)}
                className="flex-1 py-3 px-4 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg active:scale-98"
              >
                {loading ? 'Closing Loan...' : 'Received Back & Close (Status → Closed)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Return Modal */}
      {isRequestModalOpen && selectedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 p-6 space-y-4">
            <h3 className="font-black text-base text-slate-900">
              Request Return of {selectedTransfer.assetId}
            </h3>
            <p className="text-xs text-slate-500">
              Sends an urgent return alert to <strong>{selectedTransfer.toDepartment}</strong> requesting the equipment back.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Clinical Urgency / Reason</label>
              <textarea
                rows={3}
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="flex-1 py-2 px-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRequestReturn}
                disabled={loading}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Send Return Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onward Transfer Modal (ICU -> PICU -> OT) */}
      {isOnwardModalOpen && selectedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 p-6 space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                Multi-Ward Movement
              </span>
              <h3 className="font-black text-base text-slate-900 mt-1">
                Onward Transfer: {selectedTransfer.assetId}
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Transfer this equipment from <strong>{selectedTransfer.toDepartment}</strong> directly to another ward, while preserving original owner (<strong>{selectedTransfer.owningDepartment}</strong>) and recording continuous custody.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">New Destination Ward</label>
              <select
                value={onwardDept}
                onChange={(e) => setOnwardDept(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
              >
                <option value="OT-1">Main Operating Theatre (OT-1)</option>
                <option value="OT-2">Emergency OT (OT-2)</option>
                <option value="NICU">Neonatal ICU (NICU)</option>
                <option value="ER">Emergency & Trauma (ER)</option>
                <option value="DIALYSIS">Dialysis Unit</option>
                <option value="GENERAL_WARD">General Ward</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Clinical Justification</label>
              <input
                type="text"
                value={onwardReason}
                onChange={(e) => setOnwardReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsOnwardModalOpen(false)}
                className="flex-1 py-2 px-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmOnward}
                disabled={loading}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Confirm Onward Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discrepancy Modal */}
      {selectedTransfer && (
        <IssueReportModal
          isOpen={isIssueModalOpen}
          onClose={() => setIsIssueModalOpen(false)}
          equipmentAssetId={selectedTransfer.assetId}
          onSubmit={handleIssueSubmit}
        />
      )}
    </div>
  );
};
