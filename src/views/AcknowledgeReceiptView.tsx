import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TransferRecord, AccessoryItem, EquipmentCondition } from '../types';
import { api } from '../services/api';
import { CheckSquare, Camera, AlertTriangle, CheckCircle2, XCircle, ArrowRight, ShieldCheck, Clock, FileText } from 'lucide-react';
import { getDepartmentName, formatIST, getConditionBadge } from '../utils/formatters';
import { IssueReportModal } from '../components/IssueReportModal';

interface AcknowledgeReceiptViewProps {
  transfers: TransferRecord[];
  onRefresh: () => void;
  onOpenReceipt: (transfer: TransferRecord) => void;
}

export const AcknowledgeReceiptView: React.FC<AcknowledgeReceiptViewProps> = ({
  transfers,
  onRefresh,
  onOpenReceipt
}) => {
  const { currentUser, isBiomedical, isAdmin } = useAuth();

  // Pending transfers targeting the current department
  const pendingTransfers = transfers.filter(t => {
    if (t.status !== 'Pending Receipt') return false;
    if (isAdmin || isBiomedical) return true;
    return t.toDepartment === currentUser.department;
  });

  const [selectedTransfer, setSelectedTransfer] = useState<TransferRecord | null>(
    pendingTransfers.length > 0 ? pendingTransfers[0] : null
  );

  // Form states for receipt
  const [receivedPhotoUrl, setReceivedPhotoUrl] = useState<string>('');
  const [receivedCondition, setReceivedCondition] = useState<EquipmentCondition>('GOOD');
  const [accessoriesChecked, setAccessoriesChecked] = useState<AccessoryItem[]>([]);
  const [receiverNotes, setReceiverNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Issue modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // Initialize accessories when a transfer is picked
  const handleSelectTransfer = (transfer: TransferRecord) => {
    setSelectedTransfer(transfer);
    setAccessoriesChecked(transfer.accessoriesSent.map(a => ({ ...a })));
    setReceivedPhotoUrl(transfer.dispatchPhotoUrl);
    setReceivedCondition(transfer.dispatchCondition);
    setReceiverNotes('');
    setErrorMessage(null);
  };

  const handleToggleAccessory = (id: string) => {
    setAccessoriesChecked(prev =>
      prev.map(a => a.id === id ? { ...a, included: !a.included } : a)
    );
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setReceivedPhotoUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmReceived = async () => {
    if (!selectedTransfer) return;
    setLoading(true);
    setErrorMessage(null);

    // Check if any accessories were unchecked - prompt to log discrepancy if so!
    const missingAccessories = accessoriesChecked.filter(a => !a.included);
    let discrepancyPayload: any = undefined;

    if (missingAccessories.length > 0) {
      discrepancyPayload = {
        type: 'MISSING_ACCESSORY',
        description: `Missing accessories at receipt: ${missingAccessories.map(a => a.name).join(', ')}`
      };
    }

    try {
      await api.acknowledgeTransfer(selectedTransfer.id, {
        user: currentUser,
        receivedPhotoUrl,
        receivedCondition,
        accessoriesReceived: accessoriesChecked,
        receiverNotes: receiverNotes || 'Received and physically verified in ward.',
        discrepancy: discrepancyPayload
      });

      onRefresh();
      setSelectedTransfer(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to acknowledge receipt.');
    } finally {
      setLoading(false);
    }
  };

  const handleReportIssueSubmit = async (report: { type: any; description: string; photoUrl?: string }) => {
    if (!selectedTransfer) return;
    try {
      await api.reportIssue(selectedTransfer.id, {
        user: currentUser,
        type: report.type,
        description: report.description,
        photoUrl: report.photoUrl
      });
      onRefresh();
      alert('Discrepancy reported! The transaction remains open for Biomedical review.');
    } catch (err: any) {
      alert('Error: ' + err);
    }
  };

  const handleMarkNotReceived = async () => {
    if (!selectedTransfer) return;
    if (!confirm(`Mark ${selectedTransfer.assetId} as "Not Received"? This flags an immediate clinical discrepancy for Biomedical investigation.`)) return;

    try {
      await api.reportIssue(selectedTransfer.id, {
        user: currentUser,
        type: 'NOT_RECEIVED',
        description: `Marked NOT RECEIVED by ${currentUser.name} at ${currentUser.department}. Equipment did not arrive physically.`
      });
      onRefresh();
      alert('Flagged as Not Received. Biomedical Engineering alerted.');
    } catch (err: any) {
      alert('Error: ' + err);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Acknowledge Equipment Receipt
          </h1>
          <p className="text-xs text-slate-500">
            Physical inspection & verification for equipment incoming to <strong className="text-slate-800">{currentUser.department}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 bg-amber-100 text-amber-900 rounded-full border border-amber-200">
            {pendingTransfers.length} Pending Handover{pendingTransfers.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {pendingTransfers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-lg">No Pending Handovers</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            All equipment dispatched to {currentUser.department} has been acknowledged. Check "Returns" or "Home" for active loans.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Pending List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Dispatches to {currentUser.department}
            </div>

            <div className="space-y-2.5">
              {pendingTransfers.map((t) => {
                const isSelected = selectedTransfer?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTransfer(t)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all relative ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={t.dispatchPhotoUrl}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-mono font-bold text-xs text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                            {t.assetId}
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {t.equipmentName}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 space-y-0.5">
                          <div>
                            Dispatched from: <strong className="text-slate-900">{t.fromDepartment}</strong>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            By {t.dispatchedBy.name} ({t.dispatchedBy.staffId})
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {t.dispatchedAt}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-amber-700 font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        Receipt Pending
                      </span>
                      <span className="font-bold text-blue-600">Review & Inspect →</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Physical Inspection & Acknowledgement Form */}
          <div className="lg:col-span-7">
            {selectedTransfer ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Step 2: Receiving Acknowledgement
                    </span>
                    <h2 className="text-lg font-black text-slate-900 mt-1">
                      Inspect {selectedTransfer.assetId}
                    </h2>
                    <p className="text-xs font-mono text-slate-500">
                      Transfer Ref: {selectedTransfer.transferRef}
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenReceipt(selectedTransfer)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Receipt</span>
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
                    {errorMessage}
                  </div>
                )}

                {/* Dispatch Photo vs Receiving Verification */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                    <span className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                      Sender's Photo ({selectedTransfer.fromDepartment})
                    </span>
                    <img
                      src={selectedTransfer.dispatchPhotoUrl}
                      alt="Dispatch"
                      className="w-full h-32 object-cover rounded-lg border border-slate-200"
                    />
                    <div className="text-[11px] text-slate-500 mt-1">
                      Condition: <strong>{selectedTransfer.dispatchCondition}</strong>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                        Receiver Inspection Photo
                      </span>
                      {receivedPhotoUrl ? (
                        <img
                          src={receivedPhotoUrl}
                          alt="Receipt"
                          className="w-full h-32 object-cover rounded-lg border border-slate-200"
                        />
                      ) : (
                        <div className="w-full h-32 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                          <Camera className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <label className="mt-2 cursor-pointer w-full py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg text-center block transition-colors">
                      <Camera className="w-3.5 h-3.5 inline mr-1" />
                      Take Photo
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoCapture}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Accessories Checklist Verification */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Verify Accessories Received
                    </span>
                    <span className="text-[11px] text-slate-500">Tap to toggle missing items</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {accessoriesChecked.map((acc) => (
                      <button
                        type="button"
                        key={acc.id}
                        onClick={() => handleToggleAccessory(acc.id)}
                        className={`p-2 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                          acc.included
                            ? 'bg-emerald-50/50 border-emerald-400 text-emerald-950 font-semibold'
                            : 'bg-red-50 border-red-300 text-red-800 line-through'
                        }`}
                      >
                        <span>{acc.name}</span>
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                          acc.included ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {acc.included ? '✓' : '✗'}
                        </span>
                      </button>
                    ))}
                  </div>

                  {accessoriesChecked.some(a => !a.included) && (
                    <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>
                        Unchecked items will automatically be flagged as missing and reported to Biomedical.
                      </span>
                    </div>
                  )}
                </div>

                {/* Verified Condition */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Received Physical Condition
                    </label>
                    <select
                      value={receivedCondition}
                      onChange={(e) => setReceivedCondition(e.target.value as EquipmentCondition)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
                    >
                      <option value="EXCELLENT">Excellent (Like New)</option>
                      <option value="GOOD">Good Working Condition</option>
                      <option value="MINOR_WEAR">Minor Cosmetic Wear</option>
                      <option value="NEEDS_CLEANING">Needs Surface Cleaning</option>
                      <option value="DAMAGED">Damaged / Flawed</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Receiver Inspection Remarks
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cleaned and plugged into bedside outlet..."
                      value={receiverNotes}
                      onChange={(e) => setReceiverNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Authenticated Receiver Signature Banner */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>
                      Receiver Authentication: <strong>{currentUser.name}</strong> ({currentUser.staffId})
                    </span>
                  </div>
                  <span className="font-mono text-slate-500 text-[11px]">Department: {currentUser.department}</span>
                </div>

                {/* Action Buttons: 3 Core Statuses: Pending Receipt -> On Loan */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmReceived}
                    disabled={loading}
                    className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black rounded-2xl text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>
                      {loading ? 'Confirming Receipt...' : 'Confirm Receipt (Status → On Loan)'}
                    </span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsIssueModalOpen(true)}
                      className="py-2.5 px-3 border border-red-300 hover:bg-red-50 text-red-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Report Discrepancy</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleMarkNotReceived}
                      className="py-2.5 px-3 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>Mark Not Received</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500">
                Select a pending dispatch from the left to inspect and acknowledge.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Discrepancy Modal */}
      {selectedTransfer && (
        <IssueReportModal
          isOpen={isIssueModalOpen}
          onClose={() => setIsIssueModalOpen(false)}
          equipmentAssetId={selectedTransfer.assetId}
          onSubmit={handleReportIssueSubmit}
        />
      )}
    </div>
  );
};
