import { StaffUser, Equipment, TransferRecord, AuditLog, HospitalSettings } from '../types';

export function getISTTimestamp(date: Date = new Date()): string {
  // IST is UTC + 5:30
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
  hours = hours ? hours : 12; // 0 becomes 12
  const formattedHours = String(hours).padStart(2, '0');

  return `${day} ${month} ${year}, ${formattedHours}:${minutes} ${ampm} IST`;
}

// Reliable medical equipment SVG/Unsplash photos for high-fidelity offline & online rendering
export const MEDICAL_PHOTOS = {
  ventilator: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
  monitor: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80',
  infusion: 'https://images.unsplash.com/photo-1583912267670-6575ad362e4b?auto=format&fit=crop&w=600&q=80',
  defibrillator: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=600&q=80',
  suction: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
  syringe: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
};

export const INITIAL_STAFF: StaffUser[] = [
  {
    id: 'staff-icu-1',
    name: 'Sister Priya Sharma',
    staffId: 'NUR-2041',
    role: 'STAFF',
    department: 'ICU',
    designation: 'Senior Staff Nurse (In-Charge)',
    phone: '+91 98201 14520',
    email: 'priya.sharma@apollohospital.org'
  },
  {
    id: 'staff-picu-1',
    name: 'Sister Anjali Nair',
    staffId: 'NUR-3108',
    role: 'STAFF',
    department: 'PICU',
    designation: 'Pediatric ICU Staff Nurse',
    phone: '+91 98332 99014',
    email: 'anjali.nair@apollohospital.org'
  },
  {
    id: 'staff-ot-1',
    name: 'Sister Sunita Rao',
    staffId: 'NUR-1144',
    role: 'STAFF',
    department: 'OT-1',
    designation: 'Surgical OT Charge Nurse',
    phone: '+91 98450 33211',
    email: 'sunita.rao@apollohospital.org'
  },
  {
    id: 'staff-er-1',
    name: 'Brother Manoj Kumar',
    staffId: 'NUR-5022',
    role: 'STAFF',
    department: 'ER',
    designation: 'Emergency Triage Nurse',
    phone: '+91 98110 54109',
    email: 'manoj.kumar@apollohospital.org'
  },
  {
    id: 'staff-bme-1',
    name: 'Dr. Rajesh Verma',
    staffId: 'BME-102',
    role: 'BIOMEDICAL',
    department: 'BIOMEDICAL',
    designation: 'Lead Biomedical Engineer',
    phone: '+91 98711 88320',
    email: 'rajesh.verma@apollohospital.org'
  },
  {
    id: 'staff-bme-2',
    name: 'Er. Kavita Deshmukh',
    staffId: 'BME-205',
    role: 'BIOMEDICAL',
    department: 'BIOMEDICAL',
    designation: 'Senior Biomedical Technician',
    phone: '+91 98209 77154',
    email: 'kavita.deshmukh@apollohospital.org'
  },
  {
    id: 'staff-admin-1',
    name: 'Arun Mehta',
    staffId: 'ADM-001',
    role: 'ADMIN',
    department: 'BIOMEDICAL',
    designation: 'Hospital Equipment & Clinical Ops Admin',
    phone: '+91 98200 12001',
    email: 'admin.mehta@apollohospital.org'
  }
];

export const INITIAL_SETTINGS: HospitalSettings = {
  hospitalName: 'Apollo City Hospital & Research Institute',
  requireBiomedicalPreApproval: false,
  autoAlertOverdueHours: 24,
  departments: [
    { id: 'ICU', name: 'Intensive Care Unit (ICU)', floor: '2nd Floor, Wing A', phone: 'Ext. 201' },
    { id: 'PICU', name: 'Pediatric Intensive Care Unit (PICU)', floor: '3rd Floor, Wing B', phone: 'Ext. 308' },
    { id: 'NICU', name: 'Neonatal Intensive Care Unit (NICU)', floor: '3rd Floor, Wing C', phone: 'Ext. 312' },
    { id: 'ER', name: 'Emergency & Trauma Department', floor: 'Ground Floor', phone: 'Ext. 100' },
    { id: 'OT-1', name: 'Main Surgical Operation Theatre (OT-1)', floor: '4th Floor', phone: 'Ext. 401' },
    { id: 'OT-2', name: 'Emergency Surgical OT (OT-2)', floor: '1st Floor', phone: 'Ext. 150' },
    { id: 'BIOMEDICAL', name: 'Biomedical Engineering Department', floor: 'Basement B1', phone: 'Ext. 888' },
    { id: 'DIALYSIS', name: 'Nephrology & Hemodialysis Unit', floor: '2nd Floor, Wing B', phone: 'Ext. 240' },
    { id: 'GENERAL_WARD', name: 'General Inpatient Ward', floor: '5th Floor', phone: 'Ext. 500' }
  ]
};

export const INITIAL_EQUIPMENT: Equipment[] = [
  {
    id: 'eq-vent-001',
    assetId: 'VENT-001',
    name: 'Hamilton C3 ICU Mechanical Ventilator',
    category: 'Ventilator',
    manufacturer: 'Hamilton Medical',
    model: 'C3 Edition 2024',
    serialNumber: 'HM-88291-C3',
    owningDepartment: 'ICU',
    currentConfirmedDepartment: 'ICU',
    status: 'AVAILABLE',
    photoUrl: MEDICAL_PHOTOS.ventilator,
    qrCode: 'VENT-001|ICU|Hamilton-C3',
    standardAccessories: [
      'Adult/Pediatric Patient Breathing Circuit',
      'Hamilton Flow Sensor & Cable',
      'Active Humidifier Chamber & Heater Wire',
      'High-Pressure Oxygen Supply Hose (White)',
      'Medical Air Hose (Black/White)',
      'Heavy-Duty Mobile Trolley with Basket',
      'Grade Hospital Power Cable (3-Pin)'
    ],
    lastMaintenanceDate: '15 Aug 2026',
    notes: 'Primary critical care ventilator. Calibrated with O2 sensor.'
  },
  {
    id: 'eq-vent-002',
    assetId: 'VENT-002',
    name: 'Dräger Evita V300 Intensive Care Ventilator',
    category: 'Ventilator',
    manufacturer: 'Dräger Medical',
    model: 'Evita V300',
    serialNumber: 'DRG-44109-V3',
    owningDepartment: 'PICU',
    currentConfirmedDepartment: 'PICU',
    status: 'AVAILABLE',
    photoUrl: MEDICAL_PHOTOS.ventilator,
    qrCode: 'VENT-002|PICU|Evita-V300',
    standardAccessories: [
      'Neonatal/Pediatric Flow Sensor Wire',
      'Heated Breathing Circuit with Water Traps',
      'Dual Gas Supply Hoses',
      'Inspiratory Bacterial Filter',
      'Integrated Power Supply Cord'
    ],
    lastMaintenanceDate: '20 Jul 2026',
    notes: 'Equipped with Smart Pulmonary View and neonatal options.'
  },
  {
    id: 'eq-inf-101',
    assetId: 'INF-101',
    name: 'B. Braun Infusomat Space Volumetric Pump',
    category: 'Infusion Pump',
    manufacturer: 'B. Braun',
    model: 'Infusomat Space',
    serialNumber: 'BB-60192-SP',
    owningDepartment: 'ER',
    currentConfirmedDepartment: 'ER',
    status: 'AVAILABLE',
    photoUrl: MEDICAL_PHOTOS.infusion,
    qrCode: 'INF-101|ER|Infusomat-Space',
    standardAccessories: [
      'Pole Clamp Fastener',
      'Space Power Supply 12V Cord',
      'Drop Sensor Probe & Clip'
    ],
    lastMaintenanceDate: '10 Sep 2026',
    notes: 'Dose error reduction system programmed with hospital drug library.'
  },
  {
    id: 'eq-inf-102',
    assetId: 'INF-102',
    name: 'B. Braun Infusomat Space Volumetric Pump',
    category: 'Infusion Pump',
    manufacturer: 'B. Braun',
    model: 'Infusomat Space',
    serialNumber: 'BB-60193-SP',
    owningDepartment: 'ICU',
    currentConfirmedDepartment: 'ICU',
    status: 'AVAILABLE',
    photoUrl: MEDICAL_PHOTOS.infusion,
    qrCode: 'INF-102|ICU|Infusomat-Space',
    standardAccessories: [
      'Pole Clamp Fastener',
      'Space Power Supply 12V Cord',
      'Drop Sensor Probe & Clip'
    ],
    lastMaintenanceDate: '12 Sep 2026',
    notes: 'Calibrated infusion rate.'
  },
  {
    id: 'eq-syr-205',
    assetId: 'SYR-205',
    name: 'BD Alaris CC Plus Precision Syringe Pump',
    category: 'Syringe Pump',
    manufacturer: 'BD CareFusion',
    model: 'Alaris CC Plus',
    serialNumber: 'BD-99120-CC',
    owningDepartment: 'ICU',
    currentConfirmedDepartment: 'ICU',
    status: 'AVAILABLE',
    photoUrl: MEDICAL_PHOTOS.syringe,
    qrCode: 'SYR-205|ICU|Alaris-CC',
    standardAccessories: [
      'IV Pole Swivel Clamp',
      'Medical Grade Power Cable',
      'Syringe Barrel Sensor Guard'
    ],
    lastMaintenanceDate: '01 Aug 2026',
    notes: 'Micro-infusion capability for inotropic support.'
  },
  {
    id: 'eq-def-301',
    assetId: 'DEF-301',
    name: 'Philips HeartStart XL+ Biphasic Defibrillator',
    category: 'Defibrillator',
    manufacturer: 'Philips Healthcare',
    model: 'HeartStart XL+',
    serialNumber: 'PH-33418-XL',
    owningDepartment: 'ICU',
    currentConfirmedDepartment: 'ICU',
    status: 'AVAILABLE',
    photoUrl: MEDICAL_PHOTOS.defibrillator,
    qrCode: 'DEF-301|ICU|HeartStart-XL+',
    standardAccessories: [
      'Multifunction Defibrillation Cable (Hands-Free)',
      'External Adult/Pediatric Hard Paddles with Built-in Contacts',
      '3-Lead ECG Patient Cable',
      'Medical Grade Power Cord',
      'Rechargeable Lithium-Ion Battery Pack'
    ],
    lastMaintenanceDate: '05 Sep 2026',
    notes: 'Self-test passed. Synchronized cardioversion ready.'
  },
  {
    id: 'eq-mon-202',
    assetId: 'MON-202',
    name: 'Mindray BeneVision N17 Multi-Para Patient Monitor',
    category: 'Patient Monitor',
    manufacturer: 'Mindray',
    model: 'BeneVision N17',
    serialNumber: 'MN-77215-N17',
    owningDepartment: 'PICU',
    currentConfirmedDepartment: 'PICU',
    status: 'AVAILABLE',
    photoUrl: MEDICAL_PHOTOS.monitor,
    qrCode: 'MON-202|PICU|BeneVision-N17',
    standardAccessories: [
      '5-Lead ECG Cable & Leadwire Set',
      'SpO2 Nellcor Reusable Finger Sensor',
      'NIBP Air Hose & 3 Cuff Sizes (Infant, Child, Small Adult)',
      'Skin Temperature Probe (Skin surface)',
      'Heavy Duty Rolling Stand with Accessory Basket'
    ],
    lastMaintenanceDate: '18 Aug 2026',
    notes: '17-inch touchscreen with advanced arrhythmia analysis.'
  },
  {
    id: 'eq-suc-005',
    assetId: 'SUC-005',
    name: 'Medela Vario 18 High-Vacuum Surgical Suction Unit',
    category: 'Suction Unit',
    manufacturer: 'Medela Healthcare',
    model: 'Vario 18 c/i',
    serialNumber: 'MD-55102-V18',
    owningDepartment: 'OT-1',
    currentConfirmedDepartment: 'OT-1',
    status: 'AVAILABLE',
    photoUrl: MEDICAL_PHOTOS.suction,
    qrCode: 'SUC-005|OT-1|Vario-18',
    standardAccessories: [
      '2L Autoclavable Polysulfone Suction Jar',
      'Disposable Overflow Protection Filter',
      'Medical Grade Vacuum Tubing (3 meters)',
      'Mobile 5-Castor Wheeled Stand'
    ],
    lastMaintenanceDate: '25 Aug 2026',
    notes: 'Whisper-quiet diaphragm pump for surgical aspirate.'
  }
];

export const INITIAL_TRANSFERS: TransferRecord[] = [
  {
    id: 'tr-sample-001',
    transferRef: 'TR-2026-0925-004',
    equipmentId: 'eq-inf-102',
    assetId: 'INF-102',
    equipmentName: 'B. Braun Infusomat Space Volumetric Pump',
    owningDepartment: 'ICU',
    fromDepartment: 'ICU',
    toDepartment: 'ER',
    status: 'Closed',
    dispatchedBy: INITIAL_STAFF[0], // Sister Priya
    dispatchedAt: '25 Sep 2026, 09:15 AM IST',
    dispatchPhotoUrl: MEDICAL_PHOTOS.infusion,
    dispatchCondition: 'EXCELLENT',
    accessoriesSent: [
      { id: 'acc-1', name: 'Pole Clamp Fastener', included: true },
      { id: 'acc-2', name: 'Space Power Supply 12V Cord', included: true },
      { id: 'acc-3', name: 'Drop Sensor Probe & Clip', included: true }
    ],
    dispatchNotes: 'Temporary loan for multiple trauma admission in ER resuscitation bay.',
    expectedReturnDate: '2026-09-26',
    
    receivedBy: INITIAL_STAFF[3], // Brother Manoj
    receivedAt: '25 Sep 2026, 09:28 AM IST',
    receivedPhotoUrl: MEDICAL_PHOTOS.infusion,
    receivedCondition: 'EXCELLENT',
    accessoriesReceived: [
      { id: 'acc-1', name: 'Pole Clamp Fastener', included: true },
      { id: 'acc-2', name: 'Space Power Supply 12V Cord', included: true },
      { id: 'acc-3', name: 'Drop Sensor Probe & Clip', included: true }
    ],
    receiverNotes: 'Received in good working order. Mounted on IV pole in Bay 2.',
    
    returnRequested: true,
    returnRequestedBy: INITIAL_STAFF[0],
    returnRequestedAt: '26 Sep 2026, 08:30 AM IST',
    returnRequestReason: 'ICU patient bed expansion, need pump back.',
    
    returnDispatched: true,
    returnDispatchedBy: INITIAL_STAFF[3],
    returnDispatchedAt: '26 Sep 2026, 09:00 AM IST',
    returnDispatchPhotoUrl: MEDICAL_PHOTOS.infusion,
    returnDispatchCondition: 'EXCELLENT',
    returnAccessoriesSent: [
      { id: 'acc-1', name: 'Pole Clamp Fastener', included: true },
      { id: 'acc-2', name: 'Space Power Supply 12V Cord', included: true },
      { id: 'acc-3', name: 'Drop Sensor Probe & Clip', included: true }
    ],
    returnDispatchNotes: 'Disinfected and cleaned with surface wipes before return.',
    
    closedBy: INITIAL_STAFF[0],
    closedAt: '26 Sep 2026, 09:12 AM IST',
    closeCondition: 'EXCELLENT',
    closeAccessoriesChecked: [
      { id: 'acc-1', name: 'Pole Clamp Fastener', included: true },
      { id: 'acc-2', name: 'Space Power Supply 12V Cord', included: true },
      { id: 'acc-3', name: 'Drop Sensor Probe & Clip', included: true }
    ],
    closeNotes: 'Inspected and verified all accessories returned intact. Loan closed.',
    
    discrepancies: [],
    hasOpenDiscrepancy: false
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-seed-1',
    timestamp: '25 Sep 2026, 09:15 AM IST',
    action: 'TRANSFER_DISPATCHED',
    entityType: 'TRANSFER',
    entityId: 'tr-sample-001',
    performedBy: INITIAL_STAFF[0],
    details: 'Dispatched INF-102 from ICU to ER. Ref: TR-2026-0925-004'
  },
  {
    id: 'log-seed-2',
    timestamp: '25 Sep 2026, 09:28 AM IST',
    action: 'TRANSFER_RECEIVED',
    entityType: 'TRANSFER',
    entityId: 'tr-sample-001',
    performedBy: INITIAL_STAFF[3],
    details: 'Acknowledged receipt of INF-102 in ER. Status updated to On Loan.'
  },
  {
    id: 'log-seed-3',
    timestamp: '26 Sep 2026, 09:12 AM IST',
    action: 'TRANSFER_CLOSED',
    entityType: 'TRANSFER',
    entityId: 'tr-sample-001',
    performedBy: INITIAL_STAFF[0],
    details: 'Closed loan of INF-102. Confirmed location restored to ICU.'
  }
];
