import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Equipment, DepartmentId, EquipmentCondition, AccessoryItem, TransferRecord } from '../types';
import { api } from '../services/api';
import { Send, Camera, Upload, AlertCircle, CheckCircle2, QrCode, ShieldCheck, Clock, ArrowRight, X } from 'lucide-react';
import { getDepartmentName, formatIST } from '../utils/formatters';

interface TransferViewProps {
  equipmentList: Equipment[];
  preSelectedEquipment?: Equipment | null;
  onTransferComplete: (transfer: TransferRecord) => void;
  onOpenQR: () => void;
}

export const TransferView: React.FC<TransferViewProps> = ({
  equipmentList,
  preSelectedEquipment,
  onTransferComplete,
  onOpenQR
}) => {
  const { currentUser, isBiomedical, isAdmin } = useAuth();

  // Form state
  const [selectedEquipId, setSelectedEquipId] = useState<string>(preSelectedEquipment?.id || '');
  const [toDepartment, setToDepartment] = useState<DepartmentId>('PICU');
  const [dispatchPhotoUrl, setDispatchPhotoUrl] = useState<string>('');
  const [dispatchCondition, setDispatchCondition] = useState<EquipmentCondition>('GOOD');
  const [accessories, setAccessories] = useState<AccessoryItem[]>([]);
  const [customAccessory, setCustomAccessory] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [transferReason, setTransferReason] = useState('PICU patient emergency admission - ventilator shortage');
  const [expectedReturnDate, setExpectedReturnDate] = useState(() => {
    // Default 48 hours from today
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successTransfer, setSuccessTransfer] = useState<TransferRecord | null>(null);

  // Sync preSelectedEquipment if provided
  useEffect(() => {
    if (preSelectedEquipment) {
      setSelectedEquipId(preSelectedEquipment.id);
    }
  }, [preSelectedEquipment]);

  // When equipment is selected, populate defaults
  const selectedEquipment = equipmentList.find(e => e.id === selectedEquipId);

  useEffect(() => {
    if (selectedEquipment) {
      // Pre-fill standard accessories
      const defaultAccs: AccessoryItem[] = selectedEquipment.standardAccessories.map((acc, i) => ({
        id: `acc-${i}`,
        name: acc,
        included: true
      }));
      setAccessories(defaultAccs);
      setDispatchPhotoUrl(selectedEquipment.photoUrl);

      // Default sensible receiving department
      if (selectedEquipment.currentConfirmedDepartment === 'ICU') {
        setToDepartment('PICU');
      } else if (selectedEquipment.currentConfirmedDepartment === 'PICU') {
        setToDepartment('ICU');
      } else if (selectedEquipment.currentConfirmedDepartment === 'ER') {
        setToDepartment('ICU');
      } else {
        setToDepartment('ICU');
      }
    }
  }, [selectedEquipId]);

  const handleToggleAccessory = (id: string) => {
    setAccessories(prev =>
      prev.map(a => a.id === id ? { ...a, included: !a.included } : a)
    );
  };

  const handleAddCustomAccessory = () => {
    if (!customAccessory.trim()) return;
    const newAcc: AccessoryItem = {
      id: 'acc-cust-' + Date.now(),
      name: customAccessory.trim(),
      included: true
    };
    setAccessories(prev => [...prev, newAcc]);
    setCustomAccessory('');
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setDispatchPhotoUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedEquipment) {
      setErrorMessage('Please select equipment to transfer.');
      return;
    }

    if (selectedEquipment.currentConfirmedDepartment === toDepartment) {
      setErrorMessage(`Destination department cannot be the same as current location (${toDepartment}).`);
      return;
    }

    // Role check: Department staff should only transfer from their confirmed location (unless admin/biomedical)
    if (!isAdmin && !isBiomedical && currentUser.department !== selectedEquipment.currentConfirmedDepartment) {
      setErrorMessage(`Access Denied: You are authenticated as ${currentUser.department} staff. Only ${selectedEquipment.currentConfirmedDepartment} staff or Biomedical can dispatch this equipment from ${selectedEquipment.currentConfirmedDepartment}.`);
      return;
    }

    setLoading(true);

    try {
      const response = await api.createTransfer({
        equipmentId: selectedEquipment.id,
        toDepartment,
        dispatchPhotoUrl,
        dispatchCondition,
        accessoriesSent: accessories,
        dispatchNotes,
        transferReason,
        expectedReturnDate,
        user: currentUser
      });

      setSuccessTransfer(response.transfer);
      onTransferComplete(response.transfer);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch equipment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (successTransfer) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 text-center animate-in zoom-in-95">
        <div className="bg-white rounded-3xl p-8 border-2 border-emerald-500 shadow-xl space-y-5">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              DISPATCH CONFIRMED
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">
              Equipment Dispatched Successfully
            </h2>
            <p className="text-sm font-mono text-blue-700 font-bold mt-1">
              Transfer Reference: {successTransfer.transferRef}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Asset:</span>
              <span className="font-bold text-slate-900">{successTransfer.assetId} ({successTransfer.equipmentName})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Movement:</span>
              <span className="font-bold text-indigo-700">{successTransfer.fromDepartment} → {successTransfer.toDepartment}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Status:</span>
              <span className="font-bold text-amber-700">Pending Receipt (In Transit)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dispatched By:</span>
              <span className="font-semibold text-slate-800">{successTransfer.dispatchedBy.name} ({successTransfer.dispatchedBy.staffId})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dispatch Time (IST):</span>
              <span className="font-mono text-slate-700">{successTransfer.dispatchedAt}</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 text-left">
            <strong>Next Clinical Step:</strong> The physical equipment is now in transit. The confirmed location in the biomedical registry remains <strong>{successTransfer.fromDepartment}</strong> until the receiving nurse at <strong>{successTransfer.toDepartment}</strong> inspects the items and taps <strong>"Received"</strong>.
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setSuccessTransfer(null);
                setSelectedEquipId('');
              }}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors"
            >
              Transfer Another Item
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter equipment that can be dispatched:
  // If user is department staff, prioritize equipment currently located in their department
  const userDeptEquip = equipmentList.filter(e => e.currentConfirmedDepartment === currentUser.department);
  const otherEquip = equipmentList.filter(e => e.currentConfirmedDepartment !== currentUser.department);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Transfer Hospital Equipment</h1>
          <p className="text-xs text-slate-500">
            Dispatch equipment directly to another department with digital handover evidence
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenQR}
          className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <QrCode className="w-4 h-4" />
          <span>Scan Asset QR</span>
        </button>
      </div>

      {/* Patient Privacy Reminder Notice */}
      <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-amber-900 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong>Patient Privacy Reminder:</strong> Take photos of equipment only. Ensure no patients, patient faces, patient wristbands, or confidential clinical monitors displaying protected health information (PHI) are visible.
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl flex items-start gap-3 text-red-900 animate-in shake">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs font-medium leading-relaxed">
            <strong>Transfer Blocked:</strong> {errorMessage}
          </div>
        </div>
      )}

      {/* Main Transfer Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
        {/* Step 1: Select Equipment */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">1</span>
              Select Equipment to Dispatch
            </label>
            <span className="text-[11px] text-slate-500">
              Current Ward: <strong className="text-slate-800">{currentUser.department}</strong>
            </span>
          </div>

          <select
            value={selectedEquipId}
            onChange={(e) => setSelectedEquipId(e.target.value)}
            required
            className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
          >
            <option value="">-- Choose Equipment from Register --</option>
            {userDeptEquip.length > 0 && (
              <optgroup label={`Equipment in your department (${currentUser.department})`}>
                {userDeptEquip.map(e => (
                  <option key={e.id} value={e.id}>
                    [{e.assetId}] {e.name} — Status: {e.status}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Other Hospital Equipment">
              {otherEquip.map(e => (
                <option key={e.id} value={e.id}>
                  [{e.assetId}] {e.name} — Located in {e.currentConfirmedDepartment}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Selected Equipment Card Preview */}
        {selectedEquipment && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={selectedEquipment.photoUrl}
                alt=""
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {selectedEquipment.assetId}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{selectedEquipment.name}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Manufacturer: <span className="text-slate-700 font-medium">{selectedEquipment.manufacturer}</span> ({selectedEquipment.model})
                  <br />
                  Serial No: <span className="font-mono text-slate-600">{selectedEquipment.serialNumber}</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-left sm:text-right shrink-0">
              <div className="text-slate-500">Owning Department:</div>
              <div className="font-bold text-slate-800">{getDepartmentName(selectedEquipment.owningDepartment)}</div>
              <div className="text-slate-500 mt-1">Current Confirmed Location:</div>
              <div className="font-bold text-indigo-700">{getDepartmentName(selectedEquipment.currentConfirmedDepartment)}</div>
            </div>
          </div>
        )}

        {/* Step 2: Department Movement Routing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block mb-1.5">
              Sending Department (Origin)
            </label>
            <input
              type="text"
              readOnly
              value={selectedEquipment ? getDepartmentName(selectedEquipment.currentConfirmedDepartment) : getDepartmentName(currentUser.department)}
              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block mb-1.5">
              Receiving Department (Destination)
            </label>
            <select
              value={toDepartment}
              onChange={(e) => setToDepartment(e.target.value as DepartmentId)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="PICU">Pediatric ICU (PICU)</option>
              <option value="ICU">Intensive Care Unit (ICU)</option>
              <option value="NICU">Neonatal ICU (NICU)</option>
              <option value="ER">Emergency & Trauma (ER)</option>
              <option value="OT-1">Main Operating Theatre (OT-1)</option>
              <option value="OT-2">Emergency OT (OT-2)</option>
              <option value="DIALYSIS">Dialysis Unit</option>
              <option value="GENERAL_WARD">General Inpatient Ward</option>
              <option value="BIOMEDICAL">Biomedical Workshop</option>
            </select>
          </div>
        </div>

        {/* Step 3: Current Equipment Photo */}
        <div>
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">2</span>
              Equipment Handover Photo
            </span>
            <span className="text-[11px] text-slate-500 font-normal">Physical proof of device condition</span>
          </label>

          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="w-28 h-28 rounded-xl bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center border border-slate-300">
              {dispatchPhotoUrl ? (
                <img src={dispatchPhotoUrl} alt="Dispatch" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-slate-400" />
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <p className="text-xs text-slate-600">
                Capture the physical machine on its trolley with power cables and sensors clearly visible.
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shadow-xs">
                  <Camera className="w-4 h-4" />
                  <span>Take Photo / Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                </label>
                {selectedEquipment && (
                  <button
                    type="button"
                    onClick={() => setDispatchPhotoUrl(selectedEquipment.photoUrl)}
                    className="px-3 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-xl transition-colors"
                  >
                    Use Registered Photo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Accessories Sent Checklist */}
        <div>
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block mb-1.5">
            Accessories & Components Sent With Device
          </label>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {accessories.map((acc) => (
                <button
                  type="button"
                  key={acc.id}
                  onClick={() => handleToggleAccessory(acc.id)}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                    acc.included
                      ? 'bg-white border-emerald-500 shadow-2xs font-semibold text-slate-900'
                      : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                  }`}
                >
                  <span>{acc.name}</span>
                  <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                    acc.included ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                  }`}>
                    {acc.included && '✓'}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-200">
              <input
                type="text"
                placeholder="Add other custom accessory (e.g. Pediatric mask, specific probe)..."
                value={customAccessory}
                onChange={(e) => setCustomAccessory(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddCustomAccessory}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Step 5: Observed Condition & Reason */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block mb-1.5">
              Observed Physical Condition
            </label>
            <select
              value={dispatchCondition}
              onChange={(e) => setDispatchCondition(e.target.value as EquipmentCondition)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="EXCELLENT">Excellent (Like New, Clean)</option>
              <option value="GOOD">Good Working Condition</option>
              <option value="MINOR_WEAR">Minor Cosmetic Wear</option>
              <option value="NEEDS_CLEANING">Needs Surface Disinfection</option>
              <option value="DAMAGED">Damaged (Not recommended for loan)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block mb-1.5">
              Expected Return Date
            </label>
            <input
              type="date"
              value={expectedReturnDate}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block mb-1.5">
            Transfer Clinical Reason & Notes
          </label>
          <input
            type="text"
            placeholder="e.g. Urgent PICU admission; ventilator requested for pediatric patient..."
            value={transferReason}
            onChange={(e) => setTransferReason(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Authentication Signature Stamp */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                Sender Authentication: {currentUser.name} ({currentUser.staffId})
              </div>
              <div className="text-[11px] text-slate-500">
                Department: {currentUser.department} • Time will be recorded automatically in IST
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase bg-slate-200 px-2 py-0.5 rounded text-slate-700">
            Digital Seal
          </span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !selectedEquipment}
          className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black rounded-2xl text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98"
        >
          <Send className="w-5 h-5" />
          <span>{loading ? 'Validating & Recording Dispatch...' : 'Confirm Dispatch'}</span>
        </button>
      </form>
    </div>
  );
};
