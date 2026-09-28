import { Equipment, TransferRecord, StaffUser, AuditLog, HospitalSettings } from '../types';

export const api = {
  // Equipment
  async getEquipment(params?: { q?: string; dept?: string; status?: string; category?: string }): Promise<Equipment[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/equipment${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch equipment');
    return res.json();
  },

  async getEquipmentById(id: string): Promise<Equipment & { history: TransferRecord[] }> {
    const res = await fetch(`/api/equipment/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Equipment not found');
    return res.json();
  },

  async createEquipment(data: Partial<Equipment> & { user: StaffUser }): Promise<Equipment> {
    const res = await fetch('/api/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to register equipment');
    }
    return res.json();
  },

  // Transfers
  async getTransfers(params?: { status?: string; dept?: string; assetId?: string }): Promise<TransferRecord[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/transfers${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch transfers');
    return res.json();
  },

  async getTransferById(id: string): Promise<TransferRecord> {
    const res = await fetch(`/api/transfers/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Transfer record not found');
    return res.json();
  },

  async createTransfer(payload: {
    equipmentId: string;
    toDepartment: string;
    dispatchPhotoUrl?: string;
    dispatchCondition: string;
    accessoriesSent: any[];
    dispatchNotes?: string;
    transferReason?: string;
    expectedReturnDate?: string;
    user: StaffUser;
  }): Promise<{ transfer: TransferRecord; equipment: Equipment }> {
    const res = await fetch('/api/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to dispatch equipment');
    }
    return res.json();
  },

  async acknowledgeTransfer(
    transferId: string,
    payload: {
      user: StaffUser;
      receivedPhotoUrl?: string;
      receivedCondition?: string;
      accessoriesReceived?: any[];
      receiverNotes?: string;
      discrepancy?: {
        type: string;
        description: string;
        photoUrl?: string;
      };
    }
  ): Promise<{ transfer: TransferRecord; equipment: Equipment }> {
    const res = await fetch(`/api/transfers/${encodeURIComponent(transferId)}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to acknowledge receipt');
    }
    return res.json();
  },

  async requestReturn(transferId: string, payload: { user: StaffUser; reason?: string }): Promise<TransferRecord> {
    const res = await fetch(`/api/transfers/${encodeURIComponent(transferId)}/request-return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to request return');
    }
    return res.json();
  },

  async dispatchReturn(
    transferId: string,
    payload: {
      user: StaffUser;
      returnDispatchPhotoUrl?: string;
      returnDispatchCondition?: string;
      returnAccessoriesSent?: any[];
      returnDispatchNotes?: string;
    }
  ): Promise<{ transfer: TransferRecord; equipment: Equipment }> {
    const res = await fetch(`/api/transfers/${encodeURIComponent(transferId)}/dispatch-return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to dispatch return');
    }
    return res.json();
  },

  async closeTransfer(
    transferId: string,
    payload: {
      user: StaffUser;
      closeCondition?: string;
      closeAccessoriesChecked?: any[];
      closeNotes?: string;
      discrepancy?: {
        type: string;
        description: string;
        photoUrl?: string;
      };
    }
  ): Promise<{ transfer: TransferRecord; equipment: Equipment }> {
    const res = await fetch(`/api/transfers/${encodeURIComponent(transferId)}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to close transfer');
    }
    return res.json();
  },

  async reportIssue(
    transferId: string,
    payload: {
      user: StaffUser;
      type: string;
      description: string;
      photoUrl?: string;
    }
  ): Promise<{ transfer: TransferRecord }> {
    const res = await fetch(`/api/transfers/${encodeURIComponent(transferId)}/report-issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to report issue');
    }
    return res.json();
  },

  async resolveIssue(
    transferId: string,
    payload: {
      discrepancyId: string;
      user: StaffUser;
      resolutionNotes?: string;
    }
  ): Promise<TransferRecord> {
    const res = await fetch(`/api/transfers/${encodeURIComponent(transferId)}/resolve-issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to resolve discrepancy');
    }
    return res.json();
  },

  async onwardTransfer(payload: {
    currentTransferId: string;
    toDepartment: string;
    user: StaffUser;
    accessoriesSent?: any[];
    condition?: string;
    photoUrl?: string;
    reason?: string;
    expectedReturnDate?: string;
  }): Promise<{ transfer: TransferRecord; equipment: Equipment }> {
    const res = await fetch('/api/transfers/onward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create onward transfer');
    }
    return res.json();
  },

  // Staff & Settings & Audit
  async getStaff(): Promise<StaffUser[]> {
    const res = await fetch('/api/staff');
    if (!res.ok) throw new Error('Failed to fetch staff');
    return res.json();
  },

  async getSettings(): Promise<HospitalSettings> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(settings: Partial<HospitalSettings>): Promise<HospitalSettings> {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/audit-logs');
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async resetDemoData(): Promise<{ message: string }> {
    const res = await fetch('/api/reset-demo', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset demo data');
    return res.json();
  }
};
