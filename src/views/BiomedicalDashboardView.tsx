import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Equipment, TransferRecord, AuditLog } from '../types';
import { api } from '../services/api';
import { 
  BarChart3, 
  Search, 
  Download, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Activity, 
  Filter, 
  FileText, 
  ShieldCheck, 
  Wrench, 
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { getDepartmentName, formatIST, getStatusBadge } from '../utils/formatters';

interface BiomedicalDashboardViewProps {
  equipmentList: Equipment[];
  transfers: TransferRecord[];
  auditLogs: AuditLog[];
  onRefresh: () => void;
  onOpenReceipt: (transfer: TransferRecord) => void;
}

export const BiomedicalDashboardView: React.FC<BiomedicalDashboardViewProps> = ({
  equipmentList,
  transfers,
  auditLogs,
  onRefresh,
  onOpenReceipt
}) => {
  const { currentUser, isBiomedical } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'on_loan' | 'pending' | 'overdue' | 'discrepancies' | 'audit'>('overview');
  const [searchFilter, setSearchFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Discrepancy resolution state
  const [resolvingDiscrepancy, setResolvingDiscrepancy] = useState<{ transferId: string; discrepancyId: string } | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Metrics
  const onLoanTransfers = transfers.filter(t => t.status === 'On Loan');
  const pendingReceiptTransfers = transfers.filter(t => t.status === 'Pending Receipt');
  const returnRequestedTransfers = transfers.filter(t => t.status === 'On Loan' && t.returnRequested);
  
  // Overdue returns: status === 'On Loan' and expectedReturnDate < today
  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueTransfers = transfers.filter(t => 
    t.status === 'On Loan' && t.expectedReturnDate && t.expectedReturnDate < todayStr
  );

  const discrepancyTransfers = transfers.filter(t => t.discrepancies.length > 0);
  const openDiscrepancyTransfers = transfers.filter(t => t.hasOpenDiscrepancy);
  const closedTransfers = transfers.filter(t => t.status === 'Closed');

  // Equipment by current department count
  const deptCounts: Record<string, number> = {};
  equipmentList.forEach(e => {
    deptCounts[e.currentConfirmedDepartment] = (deptCounts[e.currentConfirmedDepartment] || 0) + 1;
  });

  const handleDownloadCSV = (type: 'transfers' | 'equipment') => {
    window.location.href = `/api/export/csv?type=${type}`;
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingDiscrepancy) return;
    try {
      await api.resolveIssue(resolvingDiscrepancy.transferId, {
        discrepancyId: resolvingDiscrepancy.discrepancyId,
        user: currentUser,
        resolutionNotes: resolutionNotes || 'Inspected and certified by Biomedical Engineering.'
      });
      setResolvingDiscrepancy(null);
      setResolutionNotes('');
      onRefresh();
      alert('Discrepancy resolved and signed off by Biomedical!');
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Biomedical Engineering Dashboard</h1>
            <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
              Live Registry
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time hospital-wide equipment location, loan tracking, overdue alerts, and issue resolution
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadCSV('transfers')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Transfers (CSV)</span>
          </button>
          <button
            onClick={() => handleDownloadCSV('equipment')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Assets (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setActiveTab('on_loan')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeTab === 'on_loan' ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Currently On Loan
          </span>
          <div className="text-2xl font-black text-blue-700 mt-1">{onLoanTransfers.length}</div>
          <span className="text-[11px] text-slate-500">Across wards</span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative ${
            activeTab === 'pending' ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Awaiting Receipt
          </span>
          <div className="text-2xl font-black text-amber-700 mt-1">{pendingReceiptTransfers.length}</div>
          <span className="text-[11px] text-amber-600 font-medium">In transit</span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeTab === 'overdue' ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Overdue Returns
          </span>
          <div className={`text-2xl font-black mt-1 ${overdueTransfers.length > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {overdueTransfers.length}
          </div>
          <span className="text-[11px] text-rose-600">Past target date</span>
        </button>

        <button
          onClick={() => setActiveTab('discrepancies')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeTab === 'discrepancies' ? 'bg-red-50 border-red-500 ring-2 ring-red-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Open Issues
          </span>
          <div className={`text-2xl font-black mt-1 ${openDiscrepancyTransfers.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {openDiscrepancyTransfers.length}
          </div>
          <span className="text-[11px] text-slate-500">Requires review</span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeTab === 'overview' ? 'bg-slate-50 border-slate-500 ring-2 ring-slate-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Total Assets
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{equipmentList.length}</div>
          <span className="text-[11px] text-slate-500">Hospital register</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeTab === 'audit' ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Audit Events
          </span>
          <div className="text-2xl font-black text-indigo-700 mt-1">{auditLogs.length}</div>
          <span className="text-[11px] text-slate-500">Immutable trail</span>
        </button>
      </div>

      {/* Hospital Ward Distribution Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-600" />
            Equipment Confirmed Distribution Across Hospital Wards
          </span>
          <span className="text-[11px] text-slate-500">Live verified locations</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {Object.entries(deptCounts).map(([dept, count]) => (
            <div key={dept} className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-800">{dept}:</span>
              <span className="font-mono font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded text-[11px]">
                {count} unit{count > 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-black text-base text-slate-900">Hospital Equipment Status Board</h2>
              <p className="text-xs text-slate-500">Complete listing of equipment, confirmed location, and active custodian</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Asset ID</th>
                  <th className="py-2.5 px-3">Equipment Name</th>
                  <th className="py-2.5 px-3">Owning Ward</th>
                  <th className="py-2.5 px-3">Confirmed Location</th>
                  <th className="py-2.5 px-3">Availability</th>
                  <th className="py-2.5 px-3">Last Maint</th>
                  <th className="py-2.5 px-3 text-right">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {equipmentList.map((eq) => {
                  const activeTransfer = transfers.find(t => 
                    t.equipmentId === eq.id && (t.status === 'Pending Receipt' || t.status === 'On Loan')
                  );

                  return (
                    <tr key={eq.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-blue-800">{eq.assetId}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {eq.name}
                        <div className="text-[10px] text-slate-400 font-normal">{eq.manufacturer} • SN: {eq.serialNumber}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">{eq.owningDepartment}</td>
                      <td className="py-3 px-3">
                        <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          eq.currentConfirmedDepartment !== eq.owningDepartment
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {eq.currentConfirmedDepartment}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          eq.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                          eq.status === 'IN_USE' ? 'bg-blue-100 text-blue-800' :
                          eq.status === 'IN_TRANSIT' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {eq.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{eq.lastMaintenanceDate}</td>
                      <td className="py-3 px-3 text-right">
                        {activeTransfer ? (
                          <button
                            onClick={() => onOpenReceipt(activeTransfer)}
                            className="text-blue-600 hover:underline font-bold text-[11px]"
                          >
                            Receipt ({activeTransfer.transferRef})
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Discrepancies & Issues Tab */}
      {activeTab === 'discrepancies' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-black text-base text-red-950 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Reported Discrepancies & Problem Log
              </h2>
              <p className="text-xs text-slate-500">
                Missing accessories, equipment damages, and disputed handovers requiring Biomedical clearance
              </p>
            </div>
          </div>

          {discrepancyTransfers.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No discrepancies or damage reported across hospital equipment.
            </div>
          ) : (
            <div className="space-y-4">
              {discrepancyTransfers.map((t) => (
                <div key={t.id} className="p-4 rounded-2xl border border-red-200 bg-red-50/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-red-100 text-red-900 px-2 py-0.5 rounded">
                        {t.assetId}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{t.equipmentName}</span>
                      <span className="text-[11px] font-mono text-slate-500">({t.transferRef})</span>
                    </div>
                    <button
                      onClick={() => onOpenReceipt(t)}
                      className="text-xs font-bold text-blue-700 hover:underline"
                    >
                      View Transfer →
                    </button>
                  </div>

                  <div className="space-y-2">
                    {t.discrepancies.map((disc) => (
                      <div key={disc.id} className="bg-white p-3 rounded-xl border border-red-200 text-xs flex flex-col sm:flex-row justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-red-700 uppercase text-[10px]">
                              [{disc.type}]
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">{disc.reportedAt}</span>
                            <span className="text-[11px] text-slate-600">
                              by <strong>{disc.reportedBy.name}</strong> ({disc.reportedBy.department})
                            </span>
                          </div>
                          <p className="text-slate-800 font-medium">{disc.description}</p>
                          {disc.resolved && (
                            <div className="text-emerald-700 text-[11px] font-semibold pt-1">
                              ✓ Resolved on {disc.resolvedAt} by {disc.resolvedBy?.name}: "{disc.resolutionNotes}"
                            </div>
                          )}
                        </div>

                        {!disc.resolved && isBiomedical && (
                          <div className="shrink-0 self-end sm:self-center">
                            <button
                              onClick={() => setResolvingDiscrepancy({ transferId: t.id, discrepancyId: disc.id })}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              <span>Resolve Issue</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Overdue Tab */}
      {activeTab === 'overdue' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="font-black text-base text-slate-900">Overdue Equipment Loans</h2>
          <p className="text-xs text-slate-500">Equipment on loan where expected return date has passed</p>

          {overdueTransfers.length === 0 ? (
            <p className="text-xs text-slate-400 italic p-6 text-center">No overdue returns at this time.</p>
          ) : (
            <div className="space-y-2">
              {overdueTransfers.map((t) => (
                <div key={t.id} className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono font-bold text-rose-900 bg-rose-100 px-2 py-0.5 rounded mr-2">
                      {t.assetId}
                    </span>
                    <strong className="text-slate-900">{t.equipmentName}</strong>
                    <div className="text-rose-700 mt-1">
                      Due: <strong>{t.expectedReturnDate}</strong> • Currently in <strong>{t.toDepartment}</strong> (Owner: {t.owningDepartment})
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenReceipt(t)}
                    className="px-3 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-xl"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* On Loan Tab */}
      {activeTab === 'on_loan' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="font-black text-base text-slate-900">All Equipment Currently On Loan</h2>
          <div className="space-y-2">
            {onLoanTransfers.map((t) => (
              <div key={t.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <span className="font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded mr-2">
                    {t.assetId}
                  </span>
                  <strong className="text-slate-900">{t.equipmentName}</strong>
                  <div className="text-slate-600 mt-1">
                    Movement: {t.fromDepartment} → {t.toDepartment} • Acknowledged by {t.receivedBy?.name} ({t.receivedAt})
                  </div>
                </div>
                <button
                  onClick={() => onOpenReceipt(t)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl"
                >
                  Certificate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Receipt Tab */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="font-black text-base text-slate-900">Transfers Awaiting Receipt (In Transit)</h2>
          <div className="space-y-2">
            {pendingReceiptTransfers.map((t) => (
              <div key={t.id} className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded mr-2">
                    {t.assetId}
                  </span>
                  <strong className="text-slate-900">{t.equipmentName}</strong>
                  <div className="text-amber-800 mt-1">
                    Dispatched from {t.fromDepartment} to {t.toDepartment} • Dispatched at {t.dispatchedAt} by {t.dispatchedBy.name}
                  </div>
                </div>
                <button
                  onClick={() => onOpenReceipt(t)}
                  className="px-3 py-1.5 bg-amber-600 text-white font-bold text-xs rounded-xl"
                >
                  Inspect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Trail Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-black text-base text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Immutable Hospital Audit Log
              </h2>
              <p className="text-xs text-slate-500">Every dispatch, receipt, return, photo, and acknowledgement is cryptographically timestamped in IST</p>
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-[10px] uppercase bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">
                      {log.action}
                    </span>
                    <span className="font-mono text-slate-500 text-[11px]">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-800">{log.details}</p>
                </div>
                <div className="text-right text-[11px] text-slate-500 shrink-0">
                  By: <strong className="text-slate-800">{log.performedBy.name}</strong> ({log.performedBy.staffId})
                  <div className="text-[10px] text-slate-400">{log.performedBy.department}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discrepancy Resolution Modal */}
      {resolvingDiscrepancy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 p-6 space-y-4">
            <h3 className="font-black text-base text-slate-900">
              Resolve Biomedical Discrepancy
            </h3>
            <p className="text-xs text-slate-500">
              Provide sign-off statement for resolving this equipment or accessory issue.
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Biomedical Engineering Resolution Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Missing oxygen hose replaced from central biomedical store; device safety tested..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingDiscrepancy(null)}
                  className="flex-1 py-2 px-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Sign Off & Resolve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
