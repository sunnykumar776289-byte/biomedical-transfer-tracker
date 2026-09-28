import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StaffUser, UserRole, DepartmentId } from '../types';
import { UserCheck, Shield, Building2, Plus, X, Check } from 'lucide-react';
import { getDepartmentName } from '../utils/formatters';

interface StaffSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffSwitcherModal: React.FC<StaffSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, switchUser, availableStaff, loginCustomStaff } = useAuth();
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customStaffId, setCustomStaffId] = useState('');
  const [customDept, setCustomDept] = useState<DepartmentId>('ICU');
  const [customRole, setCustomRole] = useState<UserRole>('STAFF');

  if (!isOpen) return null;

  const handleSelect = (staff: StaffUser) => {
    switchUser(staff);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customStaffId) return;
    loginCustomStaff(customName, customStaffId, customDept, customRole);
    setIsAddingCustom(false);
    setCustomName('');
    setCustomStaffId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-semibold text-base leading-tight">Hospital Staff Switcher</h2>
              <p className="text-xs text-slate-300">Select authenticated staff member for this terminal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
            <strong>Hospital Identity Protocol:</strong> In hospital clinical operations, handovers must be authenticated by the actual staff member on duty. A typed name alone does not count as acknowledgement.
          </div>

          {!isAddingCustom ? (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Active Staff Profiles
              </div>
              {availableStaff.map((staff) => {
                const isCurrent = currentUser.id === staff.id;
                return (
                  <button
                    key={staff.id}
                    onClick={() => handleSelect(staff)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        staff.role === 'ADMIN'
                          ? 'bg-rose-100 text-rose-700'
                          : staff.role === 'BIOMEDICAL'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {staff.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm">{staff.name}</span>
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {staff.staffId}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {getDepartmentName(staff.department)}
                          </span>
                          <span>•</span>
                          <span className="text-slate-500">{staff.designation}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        staff.role === 'ADMIN'
                          ? 'bg-rose-100 text-rose-800'
                          : staff.role === 'BIOMEDICAL'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {staff.role}
                      </span>
                      {isCurrent && <Check className="w-5 h-5 text-emerald-600" />}
                    </div>
                  </button>
                );
              })}

              <button
                onClick={() => setIsAddingCustom(true)}
                className="w-full mt-4 py-2.5 px-4 border border-dashed border-slate-300 rounded-xl text-slate-600 hover:text-slate-900 hover:border-slate-400 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Log in as Different Staff Member
              </button>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div className="text-sm font-semibold text-slate-800">Enter Staff Credentials</div>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name & Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sister Meena Pillai"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Staff / Employee ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NUR-9812"
                    value={customStaffId}
                    onChange={(e) => setCustomStaffId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Role Type</label>
                  <select
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="STAFF">Department Staff</option>
                    <option value="BIOMEDICAL">Biomedical Team</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Department Assigned</label>
                <select
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value as DepartmentId)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="ICU">Intensive Care Unit (ICU)</option>
                  <option value="PICU">Pediatric ICU (PICU)</option>
                  <option value="NICU">Neonatal ICU (NICU)</option>
                  <option value="ER">Emergency & Trauma (ER)</option>
                  <option value="OT-1">Main Operating Theatre (OT-1)</option>
                  <option value="OT-2">Emergency OT (OT-2)</option>
                  <option value="BIOMEDICAL">Biomedical Department</option>
                  <option value="DIALYSIS">Dialysis Unit</option>
                  <option value="GENERAL_WARD">General Ward</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(false)}
                  className="flex-1 py-2 px-4 border border-slate-300 rounded-lg text-slate-700 font-medium text-sm hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-xs"
                >
                  Confirm & Log In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
