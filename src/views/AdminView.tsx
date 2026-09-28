import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HospitalSettings, StaffUser, Equipment, DepartmentId } from '../types';
import { api } from '../services/api';
import { Settings, Shield, Plus, Building2, UserPlus, Check, RefreshCw } from 'lucide-react';

interface AdminViewProps {
  settings: HospitalSettings;
  staffList: StaffUser[];
  onRefresh: () => void;
  onOpenNewEquipment: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  settings,
  staffList,
  onRefresh,
  onOpenNewEquipment
}) => {
  const { currentUser } = useAuth();
  const [requireApproval, setRequireApproval] = useState(settings.requireBiomedicalPreApproval);
  const [savingSettings, setSavingSettings] = useState(false);

  // New staff modal
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [staffDept, setStaffDept] = useState<DepartmentId>('ICU');
  const [staffRole, setStaffRole] = useState<'STAFF' | 'BIOMEDICAL' | 'ADMIN'>('STAFF');
  const [staffDesignation, setStaffDesignation] = useState('Staff Nurse');

  const handleSavePolicy = async () => {
    setSavingSettings(true);
    try {
      await api.updateSettings({
        requireBiomedicalPreApproval: requireApproval
      });
      onRefresh();
      alert('Hospital handover policy updated successfully!');
    } catch (e: any) {
      alert('Error updating policy: ' + e.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffId) return;

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: staffName,
          staffId: staffId.toUpperCase(),
          department: staffDept,
          role: staffRole,
          designation: staffDesignation
        })
      });
      if (!res.ok) throw new Error('Failed to create staff');
      setIsAddStaffOpen(false);
      setStaffName('');
      setStaffId('');
      onRefresh();
      alert(`Staff profile created for ${staffName} (${staffId})`);
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Hospital Administration & Policy</h1>
        <p className="text-xs text-slate-500">Configure equipment transfer governance, hospital rules, and staff permissions</p>
      </div>

      {/* Hospital Policy Settings */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="font-black text-base text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          Clinical Equipment Governance Policy
        </h2>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-900">
                Direct Department-to-Department Transfer (Fast-Track)
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                When enabled (recommended), ICU can dispatch directly to PICU without requiring physical Biomedical receipt or pre-approval first. Biomedical automatically monitors all handovers in real time.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={!requireApproval}
                onChange={(e) => setRequireApproval(!e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="pt-2 flex justify-between items-center text-xs">
            <span className="text-slate-600">
              Current Mode: <strong className={!requireApproval ? 'text-emerald-700' : 'text-amber-700'}>
                {!requireApproval ? 'Direct Ward-to-Ward (Zero Middleman Delay)' : 'Prior Biomedical Pre-Approval Required'}
              </strong>
            </span>
            <button
              onClick={handleSavePolicy}
              disabled={savingSettings}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs"
            >
              {savingSettings ? 'Saving...' : 'Apply Policy'}
            </button>
          </div>
        </div>
      </div>

      {/* Staff Roster Management */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-black text-base text-slate-900">Staff Accounts & Permissions</h2>
            <p className="text-xs text-slate-500">Authorized clinical nurses, biomedical engineers, and ward managers</p>
          </div>
          <button
            onClick={() => setIsAddStaffOpen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Staff Account</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {staffList.map((s) => (
            <div key={s.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">{s.name}</span>
                  <span className="font-mono text-[10px] bg-slate-200 px-1 rounded text-slate-700">
                    {s.staffId}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {s.department} • {s.designation}
                </div>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                s.role === 'ADMIN' ? 'bg-rose-100 text-rose-800' :
                s.role === 'BIOMEDICAL' ? 'bg-blue-100 text-blue-800' :
                'bg-slate-200 text-slate-700'
              }`}>
                {s.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 p-6 space-y-4">
            <h3 className="font-black text-base text-slate-900">Add Clinical Staff Account</h3>

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sister Meena Kumari"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Staff ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NUR-4401"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Role</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                  >
                    <option value="STAFF">Department Staff</option>
                    <option value="BIOMEDICAL">Biomedical Team</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Assigned Department</label>
                <select
                  value={staffDept}
                  onChange={(e) => setStaffDept(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                >
                  <option value="ICU">Intensive Care Unit (ICU)</option>
                  <option value="PICU">Pediatric ICU (PICU)</option>
                  <option value="NICU">Neonatal ICU (NICU)</option>
                  <option value="ER">Emergency (ER)</option>
                  <option value="OT-1">Main OT-1</option>
                  <option value="OT-2">Emergency OT-2</option>
                  <option value="BIOMEDICAL">Biomedical Dept</option>
                  <option value="DIALYSIS">Dialysis</option>
                  <option value="GENERAL_WARD">General Ward</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Designation</label>
                <input
                  type="text"
                  value={staffDesignation}
                  onChange={(e) => setStaffDesignation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="flex-1 py-2 px-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
