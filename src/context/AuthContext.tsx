import React, { createContext, useContext, useState, useEffect } from 'react';
import { StaffUser, UserRole, DepartmentId } from '../types';

interface AuthContextType {
  currentUser: StaffUser;
  switchUser: (user: StaffUser) => void;
  availableStaff: StaffUser[];
  loginCustomStaff: (name: string, staffId: string, department: DepartmentId, role: UserRole, designation?: string) => void;
  canInitiateTransfer: (equipmentOwningDept: DepartmentId, currentDept: DepartmentId) => boolean;
  canAcknowledgeReceipt: (toDept: DepartmentId) => boolean;
  canCloseReturn: (owningDept: DepartmentId) => boolean;
  isBiomedical: boolean;
  isAdmin: boolean;
}

const DEFAULT_STAFF_LIST: StaffUser[] = [
  {
    id: 'staff-icu-1',
    name: 'Sister Priya Sharma',
    staffId: 'NUR-2041',
    role: 'STAFF',
    department: 'ICU',
    designation: 'Senior Charge Nurse (ICU)',
    phone: '+91 98201 14520'
  },
  {
    id: 'staff-picu-1',
    name: 'Sister Anjali Nair',
    staffId: 'NUR-3108',
    role: 'STAFF',
    department: 'PICU',
    designation: 'Pediatric ICU Staff Nurse',
    phone: '+91 98332 99014'
  },
  {
    id: 'staff-ot-1',
    name: 'Sister Sunita Rao',
    staffId: 'NUR-1144',
    role: 'STAFF',
    department: 'OT-1',
    designation: 'Operating Theatre Nurse',
    phone: '+91 98450 33211'
  },
  {
    id: 'staff-er-1',
    name: 'Brother Manoj Kumar',
    staffId: 'NUR-5022',
    role: 'STAFF',
    department: 'ER',
    designation: 'Emergency Trauma Nurse',
    phone: '+91 98110 54109'
  },
  {
    id: 'staff-bme-1',
    name: 'Dr. Rajesh Verma',
    staffId: 'BME-102',
    role: 'BIOMEDICAL',
    department: 'BIOMEDICAL',
    designation: 'Lead Biomedical Engineer',
    phone: '+91 98711 88320'
  },
  {
    id: 'staff-admin-1',
    name: 'Arun Mehta',
    staffId: 'ADM-001',
    role: 'ADMIN',
    department: 'BIOMEDICAL',
    designation: 'Equipment Operations & Admin',
    phone: '+91 98200 12001'
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [availableStaff, setAvailableStaff] = useState<StaffUser[]>(DEFAULT_STAFF_LIST);
  const [currentUser, setCurrentUser] = useState<StaffUser>(() => {
    const saved = localStorage.getItem('biomed_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    // Default to Sister Priya (ICU) to show the starting scenario
    return DEFAULT_STAFF_LIST[0];
  });

  useEffect(() => {
    localStorage.setItem('biomed_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const switchUser = (user: StaffUser) => {
    setCurrentUser(user);
  };

  const loginCustomStaff = (name: string, staffId: string, department: DepartmentId, role: UserRole, designation?: string) => {
    const newUser: StaffUser = {
      id: 'staff-custom-' + Date.now(),
      name: name.trim(),
      staffId: staffId.trim().toUpperCase(),
      role,
      department,
      designation: designation || (role === 'STAFF' ? 'Staff Nurse' : role === 'BIOMEDICAL' ? 'Biomedical Engineer' : 'Hospital Administrator')
    };
    setAvailableStaff(prev => [newUser, ...prev]);
    setCurrentUser(newUser);
  };

  const isBiomedical = currentUser.role === 'BIOMEDICAL' || currentUser.role === 'ADMIN';
  const isAdmin = currentUser.role === 'ADMIN';

  // Permission checks
  const canInitiateTransfer = (_equipmentOwningDept: DepartmentId, currentDept: DepartmentId) => {
    if (isAdmin || isBiomedical) return true;
    return currentUser.department === currentDept;
  };

  const canAcknowledgeReceipt = (toDept: DepartmentId) => {
    if (isAdmin) return true;
    return currentUser.department === toDept;
  };

  const canCloseReturn = (owningDept: DepartmentId) => {
    if (isAdmin || isBiomedical) return true;
    return currentUser.department === owningDept;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        switchUser,
        availableStaff,
        loginCustomStaff,
        canInitiateTransfer,
        canAcknowledgeReceipt,
        canCloseReturn,
        isBiomedical,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
