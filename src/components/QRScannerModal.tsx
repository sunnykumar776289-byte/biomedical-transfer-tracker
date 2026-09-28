import React, { useState } from 'react';
import { QrCode, Camera, X, CheckCircle, Search, Sparkles } from 'lucide-react';
import { Equipment } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEquipment: (equipment: Equipment) => void;
  equipmentList: Equipment[];
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectEquipment,
  equipmentList
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cameraActive, setCameraActive] = useState(false);

  if (!isOpen) return null;

  const filtered = equipmentList.filter(e =>
    e.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.owningDepartment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-400" />
            <h2 className="font-semibold text-base">Scan Equipment QR Code</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Simulated Scanner Viewfinder */}
          <div className="relative aspect-4/3 bg-slate-950 rounded-xl overflow-hidden flex flex-col items-center justify-center border-2 border-indigo-500/40">
            <div className="absolute inset-4 border-2 border-dashed border-indigo-400/80 rounded-lg pointer-events-none flex items-center justify-center">
              <div className="w-full h-0.5 bg-indigo-400 shadow-[0_0_8px_#818cf8] animate-pulse"></div>
            </div>

            <div className="z-10 text-center px-4">
              <Camera className="w-8 h-8 text-indigo-400 mx-auto mb-2 animate-bounce" />
              <p className="text-white text-xs font-medium">Position equipment barcode or QR tag within the frame</p>
              <p className="text-slate-400 text-[11px] mt-1">Hospital Asset Tag Scanner Ready</p>
            </div>

            <div className="absolute bottom-2 text-[10px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded">
              Optical barcode decoder active
            </div>
          </div>

          {/* Quick Simulated Select for instant demo & mobile testing */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Tap Asset to Simulate Instant Scan:
              </span>
            </div>

            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Asset ID (e.g. VENT-001)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {filtered.map(eq => (
                <button
                  key={eq.id}
                  onClick={() => {
                    onSelectEquipment(eq);
                    onClose();
                  }}
                  className="w-full text-left p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={eq.photoUrl} alt="" className="w-9 h-9 rounded object-cover border border-slate-200" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                          {eq.assetId}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 truncate max-w-[170px]">
                          {eq.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Location: <span className="font-medium text-slate-700">{eq.currentConfirmedDepartment}</span>
                        {' '}(Owner: {eq.owningDepartment})
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-indigo-600 font-medium group-hover:underline">Select</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
