export type DepartmentId = 
  | 'ICU' 
  | 'PICU' 
  | 'NICU' 
  | 'ER' 
  | 'OT-1' 
  | 'OT-2' 
  | 'BIOMEDICAL' 
  | 'DIALYSIS' 
  | 'GENERAL_WARD';

export type UserRole = 'STAFF' | 'BIOMEDICAL' | 'ADMIN';

export type EquipmentStatus = 'AVAILABLE' | 'IN_USE' | 'IN_TRANSIT' | 'UNDER_MAINTENANCE';

export type TransferStatus = 'Pending Receipt' | 'On Loan' | 'Closed';

export type EquipmentCondition = 'EXCELLENT' | 'GOOD' | 'MINOR_WEAR' | 'NEEDS_CLEANING' | 'DAMAGED';

export interface StaffUser {
  id: string;
  name: string;
  staffId: string;
  role: UserRole;
  department: DepartmentId;
  designation: string;
  phone?: string;
  email?: string;
}

export interface AccessoryItem {
  id: string;
  name: string;
  included: boolean;
  notes?: string;
}

export interface Equipment {
  id: string;
  assetId: string; // e.g. VENT-001
  name: string; // e.g. Hamilton C3 Mechanical Ventilator
  category: 'Ventilator' | 'Infusion Pump' | 'Patient Monitor' | 'Defibrillator' | 'Suction Unit' | 'Humidifier' | 'Syringe Pump' | 'Anesthesia';
  manufacturer: string;
  model: string;
  serialNumber: string;
  owningDepartment: DepartmentId;
  currentConfirmedDepartment: DepartmentId;
  status: EquipmentStatus;
  photoUrl: string;
  qrCode: string;
  standardAccessories: string[];
  lastMaintenanceDate: string;
  currentTransferId?: string | null;
  activeLoanTo?: DepartmentId | null;
  notes?: string;
}

export interface DiscrepancyReport {
  id: string;
  reportedBy: StaffUser;
  reportedAt: string; // IST formatted string
  type: 'MISSING_ACCESSORY' | 'PHYSICAL_DAMAGE' | 'MALFUNCTION' | 'WRONG_ITEM' | 'NOT_RECEIVED';
  description: string;
  photoUrl?: string;
  resolved: boolean;
  resolvedBy?: StaffUser;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface TransferRecord {
  id: string;
  transferRef: string; // e.g. TR-2026-0928-001
  equipmentId: string;
  assetId: string;
  equipmentName: string;
  owningDepartment: DepartmentId;
  fromDepartment: DepartmentId;
  toDepartment: DepartmentId;
  
  // Status lifecycle: Pending Receipt -> On Loan -> Closed
  status: TransferStatus;
  
  // Step 1: Initial Dispatch
  dispatchedBy: StaffUser;
  dispatchedAt: string; // e.g. "28 Sep 2026, 02:45 PM IST"
  dispatchPhotoUrl: string;
  dispatchCondition: EquipmentCondition;
  accessoriesSent: AccessoryItem[];
  dispatchNotes?: string;
  transferReason?: string;
  expectedReturnDate?: string;
  
  // Step 2: Receiving Acknowledgement
  receivedBy?: StaffUser;
  receivedAt?: string; // IST
  receivedPhotoUrl?: string;
  receivedCondition?: EquipmentCondition;
  accessoriesReceived?: AccessoryItem[];
  receiverNotes?: string;
  
  // Step 3: Return Workflow (Borrowing dept sends it back)
  returnRequested?: boolean;
  returnRequestedBy?: StaffUser;
  returnRequestedAt?: string;
  returnRequestReason?: string;
  
  returnDispatched?: boolean;
  returnDispatchedBy?: StaffUser;
  returnDispatchedAt?: string;
  returnDispatchPhotoUrl?: string;
  returnAccessoriesSent?: AccessoryItem[];
  returnDispatchCondition?: EquipmentCondition;
  returnDispatchNotes?: string;

  // Step 4: Final Received Back & Close by Owning / Destination Department
  closedBy?: StaffUser;
  closedAt?: string;
  closeCondition?: EquipmentCondition;
  closeAccessoriesChecked?: AccessoryItem[];
  closeNotes?: string;

  // Discrepancies & Issues
  discrepancies: DiscrepancyReport[];
  hasOpenDiscrepancy: boolean;

  // Approval flag (if hospital policy requires prior Biomedical approval)
  requiresBiomedicalApproval?: boolean;
  biomedicalApprovedBy?: StaffUser;
  biomedicalApprovedAt?: string;
  
  // Onward transfer parent/child tracking
  parentTransferId?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string; // IST
  action: string;
  entityType: 'TRANSFER' | 'EQUIPMENT' | 'STAFF' | 'SETTINGS';
  entityId: string;
  performedBy: StaffUser;
  details: string;
  previousState?: any;
  newState?: any;
  correctionReason?: string;
}

export interface HospitalSettings {
  hospitalName: string;
  requireBiomedicalPreApproval: boolean;
  autoAlertOverdueHours: number;
  departments: {
    id: DepartmentId;
    name: string;
    floor: string;
    phone: string;
  }[];
}
