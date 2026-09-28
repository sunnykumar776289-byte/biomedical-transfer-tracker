import React from 'react';
import { TransferRecord } from '../types';
import { getDepartmentName, formatIST, getStatusBadge, getConditionBadge } from '../utils/formatters';
import { Printer, Download, X, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';

interface TransferReceiptModalProps {
  transfer: TransferRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransferReceiptModal: React.FC<TransferReceiptModalProps> = ({
  transfer,
  isOpen,
  onClose
}) => {
  if (!isOpen || !transfer) return null;

  const handlePrint = () => {
    window.print();
  };

  const statusBadge = getStatusBadge(transfer.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Header Action Bar (Hidden on print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-semibold text-base leading-tight">Equipment Handover Certificate & Receipt</h2>
              <p className="text-xs text-slate-300">Official biomedical transfer audit record</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
            <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Body */}
        <div id="printable-receipt" className="p-8 text-slate-900 space-y-6 print:p-0">
          {/* Hospital Header Banner */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-700 text-white font-bold flex items-center justify-center text-lg">
                  +
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900">
                    APOLLO CITY HOSPITAL & RESEARCH INSTITUTE
                  </h1>
                  <p className="text-xs uppercase tracking-wider text-slate-600 font-semibold">
                    Biomedical Engineering & Clinical Equipment Directorate
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Hospital Asset Transfer & Dual-Acknowledgement Certificate (NABH & ISO 13485 Compliant)
              </p>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500 font-mono">Transfer Reference:</div>
              <div className="text-base font-black font-mono text-blue-800 tracking-wider">
                {transfer.transferRef}
              </div>
              <div className="mt-1">
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${statusBadge.color}`}>
                  <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`}></span>
                  {transfer.status === 'Pending Receipt' ? 'RECEIPT PENDING (IN TRANSIT)' : transfer.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Prominent Warning if Pending Receipt */}
          {transfer.status === 'Pending Receipt' && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-3 text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="text-xs">
                <strong>RECEIPT PENDING NOTICE:</strong> This equipment has been dispatched by {transfer.fromDepartment}, but has <strong>NOT YET</strong> been acknowledged by {transfer.toDepartment}. This is <strong>not</strong> a finalized handover certificate until acknowledged by receiving staff.
              </div>
            </div>
          )}

          {/* Equipment Specifications Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Equipment Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Hospital Asset ID:</span>
                <span className="font-mono font-bold text-sm text-slate-900">{transfer.assetId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Equipment Name:</span>
                <span className="font-semibold text-slate-900">{transfer.equipmentName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Owning Department:</span>
                <span className="font-bold text-indigo-700">{getDepartmentName(transfer.owningDepartment)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Current Movement Leg:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  {transfer.fromDepartment} <ArrowRight className="w-3 h-3 text-slate-400" /> {transfer.toDepartment}
                </span>
              </div>
            </div>
          </div>

          {/* Dual Handover Columns: Dispatch vs Receipt */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Sending Department Dispatch */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white text-[11px] flex items-center justify-center font-bold">1</span>
                  Dispatch Authentication (Sender)
                </span>
                <span className="text-[11px] font-mono text-slate-500">{transfer.dispatchedAt}</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-500">Sending Ward:</span>{' '}
                  <span className="font-bold text-slate-800">{getDepartmentName(transfer.fromDepartment)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Authenticated Staff:</span>{' '}
                  <span className="font-semibold text-slate-900">{transfer.dispatchedBy.name}</span>{' '}
                  <span className="font-mono text-slate-600">({transfer.dispatchedBy.staffId})</span>
                </div>
                <div>
                  <span className="text-slate-500">Staff Designation:</span>{' '}
                  <span className="text-slate-700">{transfer.dispatchedBy.designation}</span>
                </div>
                <div>
                  <span className="text-slate-500">Condition at Dispatch:</span>{' '}
                  <span className="font-medium text-emerald-800">{transfer.dispatchCondition}</span>
                </div>
                {transfer.expectedReturnDate && (
                  <div>
                    <span className="text-slate-500">Expected Return:</span>{' '}
                    <span className="font-semibold text-rose-700">{transfer.expectedReturnDate}</span>
                  </div>
                )}
                {transfer.transferReason && (
                  <div>
                    <span className="text-slate-500">Clinical Transfer Reason:</span>{' '}
                    <span className="italic text-slate-800">{transfer.transferReason}</span>
                  </div>
                )}
              </div>

              {/* Photo at dispatch */}
              {transfer.dispatchPhotoUrl && (
                <div className="mt-2">
                  <span className="text-[11px] text-slate-500 block mb-1">Dispatch Equipment Photo:</span>
                  <img
                    src={transfer.dispatchPhotoUrl}
                    alt="Dispatch"
                    className="w-full h-32 object-cover rounded-lg border border-slate-200"
                  />
                </div>
              )}
            </div>

            {/* Step 2: Receiving Department Acknowledgement */}
            <div className={`border rounded-xl p-4 space-y-3 ${
              transfer.receivedBy ? 'border-slate-200 bg-slate-50/50' : 'border-dashed border-amber-300 bg-amber-50/30'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white text-[11px] flex items-center justify-center font-bold">2</span>
                  Receipt Acknowledgement (Receiver)
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {transfer.receivedAt || 'Awaiting Physical Receipt'}
                </span>
              </div>

              {transfer.receivedBy ? (
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-500">Receiving Ward:</span>{' '}
                    <span className="font-bold text-slate-800">{getDepartmentName(transfer.toDepartment)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Authenticated Staff:</span>{' '}
                    <span className="font-semibold text-slate-900">{transfer.receivedBy.name}</span>{' '}
                    <span className="font-mono text-slate-600">({transfer.receivedBy.staffId})</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Staff Designation:</span>{' '}
                    <span className="text-slate-700">{transfer.receivedBy.designation}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Condition Verified:</span>{' '}
                    <span className="font-medium text-emerald-800">{transfer.receivedCondition || 'Good'}</span>
                  </div>
                  {transfer.receiverNotes && (
                    <div>
                      <span className="text-slate-500">Receiver Remarks:</span>{' '}
                      <span className="italic text-slate-800">{transfer.receiverNotes}</span>
                    </div>
                  )}

                  {/* Photo at receipt */}
                  {transfer.receivedPhotoUrl && (
                    <div className="mt-2">
                      <span className="text-[11px] text-slate-500 block mb-1">Receipt Verification Photo:</span>
                      <img
                        src={transfer.receivedPhotoUrl}
                        alt="Receipt"
                        className="w-full h-32 object-cover rounded-lg border border-slate-200"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-amber-800">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="font-bold text-xs uppercase">Pending Receiving Acknowledgement</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                    Receiving nurse in {transfer.toDepartment} must physically inspect the equipment and tap "Received" on terminal.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Accessories Checked */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/30">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Accessories & Component Verification
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {transfer.accessoriesSent.map((acc, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${acc.included ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span className={acc.included ? 'font-medium' : 'line-through text-slate-400'}>
                    {acc.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Return & Closure Audit (if closed or returned) */}
          {transfer.status === 'Closed' && (
            <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Return & Loan Closure Audit
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Closed By:</span>
                  <span className="font-semibold text-slate-900">{transfer.closedBy?.name}</span>
                  <span className="text-slate-500 block font-mono text-[11px]">({transfer.closedBy?.staffId})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Closure Timestamp:</span>
                  <span className="font-mono text-slate-800">{transfer.closedAt}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Returned Location:</span>
                  <span className="font-bold text-indigo-700">{getDepartmentName(transfer.owningDepartment)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Closing Remarks:</span>
                  <span className="italic text-slate-800">{transfer.closeNotes || 'Verified and restored to inventory.'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Discrepancies if any */}
          {transfer.discrepancies.length > 0 && (
            <div className="border border-red-200 bg-red-50/50 rounded-xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-900 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Reported Issues & Discrepancies
              </h4>
              <div className="space-y-2">
                {transfer.discrepancies.map((d) => (
                  <div key={d.id} className="text-xs p-2.5 rounded bg-white border border-red-200 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-red-800 uppercase text-[11px]">[{d.type}]</span>
                      <span className="text-[11px] font-mono text-slate-500">{d.reportedAt}</span>
                    </div>
                    <p className="text-slate-800">{d.description}</p>
                    <div className="text-[11px] text-slate-500">
                      Reported by: <strong>{d.reportedBy.name}</strong> ({d.reportedBy.department})
                      {d.resolved ? (
                        <span className="ml-2 text-emerald-700 font-bold">
                          ✓ Resolved by {d.resolvedBy?.name} ({d.resolutionNotes})
                        </span>
                      ) : (
                        <span className="ml-2 text-red-600 font-bold">⚠ Open / Under Biomedical Review</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legal and Digital Audit Signature Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <div className="text-[11px] text-slate-500 max-w-md">
              This is a tamper-evident digital transfer certificate generated by Apollo Biomedical Equipment Transfer Register. Hospital policy strictly prohibits unrecorded physical transfers between wards.
            </div>
            <div className="text-right border-l-2 border-emerald-500 pl-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Digitally Authenticated
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                System Time: {transfer.dispatchedAt}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
