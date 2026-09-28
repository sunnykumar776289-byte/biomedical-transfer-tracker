import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TransferRecord, Equipment } from '../types';
import { CheckCircle2, Play, Sparkles, ChevronDown, ChevronUp, AlertCircle, RefreshCw, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { api } from '../services/api';

interface DemoGuideProps {
  transfers: TransferRecord[];
  equipment: Equipment[];
  onRefresh: () => void;
  onNavigateTab: (tab: string) => void;
}

export const DemoGuide: React.FC<DemoGuideProps> = ({
  transfers,
  equipment,
  onRefresh,
  onNavigateTab
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { currentUser, switchUser, availableStaff } = useAuth();

  // Find the VENT-001 ventilator and its active transfer if any
  const vent = equipment.find(e => e.assetId === 'VENT-001');
  const ventTransfer = transfers.find(t => 
    t.assetId === 'VENT-001' && 
    (t.status === 'Pending Receipt' || t.status === 'On Loan')
  );
  const closedVentTransfer = transfers.find(t => t.assetId === 'VENT-001' && t.status === 'Closed');

  // Determine current stage of the 6-step lifecycle
  let currentStep = 1;
  if (!ventTransfer && !closedVentTransfer) {
    currentStep = 1; // Need ICU to dispatch
  } else if (ventTransfer?.status === 'Pending Receipt') {
    currentStep = 2; // Need PICU to acknowledge
  } else if (ventTransfer?.status === 'On Loan' && !ventTransfer.returnRequested && !ventTransfer.returnDispatched) {
    currentStep = 3; // Biomedical inspects or ICU requests return
  } else if (ventTransfer?.status === 'On Loan' && ventTransfer.returnRequested && !ventTransfer.returnDispatched) {
    currentStep = 5; // PICU dispatches return back
  } else if (ventTransfer?.status === 'On Loan' && ventTransfer.returnDispatched) {
    currentStep = 6; // ICU confirms receipt and closes
  } else if (closedVentTransfer) {
    currentStep = 7; // Completed full cycle!
  }

  const steps = [
    {
      num: 1,
      title: 'ICU dispatches VENT-001 to PICU',
      role: 'Sister Priya Sharma (ICU)',
      targetStaffId: 'NUR-2041',
      desc: 'Sister Priya initiates direct transfer of Hamilton C3 Ventilator from ICU to PICU.',
      actionLabel: 'Switch to Sister Priya & Open Transfer',
      onAction: () => {
        const staff = availableStaff.find(s => s.staffId === 'NUR-2041');
        if (staff) switchUser(staff);
        onNavigateTab('transfer');
      }
    },
    {
      num: 2,
      title: 'PICU acknowledges receipt (Status → On Loan)',
      role: 'Sister Anjali Nair (PICU)',
      targetStaffId: 'NUR-3108',
      desc: 'Receiving nurse physically inspects accessories, confirms condition, and taps "Received".',
      actionLabel: 'Switch to Sister Anjali & Acknowledge',
      onAction: () => {
        const staff = availableStaff.find(s => s.staffId === 'NUR-3108');
        if (staff) switchUser(staff);
        onNavigateTab('acknowledge');
      }
    },
    {
      num: 3,
      title: 'Biomedical sees confirmed location & complete record',
      role: 'Dr. Rajesh Verma (Biomedical)',
      targetStaffId: 'BME-102',
      desc: 'Biomedical sees live status On Loan in PICU, full audit trail, dual staff signatures, no extra paperwork.',
      actionLabel: 'Switch to Dr. Rajesh & View Dashboard',
      onAction: () => {
        const staff = availableStaff.find(s => s.staffId === 'BME-102');
        if (staff) switchUser(staff);
        onNavigateTab('biomedical');
      }
    },
    {
      num: 4,
      title: 'ICU requests return',
      role: 'Sister Priya Sharma (ICU)',
      targetStaffId: 'NUR-2041',
      desc: 'ICU requests VENT-001 return back to ICU when patient requirement completes.',
      actionLabel: 'Switch to Sister Priya & Request Return',
      onAction: () => {
        const staff = availableStaff.find(s => s.staffId === 'NUR-2041');
        if (staff) switchUser(staff);
        onNavigateTab('returns');
      }
    },
    {
      num: 5,
      title: 'PICU dispatches ventilator back to ICU',
      role: 'Sister Anjali Nair (PICU)',
      targetStaffId: 'NUR-3108',
      desc: 'Borrowing PICU staff performs cleaning, packs accessories, and confirms return dispatch.',
      actionLabel: 'Switch to Sister Anjali & Dispatch Return',
      onAction: () => {
        const staff = availableStaff.find(s => s.staffId === 'NUR-3108');
        if (staff) switchUser(staff);
        onNavigateTab('returns');
      }
    },
    {
      num: 6,
      title: 'ICU confirms receipt & closes loan (Status → Closed)',
      role: 'Sister Priya Sharma (ICU)',
      targetStaffId: 'NUR-2041',
      desc: 'Original department inspects equipment, verifies all accessories, and taps "Received Back & Close".',
      actionLabel: 'Switch to Sister Priya & Close Loan',
      onAction: () => {
        const staff = availableStaff.find(s => s.staffId === 'NUR-2041');
        if (staff) switchUser(staff);
        onNavigateTab('returns');
      }
    }
  ];

  const handleResetData = async () => {
    if (!confirm('Reset all demo data back to clean hospital baseline?')) return;
    setResetting(true);
    try {
      await api.resetDemoData();
      onRefresh();
      // Reset active user to Sister Priya
      const staff = availableStaff.find(s => s.staffId === 'NUR-2041');
      if (staff) switchUser(staff);
      onNavigateTab('home');
    } catch (e) {
      alert('Error resetting demo data: ' + e);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/60 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="text-xs font-semibold flex items-center gap-2">
              <span className="text-indigo-300 font-bold tracking-wider uppercase text-[11px]">
                Hospital Demo Workflow:
              </span>
              <span className="text-white hidden sm:inline">
                {currentStep === 7
                  ? 'All 6 Steps Completed! Full ICU ⇄ PICU Cycle Closed'
                  : `Step ${currentStep} of 6: ${steps[Math.min(currentStep - 1, 5)].title}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-xs font-medium bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 px-3 py-1 rounded-lg border border-indigo-700/50 flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isOpen ? 'Hide Scenario Guide' : 'Open Guided Demo'}</span>
              {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleResetData}
              disabled={resetting}
              className="text-xs text-slate-300 hover:text-white px-2 py-1 rounded hover:bg-slate-800 flex items-center gap-1 transition-colors"
              title="Reset sample data"
            >
              <RefreshCw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Reset Baseline</span>
            </button>
          </div>
        </div>

        {/* Collapsible Steps Panel */}
        {isOpen && (
          <div className="mt-3 pt-3 border-t border-indigo-900/60 animate-in fade-in space-y-3">
            <div className="text-xs text-indigo-200 leading-relaxed bg-indigo-950/60 p-2.5 rounded-lg border border-indigo-800/40">
              <strong>Clinical Requirement:</strong> PICU urgently needs a ventilator from ICU. Instead of physically carrying it to Biomedical first, ICU dispatches directly to PICU with dual authenticated acknowledgement, keeping Biomedical automatically informed with full audit records.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {steps.map((step) => {
                const isCurrent = currentStep === step.num;
                const isPassed = currentStep > step.num;

                return (
                  <div
                    key={step.num}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      isCurrent
                        ? 'bg-indigo-900/90 border-amber-400/80 shadow-md ring-1 ring-amber-400/50'
                        : isPassed
                        ? 'bg-slate-900/70 border-emerald-500/40 opacity-80'
                        : 'bg-slate-900/40 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                          isPassed
                            ? 'bg-emerald-500 text-white'
                            : isCurrent
                            ? 'bg-amber-400 text-slate-950 animate-pulse'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {isPassed ? '✓' : step.num}
                        </span>
                        <span className={isCurrent ? 'text-amber-200 font-bold' : 'text-slate-200'}>
                          Step {step.num}
                        </span>
                      </div>
                      <span className="text-[10px] text-indigo-300 font-medium">{step.role}</span>
                    </div>

                    <p className="text-[11px] text-slate-300 mb-2 leading-snug">{step.desc}</p>

                    <button
                      onClick={step.onAction}
                      className={`w-full py-1.5 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-all ${
                        isCurrent
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-xs'
                          : 'bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-800'
                      }`}
                    >
                      <span>{step.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Validation quick checks */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-indigo-900/40 text-[11px] text-indigo-300">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Dual Staff Signatures
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  IST Timestamps
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Duplicate Dispatch Safeguard
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Private Photo Storage
                </span>
              </div>

              <div className="text-slate-400">
                Current Terminal: <strong className="text-white">{currentUser.name}</strong> ({currentUser.department} - {currentUser.staffId})
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
