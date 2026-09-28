import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Equipment, TransferRecord, DepartmentId } from '../types';
import { Search, Plus, QrCode, Filter, Activity, Clock, ShieldCheck, ArrowRight, X, Printer, ExternalLink, Send } from 'lucide-react';
import { getDepartmentName, getDepartmentBadgeColor, formatIST } from '../utils/formatters';

interface EquipmentRegisterViewProps {
  equipmentList: Equipment[];
  transfers: TransferRecord[];
  onSelectForTransfer: (equipment: Equipment) => void;
  onOpenQR: () => void;
  onOpenReceipt: (transfer: TransferRecord) => void;
  onAddNewEquipment: () => void;
}

export const EquipmentRegisterView: React.FC<EquipmentRegisterViewProps> = ({
  equipmentList,
  transfers,
  onSelectForTransfer,
  onOpenQR,
  onOpenReceipt,
  onAddNewEquipment
}) => {
  const { currentUser, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);

  const filteredEquipment = equipmentList.filter(e => {
    const matchesSearch =
      e.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept =
      deptFilter === 'ALL' ||
      e.currentConfirmedDepartment === deptFilter ||
      e.owningDepartment === deptFilter;

    const matchesStatus =
      statusFilter === 'ALL' || e.status === statusFilter;

    const matchesCategory =
      categoryFilter === 'ALL' || e.category === categoryFilter;

    return matchesSearch && matchesDept && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: Equipment['status']) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'IN_USE': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'IN_TRANSIT': return 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse';
      case 'UNDER_MAINTENANCE': return 'bg-rose-100 text-rose-800 border-rose-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Hospital Equipment Register</h1>
          <p className="text-xs text-slate-500">
            Confirmed clinical inventory, confirmed locations, and active loan statuses
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenQR}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan QR</span>
          </button>

          {isAdmin && (
            <button
              onClick={onAddNewEquipment}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Register Asset</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Asset ID (e.g. VENT-001), equipment name, manufacturer, or serial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Ward Location</label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white"
            >
              <option value="ALL">All Departments</option>
              <option value="ICU">ICU</option>
              <option value="PICU">PICU</option>
              <option value="NICU">NICU</option>
              <option value="ER">Emergency (ER)</option>
              <option value="OT-1">Main OT-1</option>
              <option value="OT-2">Emergency OT-2</option>
              <option value="BIOMEDICAL">Biomedical Dept</option>
              <option value="DIALYSIS">Dialysis</option>
              <option value="GENERAL_WARD">General Ward</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Device Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="IN_USE">In Use / On Loan</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="UNDER_MAINTENANCE">Maintenance</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white"
            >
              <option value="ALL">All Categories</option>
              <option value="Ventilator">Ventilators</option>
              <option value="Infusion Pump">Infusion Pumps</option>
              <option value="Patient Monitor">Patient Monitors</option>
              <option value="Defibrillator">Defibrillators</option>
              <option value="Suction Unit">Suction Units</option>
              <option value="Syringe Pump">Syringe Pumps</option>
            </select>
          </div>
        </div>
      </div>

      {/* Equipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.map((eq) => {
          const isOnLoan = eq.owningDepartment !== eq.currentConfirmedDepartment;

          return (
            <div
              key={eq.id}
              className="bg-white rounded-3xl border border-slate-200 hover:border-blue-400 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                      {eq.assetId}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {eq.category}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusColor(eq.status)}`}>
                    {eq.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <img
                    src={eq.photoUrl}
                    alt={eq.name}
                    className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                      {eq.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {eq.manufacturer} • {eq.model}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 truncate">
                      SN: {eq.serialNumber}
                    </p>
                  </div>
                </div>

                {/* Location Badges */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Confirmed Location:</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] border ${getDepartmentBadgeColor(eq.currentConfirmedDepartment)}`}>
                      {eq.currentConfirmedDepartment}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Owning Department:</span>
                    <span className="font-semibold text-slate-700">
                      {eq.owningDepartment}
                    </span>
                  </div>

                  {isOnLoan && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-medium">
                      ⚠️ On loan from {eq.owningDepartment} to {eq.currentConfirmedDepartment}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => setSelectedItem(eq)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors"
                >
                  View Details & History
                </button>

                <button
                  onClick={() => onSelectForTransfer(eq)}
                  className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-colors shadow-2xs"
                  title="Initiate transfer for this equipment"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transfer</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Equipment Detail Modal with Movement History Timeline */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm bg-blue-600 px-2.5 py-0.5 rounded">
                  {selectedItem.assetId}
                </span>
                <h2 className="font-semibold text-base leading-tight truncate max-w-md">
                  {selectedItem.name}
                </h2>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <img
                  src={selectedItem.photoUrl}
                  alt={selectedItem.name}
                  className="w-full sm:w-44 h-44 rounded-2xl object-cover border border-slate-200 shrink-0"
                />
                <div className="flex-1 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 block">Manufacturer:</span>
                      <strong className="text-slate-800">{selectedItem.manufacturer}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Model:</span>
                      <strong className="text-slate-800">{selectedItem.model}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Serial Number:</span>
                      <strong className="font-mono text-slate-800">{selectedItem.serialNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Last Maintenance:</span>
                      <span className="text-slate-700">{selectedItem.lastMaintenanceDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Owning Department:</span>
                      <strong className="text-indigo-700">{getDepartmentName(selectedItem.owningDepartment)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Current Confirmed Location:</span>
                      <strong className="text-emerald-700">{getDepartmentName(selectedItem.currentConfirmedDepartment)}</strong>
                    </div>
                  </div>

                  {selectedItem.notes && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 mt-2">
                      {selectedItem.notes}
                    </div>
                  )}

                  {/* Standard Accessories */}
                  <div className="pt-2">
                    <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                      Standard Accessories Checklist
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedItem.standardAccessories.map((acc, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">
                          ✓ {acc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Movement History Timeline */}
              <div>
                <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Asset Movement & Handover Timeline
                </h4>

                {(() => {
                  const history = transfers.filter(t => t.equipmentId === selectedItem.id || t.assetId === selectedItem.assetId);

                  if (history.length === 0) {
                    return (
                      <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">
                        No previous transfers recorded for this asset. Equipment has remained in its home department.
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {history.map((t) => (
                        <div key={t.id} className="relative pl-7 text-xs">
                          <span className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-white"></span>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-mono font-bold text-blue-800">{t.transferRef}</span>
                              <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded-full bg-slate-200">
                                {t.status}
                              </span>
                            </div>
                            <div className="font-semibold text-slate-900">
                              {t.fromDepartment} → {t.toDepartment}
                            </div>
                            <div className="text-slate-600">
                              Dispatched by {t.dispatchedBy.name} ({t.dispatchedAt})
                              {t.receivedBy && (
                                <> • Received by {t.receivedBy.name} ({t.receivedAt})</>
                              )}
                              {t.closedBy && (
                                <> • Closed by {t.closedBy.name} ({t.closedAt})</>
                              )}
                            </div>
                            <div className="pt-1 flex gap-2">
                              <button
                                onClick={() => {
                                  onOpenReceipt(t);
                                  setSelectedItem(null);
                                }}
                                className="text-blue-600 hover:underline font-bold text-[11px]"
                              >
                                View Handover Certificate →
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-2.5 px-4 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onSelectForTransfer(selectedItem);
                    setSelectedItem(null);
                  }}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>Transfer This Item</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
