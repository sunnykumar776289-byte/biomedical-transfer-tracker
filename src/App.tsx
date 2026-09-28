/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import { Equipment, TransferRecord, AuditLog, HospitalSettings } from './types';
import { INITIAL_EQUIPMENT, INITIAL_TRANSFERS, INITIAL_SETTINGS } from './constants/initialData';

// Components & Views
import { Navigation } from './components/Navigation';
import { DemoGuide } from './components/DemoGuide';
import { StaffSwitcherModal } from './components/StaffSwitcherModal';
import { QRScannerModal } from './components/QRScannerModal';
import { TransferReceiptModal } from './components/TransferReceiptModal';
import { NewEquipmentModal } from './components/NewEquipmentModal';

import { HomeView } from './views/HomeView';
import { EquipmentRegisterView } from './views/EquipmentRegisterView';
import { TransferView } from './views/TransferView';
import { AcknowledgeReceiptView } from './views/AcknowledgeReceiptView';
import { ReturnsView } from './views/ReturnsView';
import { BiomedicalDashboardView } from './views/BiomedicalDashboardView';
import { AdminView } from './views/AdminView';

function MainApp() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');

  // Server state
  const [equipmentList, setEquipmentList] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [transfers, setTransfers] = useState<TransferRecord[]>(INITIAL_TRANSFERS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<HospitalSettings>(INITIAL_SETTINGS);
  const [staffList, setStaffList] = useState<any[]>([]);

  // Modals state
  const [isStaffSwitcherOpen, setIsStaffSwitcherOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isNewEquipOpen, setIsNewEquipOpen] = useState(false);
  const [receiptTransfer, setReceiptTransfer] = useState<TransferRecord | null>(null);
  const [transferTargetEquip, setTransferTargetEquip] = useState<Equipment | null>(null);

  // Fetch data
  const fetchData = async () => {
    try {
      const [eq, tr, logs, sett, staff] = await Promise.all([
        api.getEquipment().catch(() => INITIAL_EQUIPMENT),
        api.getTransfers().catch(() => INITIAL_TRANSFERS),
        api.getAuditLogs().catch(() => []),
        api.getSettings().catch(() => INITIAL_SETTINGS),
        api.getStaff().catch(() => [])
      ]);
      setEquipmentList(eq);
      setTransfers(tr);
      setAuditLogs(logs);
      setSettings(sett);
      setStaffList(staff);
    } catch (err) {
      console.error('Error fetching hospital records:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectEquipmentForTransfer = (equipment: Equipment) => {
    setTransferTargetEquip(equipment);
    setActiveTab('transfer');
  };

  const handleQRSelect = (equipment: Equipment) => {
    setTransferTargetEquip(equipment);
    setActiveTab('transfer');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* 1. Clinical Scenario Guide & Step Player */}
      <DemoGuide
        transfers={transfers}
        equipment={equipmentList}
        onRefresh={fetchData}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* 2. Top Navigation & Mobile Bottom Bar */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        transfers={transfers}
        onOpenStaffSwitcher={() => setIsStaffSwitcherOpen(true)}
      />

      {/* 3. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5">
        {activeTab === 'home' && (
          <HomeView
            onNavigateTab={setActiveTab}
            transfers={transfers}
            equipment={equipmentList}
            onOpenQR={() => setIsQRScannerOpen(true)}
            onSelectTransferReceipt={(t) => setReceiptTransfer(t)}
          />
        )}

        {activeTab === 'equipment' && (
          <EquipmentRegisterView
            equipmentList={equipmentList}
            transfers={transfers}
            onSelectForTransfer={handleSelectEquipmentForTransfer}
            onOpenQR={() => setIsQRScannerOpen(true)}
            onOpenReceipt={(t) => setReceiptTransfer(t)}
            onAddNewEquipment={() => setIsNewEquipOpen(true)}
          />
        )}

        {activeTab === 'transfer' && (
          <TransferView
            equipmentList={equipmentList}
            preSelectedEquipment={transferTargetEquip}
            onOpenQR={() => setIsQRScannerOpen(true)}
            onTransferComplete={(transfer) => {
              fetchData();
              setReceiptTransfer(transfer);
            }}
          />
        )}

        {activeTab === 'acknowledge' && (
          <AcknowledgeReceiptView
            transfers={transfers}
            onRefresh={fetchData}
            onOpenReceipt={(t) => setReceiptTransfer(t)}
          />
        )}

        {activeTab === 'returns' && (
          <ReturnsView
            transfers={transfers}
            onRefresh={fetchData}
            onOpenReceipt={(t) => setReceiptTransfer(t)}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'biomedical' && (
          <BiomedicalDashboardView
            equipmentList={equipmentList}
            transfers={transfers}
            auditLogs={auditLogs}
            onRefresh={fetchData}
            onOpenReceipt={(t) => setReceiptTransfer(t)}
          />
        )}

        {activeTab === 'admin' && (
          <AdminView
            settings={settings}
            staffList={staffList}
            onRefresh={fetchData}
            onOpenNewEquipment={() => setIsNewEquipOpen(true)}
          />
        )}
      </main>

      {/* Global Modals */}
      <StaffSwitcherModal
        isOpen={isStaffSwitcherOpen}
        onClose={() => setIsStaffSwitcherOpen(false)}
      />

      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onSelectEquipment={handleQRSelect}
        equipmentList={equipmentList}
      />

      <TransferReceiptModal
        isOpen={Boolean(receiptTransfer)}
        onClose={() => setReceiptTransfer(null)}
        transfer={receiptTransfer}
      />

      <NewEquipmentModal
        isOpen={isNewEquipOpen}
        onClose={() => setIsNewEquipOpen(false)}
        onCreated={fetchData}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
