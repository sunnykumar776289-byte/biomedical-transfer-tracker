import React, { useState } from 'react';
import { AlertTriangle, Camera, X, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DiscrepancyReport } from '../types';

interface IssueReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: { type: DiscrepancyReport['type']; description: string; photoUrl?: string }) => void;
  equipmentAssetId: string;
}

export const IssueReportModal: React.FC<IssueReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  equipmentAssetId
}) => {
  const { currentUser } = useAuth();
  const [type, setType] = useState<DiscrepancyReport['type']>('MISSING_ACCESSORY');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    onSubmit({
      type,
      description: description.trim(),
      photoUrl: photoUrl || undefined
    });
    setDescription('');
    setPhotoUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
        <div className="px-5 py-4 bg-red-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-300" />
            <div>
              <h2 className="font-semibold text-base leading-tight">Report Handover Discrepancy</h2>
              <p className="text-xs text-red-200">Asset: {equipmentAssetId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-red-800 rounded-lg text-red-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 leading-relaxed">
            <strong>Biomedical Hold Notice:</strong> Submitting this report will automatically alert the Biomedical Engineering Team and hold the transaction open until investigated.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Category</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DiscrepancyReport['type'])}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              <option value="MISSING_ACCESSORY">Missing Accessory / Cable / Sensor</option>
              <option value="PHYSICAL_DAMAGE">Physical Damage / Crack / Bent Part</option>
              <option value="MALFUNCTION">Device Fails Self-Test / Power Problem</option>
              <option value="WRONG_ITEM">Wrong Item / Mismatched Serial Number</option>
              <option value="NOT_RECEIVED">Equipment Not Physically Delivered</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description of Problem</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Oxygen supply hose missing from trolley; power cord has cracked insulation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Damage Photo Evidence (Optional)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-3 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-2 transition-colors">
                <Camera className="w-4 h-4 text-slate-500" />
                <span>Take Photo / Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {photoUrl && (
                <div className="flex items-center gap-2">
                  <img src={photoUrl} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Do not include patient identifiers or patient faces in the photo.
            </p>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-slate-300 rounded-xl text-slate-700 font-medium text-xs hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
            >
              Submit Discrepancy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
