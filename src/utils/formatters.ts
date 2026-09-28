import { DepartmentId, TransferStatus, EquipmentStatus, EquipmentCondition } from '../types';

export function formatIST(dateStr?: string | Date): string {
  if (!dateStr) return 'N/A';
  if (typeof dateStr === 'string' && dateStr.includes('IST')) {
    return dateStr;
  }
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return String(dateStr);

  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffsetMs);

  const day = String(istDate.getUTCDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[istDate.getUTCMonth()];
  const year = istDate.getUTCFullYear();

  let hours = istDate.getUTCHours();
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');

  return `${day} ${month} ${year}, ${formattedHours}:${minutes} ${ampm} IST`;
}

export function getDepartmentName(dept: DepartmentId): string {
  switch (dept) {
    case 'ICU': return 'Intensive Care Unit (ICU)';
    case 'PICU': return 'Pediatric ICU (PICU)';
    case 'NICU': return 'Neonatal ICU (NICU)';
    case 'ER': return 'Emergency & Trauma (ER)';
    case 'OT-1': return 'Main Surgical OT (OT-1)';
    case 'OT-2': return 'Emergency Surgical OT (OT-2)';
    case 'BIOMEDICAL': return 'Biomedical Dept';
    case 'DIALYSIS': return 'Dialysis Unit';
    case 'GENERAL_WARD': return 'General Inpatient Ward';
    default: return dept;
  }
}

export function getDepartmentBadgeColor(dept: DepartmentId): string {
  switch (dept) {
    case 'ICU': return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'PICU': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'NICU': return 'bg-pink-100 text-pink-800 border-pink-200';
    case 'ER': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'OT-1': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'OT-2': return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'BIOMEDICAL': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'DIALYSIS': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'GENERAL_WARD': return 'bg-slate-100 text-slate-800 border-slate-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getStatusBadge(status: TransferStatus): { label: string; color: string; dot: string } {
  switch (status) {
    case 'Pending Receipt':
      return {
        label: 'Pending Receipt (In Transit)',
        color: 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-300/60',
        dot: 'bg-amber-500 animate-pulse'
      };
    case 'On Loan':
      return {
        label: 'On Loan (Confirmed in Ward)',
        color: 'bg-blue-50 text-blue-800 border-blue-300 ring-1 ring-blue-300/60',
        dot: 'bg-blue-600'
      };
    case 'Closed':
      return {
        label: 'Closed (Returned to Owner)',
        color: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-300/60',
        dot: 'bg-emerald-600'
      };
    default:
      return {
        label: status,
        color: 'bg-gray-100 text-gray-700 border-gray-300',
        dot: 'bg-gray-400'
      };
  }
}

export function getConditionBadge(condition?: EquipmentCondition): { label: string; color: string } {
  switch (condition) {
    case 'EXCELLENT':
      return { label: 'Excellent Condition', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    case 'GOOD':
      return { label: 'Good Working Condition', color: 'bg-green-100 text-green-800 border-green-200' };
    case 'MINOR_WEAR':
      return { label: 'Minor Cosmetic Wear', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    case 'NEEDS_CLEANING':
      return { label: 'Needs Surface Disinfection', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    case 'DAMAGED':
      return { label: 'Physical Damage Noted', color: 'bg-red-100 text-red-800 border-red-200' };
    default:
      return { label: 'Inspected', color: 'bg-gray-100 text-gray-800 border-gray-200' };
  }
}
