import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Equipment, DepartmentId } from '../types';
import { api } from '../services/api';
import { X, Plus, Camera, Check } from 'lucide-react';
import { MEDICAL_PHOTOS } from '../constants/initialData';

interface NewEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const NewEquipmentModal: React.FC<NewEquipmentModalProps> = ({
  isOpen,
  onClose,
  onCreated
}) => {
  const { currentUser } = useAuth();

  const [assetId, setAssetId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Equipment['category']>('Ventilator');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [owningDepartment, setOwningDepartment] = useState<DepartmentId>('ICU');
  const [photoUrl, setPhotoUrl] = useState('');
  const [accessoriesText, setAccessoriesText] = useState('Power Cable, Patient Circuit, Flow Sensor');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !name) return;

    setLoading(true);
    try {
      const accessories = accessoriesText
        .split(',')
        .map(a => a.trim())
        .filter(Boolean);

      await api.createEquipment({
        assetId: assetId.trim().toUpperCase(),
        name: name.trim(),
        category,
        manufacturer: manufacturer.trim(),
        model: model.trim(),
        serialNumber: serialNumber.trim(),
        owningDepartment,
        photoUrl: photoUrl || MEDICAL_PHOTOS.ventilator,
        standardAccessories: accessories.length > 0 ? accessories : ['Power Cable'],
        notes: notes.trim(),
        user: currentUser
      });

      onCreated();
      onClose();
      alert(`Asset ${assetId} registered successfully in ${owningDepartment}!`);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 p-6 space-y-4 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-black text-base text-slate-900">Register Hospital Equipment</h3>
            <p className="text-xs text-slate-500">Add medical device to biomedical asset register</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Asset ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. VENT-003"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="Ventilator">Ventilator</option>
                <option value="Infusion Pump">Infusion Pump</option>
                <option value="Patient Monitor">Patient Monitor</option>
                <option value="Defibrillator">Defibrillator</option>
                <option value="Suction Unit">Suction Unit</option>
                <option value="Syringe Pump">Syringe Pump</option>
                <option value="Humidifier">Humidifier</option>
                <option value="Anesthesia">Anesthesia</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Equipment Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Hamilton C3 Mechanical Ventilator"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Manufacturer</label>
              <input
                type="text"
                placeholder="e.g. Hamilton"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Model</label>
              <input
                type="text"
                placeholder="e.g. C3"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Serial Number</label>
              <input
                type="text"
                placeholder="SN-XXXX"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Owning Home Department</label>
            <select
              value={owningDepartment}
              onChange={(e) => setOwningDepartment(e.target.value as DepartmentId)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
            >
              <option value="ICU">Intensive Care Unit (ICU)</option>
              <option value="PICU">Pediatric ICU (PICU)</option>
              <option value="NICU">Neonatal ICU (NICU)</option>
              <option value="ER">Emergency & Trauma (ER)</option>
              <option value="OT-1">Main OT-1</option>
              <option value="OT-2">Emergency OT-2</option>
              <option value="BIOMEDICAL">Biomedical Dept</option>
              <option value="DIALYSIS">Dialysis Unit</option>
              <option value="GENERAL_WARD">General Ward</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Standard Accessories (comma-separated)</label>
            <input
              type="text"
              value={accessoriesText}
              onChange={(e) => setAccessoriesText(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Clinical Maintenance Notes</label>
            <input
              type="text"
              placeholder="e.g. Calibrated and certified for 12 months..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 border border-slate-300 rounded-xl text-slate-700 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
            >
              {loading ? 'Registering...' : 'Register Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
