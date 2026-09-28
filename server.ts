import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { storage, getISTTimestamp, INITIAL_EQUIPMENT, INITIAL_TRANSFERS, INITIAL_STAFF } from './server/db.js';
import { TransferRecord, StaffUser, DiscrepancyReport, Equipment, EquipmentCondition, AccessoryItem } from './src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

// -------------------------------------------------------------
// REST API Endpoints
// -------------------------------------------------------------

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: getISTTimestamp(), app: 'Biomedical Equipment Transfer Register' });
});

// Settings
app.get('/api/settings', (_req: Request, res: Response) => {
  const db = storage.getDb();
  res.json(db.settings);
});

app.post('/api/settings', (req: Request, res: Response) => {
  const db = storage.getDb();
  const { requireBiomedicalPreApproval, autoAlertOverdueHours } = req.body;
  if (typeof requireBiomedicalPreApproval === 'boolean') {
    db.settings.requireBiomedicalPreApproval = requireBiomedicalPreApproval;
  }
  if (typeof autoAlertOverdueHours === 'number') {
    db.settings.autoAlertOverdueHours = autoAlertOverdueHours;
  }
  storage.save();
  res.json(db.settings);
});

// Staff
app.get('/api/staff', (_req: Request, res: Response) => {
  const db = storage.getDb();
  res.json(db.staff);
});

app.post('/api/staff', (req: Request, res: Response) => {
  const db = storage.getDb();
  const newStaff: StaffUser = req.body;
  if (!newStaff.name || !newStaff.staffId || !newStaff.department) {
    return res.status(400).json({ error: 'Missing required staff fields' });
  }
  newStaff.id = 'staff-' + Date.now();
  db.staff.push(newStaff);
  storage.save();
  res.json(newStaff);
});

// Equipment Register
app.get('/api/equipment', (req: Request, res: Response) => {
  const db = storage.getDb();
  let list = db.equipment;

  const q = typeof req.query.q === 'string' ? req.query.q.toLowerCase().trim() : '';
  const dept = typeof req.query.dept === 'string' ? req.query.dept : '';
  const status = typeof req.query.status === 'string' ? req.query.status : '';
  const category = typeof req.query.category === 'string' ? req.query.category : '';

  if (q) {
    list = list.filter(e => 
      e.assetId.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      e.manufacturer.toLowerCase().includes(q) ||
      e.model.toLowerCase().includes(q) ||
      e.serialNumber.toLowerCase().includes(q) ||
      e.owningDepartment.toLowerCase().includes(q) ||
      e.currentConfirmedDepartment.toLowerCase().includes(q)
    );
  }

  if (dept) {
    list = list.filter(e => e.currentConfirmedDepartment === dept || e.owningDepartment === dept);
  }

  if (status) {
    list = list.filter(e => e.status === status);
  }

  if (category) {
    list = list.filter(e => e.category === category);
  }

  res.json(list);
});

app.get('/api/equipment/:id', (req: Request, res: Response) => {
  const db = storage.getDb();
  const item = db.equipment.find(e => e.id === req.params.id || e.assetId.toLowerCase() === req.params.id.toLowerCase());
  if (!item) {
    return res.status(404).json({ error: 'Equipment not found' });
  }
  // Also attach movement history for this specific asset
  const history = db.transfers.filter(t => t.equipmentId === item.id || t.assetId === item.assetId);
  res.json({ ...item, history });
});

app.post('/api/equipment', (req: Request, res: Response) => {
  const db = storage.getDb();
  const { assetId, name, category, manufacturer, model, serialNumber, owningDepartment, photoUrl, standardAccessories, notes, user } = req.body;

  if (!assetId || !name || !owningDepartment) {
    return res.status(400).json({ error: 'Asset ID, name, and owning department are required.' });
  }

  const existing = db.equipment.find(e => e.assetId.toLowerCase() === assetId.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: `Equipment with Asset ID "${assetId}" already exists.` });
  }

  const newEquip: Equipment = {
    id: 'eq-' + Date.now(),
    assetId: assetId.toUpperCase(),
    name,
    category: category || 'Ventilator',
    manufacturer: manufacturer || 'Unknown',
    model: model || 'N/A',
    serialNumber: serialNumber || 'N/A',
    owningDepartment,
    currentConfirmedDepartment: owningDepartment,
    status: 'AVAILABLE',
    photoUrl: photoUrl || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
    qrCode: `${assetId}|${owningDepartment}|${name}`,
    standardAccessories: standardAccessories || ['Power Cable', 'Standard Accessories'],
    lastMaintenanceDate: getISTTimestamp().split(',')[0],
    notes
  };

  db.equipment.push(newEquip);
  storage.save();

  if (user) {
    storage.addAuditLog('EQUIPMENT_REGISTERED', 'EQUIPMENT', newEquip.id, user, `Added new asset ${newEquip.assetId} (${newEquip.name}) to ${newEquip.owningDepartment}`);
  }

  res.status(201).json(newEquip);
});

// Transfers
app.get('/api/transfers', (req: Request, res: Response) => {
  const db = storage.getDb();
  let list = db.transfers;

  const status = typeof req.query.status === 'string' ? req.query.status : '';
  const dept = typeof req.query.dept === 'string' ? req.query.dept : '';
  const assetId = typeof req.query.assetId === 'string' ? req.query.assetId.toLowerCase() : '';

  if (status) {
    list = list.filter(t => t.status === status);
  }

  if (dept) {
    list = list.filter(t => t.fromDepartment === dept || t.toDepartment === dept || t.owningDepartment === dept);
  }

  if (assetId) {
    list = list.filter(t => t.assetId.toLowerCase() === assetId);
  }

  res.json(list);
});

app.get('/api/transfers/:id', (req: Request, res: Response) => {
  const db = storage.getDb();
  const transfer = db.transfers.find(t => t.id === req.params.id || t.transferRef === req.params.id);
  if (!transfer) {
    return res.status(404).json({ error: 'Transfer record not found' });
  }
  res.json(transfer);
});

// Step 1: New Dispatch
app.post('/api/transfers', (req: Request, res: Response) => {
  const db = storage.getDb();
  const {
    equipmentId,
    toDepartment,
    dispatchPhotoUrl,
    dispatchCondition,
    accessoriesSent,
    dispatchNotes,
    transferReason,
    expectedReturnDate,
    user
  } = req.body;

  if (!equipmentId || !toDepartment || !user) {
    return res.status(400).json({ error: 'Missing required transfer details or authenticated user' });
  }

  const equipment = db.equipment.find(e => e.id === equipmentId || e.assetId.toLowerCase() === equipmentId.toLowerCase());
  if (!equipment) {
    return res.status(404).json({ error: 'Equipment not found' });
  }

  // Prevent duplicate active dispatches for the same asset!
  const activeTransfer = db.transfers.find(t => 
    (t.equipmentId === equipment.id || t.assetId === equipment.assetId) &&
    (t.status === 'Pending Receipt' || t.status === 'On Loan')
  );

  if (activeTransfer) {
    return res.status(400).json({
      error: `Duplicate dispatch prevented! Asset ${equipment.assetId} already has an active record (${activeTransfer.transferRef}) with status "${activeTransfer.status}" between ${activeTransfer.fromDepartment} and ${activeTransfer.toDepartment}. Please complete or close that handover first.`
    });
  }

  if (equipment.currentConfirmedDepartment === toDepartment) {
    return res.status(400).json({
      error: `Receiving department (${toDepartment}) must be different from current confirmed department (${equipment.currentConfirmedDepartment}).`
    });
  }

  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const dailyCount = db.transfers.filter(t => t.transferRef.includes(todayStr)).length + 1;
  const transferRef = `TR-${todayStr.slice(0, 4)}-${todayStr.slice(4)}-${String(dailyCount).padStart(3, '0')}`;

  const istNow = getISTTimestamp();

  const newTransfer: TransferRecord = {
    id: 'tr-' + Date.now(),
    transferRef,
    equipmentId: equipment.id,
    assetId: equipment.assetId,
    equipmentName: equipment.name,
    owningDepartment: equipment.owningDepartment,
    fromDepartment: equipment.currentConfirmedDepartment,
    toDepartment,
    status: 'Pending Receipt', // 3 Core statuses: Pending Receipt -> On Loan -> Closed
    dispatchedBy: user,
    dispatchedAt: istNow,
    dispatchPhotoUrl: dispatchPhotoUrl || equipment.photoUrl,
    dispatchCondition: dispatchCondition || 'GOOD',
    accessoriesSent: accessoriesSent || equipment.standardAccessories.map((a: string, i: number) => ({ id: `acc-${i}`, name: a, included: true })),
    dispatchNotes,
    transferReason,
    expectedReturnDate,
    discrepancies: [],
    hasOpenDiscrepancy: false
  };

  // Crucial requirement: After dispatch, show equipment as "In transit - receipt pending".
  // Update its confirmed location ONLY AFTER receipt is acknowledged!
  equipment.status = 'IN_TRANSIT';
  equipment.currentTransferId = newTransfer.id;
  // currentConfirmedDepartment remains sender's department until receiver confirms receipt!

  db.transfers.unshift(newTransfer);
  storage.save();

  storage.addAuditLog(
    'TRANSFER_DISPATCHED',
    'TRANSFER',
    newTransfer.id,
    user,
    `Dispatched ${equipment.assetId} (${equipment.name}) from ${equipment.currentConfirmedDepartment} to ${toDepartment}. Ref: ${transferRef}. Expected return: ${expectedReturnDate || 'Not specified'}.`
  );

  res.status(201).json({ transfer: newTransfer, equipment });
});

// Step 2: Receiving Acknowledgement (Status: Pending Receipt -> On Loan)
app.post('/api/transfers/:id/acknowledge', (req: Request, res: Response) => {
  const db = storage.getDb();
  const transfer = db.transfers.find(t => t.id === req.params.id);
  if (!transfer) {
    return res.status(404).json({ error: 'Transfer not found' });
  }

  if (transfer.status !== 'Pending Receipt') {
    return res.status(400).json({ error: `Cannot acknowledge transfer in status "${transfer.status}". Must be "Pending Receipt".` });
  }

  const { user, receivedPhotoUrl, receivedCondition, accessoriesReceived, receiverNotes, discrepancy } = req.body;
  if (!user) {
    return res.status(400).json({ error: 'Authenticated user required for acknowledgement.' });
  }

  const istNow = getISTTimestamp();

  transfer.receivedBy = user;
  transfer.receivedAt = istNow;
  transfer.receivedPhotoUrl = receivedPhotoUrl || transfer.dispatchPhotoUrl;
  transfer.receivedCondition = receivedCondition || transfer.dispatchCondition;
  transfer.accessoriesReceived = accessoriesReceived || transfer.accessoriesSent;
  transfer.receiverNotes = receiverNotes;
  transfer.status = 'On Loan'; // Status becomes On Loan

  // Update confirmed equipment location NOW that receiver has physically acknowledged!
  const equipment = db.equipment.find(e => e.id === transfer.equipmentId);
  if (equipment) {
    equipment.currentConfirmedDepartment = transfer.toDepartment;
    equipment.status = 'IN_USE';
    equipment.activeLoanTo = transfer.toDepartment;
  }

  // If receiver logged a discrepancy during receipt
  if (discrepancy && discrepancy.description) {
    const report: DiscrepancyReport = {
      id: 'disc-' + Date.now(),
      reportedBy: user,
      reportedAt: istNow,
      type: discrepancy.type || 'MISSING_ACCESSORY',
      description: discrepancy.description,
      photoUrl: discrepancy.photoUrl,
      resolved: false
    };
    transfer.discrepancies.push(report);
    transfer.hasOpenDiscrepancy = true;

    storage.addAuditLog(
      'DISCREPANCY_REPORTED',
      'TRANSFER',
      transfer.id,
      user,
      `Reported issue on ${transfer.assetId} during receipt: [${report.type}] ${report.description}`
    );
  }

  storage.save();

  storage.addAuditLog(
    'TRANSFER_ACKNOWLEDGED',
    'TRANSFER',
    transfer.id,
    user,
    `Acknowledged receipt of ${transfer.assetId} at ${transfer.toDepartment}. Status changed to On Loan. Confirmed location updated to ${transfer.toDepartment}.`
  );

  res.json({ transfer, equipment });
});

// Step 3a: Request Return
app.post('/api/transfers/:id/request-return', (req: Request, res: Response) => {
  const db = storage.getDb();
  const transfer = db.transfers.find(t => t.id === req.params.id);
  if (!transfer) {
    return res.status(404).json({ error: 'Transfer not found' });
  }

  const { user, reason } = req.body;
  if (!user) {
    return res.status(400).json({ error: 'Authenticated user required.' });
  }

  transfer.returnRequested = true;
  transfer.returnRequestedBy = user;
  transfer.returnRequestedAt = getISTTimestamp();
  transfer.returnRequestReason = reason || 'Owning department urgently requires equipment back.';

  storage.save();

  storage.addAuditLog(
    'RETURN_REQUESTED',
    'TRANSFER',
    transfer.id,
    user,
    `Return requested for ${transfer.assetId} by ${user.name} (${user.department}). Reason: ${transfer.returnRequestReason}`
  );

  res.json(transfer);
});

// Step 3b: Dispatch Return (Borrowing dept sends equipment back)
app.post('/api/transfers/:id/dispatch-return', (req: Request, res: Response) => {
  const db = storage.getDb();
  const transfer = db.transfers.find(t => t.id === req.params.id);
  if (!transfer) {
    return res.status(404).json({ error: 'Transfer not found' });
  }

  const { user, returnDispatchPhotoUrl, returnDispatchCondition, returnAccessoriesSent, returnDispatchNotes } = req.body;
  if (!user) {
    return res.status(400).json({ error: 'Authenticated user required.' });
  }

  const istNow = getISTTimestamp();
  transfer.returnDispatched = true;
  transfer.returnDispatchedBy = user;
  transfer.returnDispatchedAt = istNow;
  transfer.returnDispatchPhotoUrl = returnDispatchPhotoUrl || transfer.receivedPhotoUrl;
  transfer.returnDispatchCondition = returnDispatchCondition || transfer.receivedCondition;
  transfer.returnAccessoriesSent = returnAccessoriesSent || transfer.accessoriesReceived;
  transfer.returnDispatchNotes = returnDispatchNotes;

  const equipment = db.equipment.find(e => e.id === transfer.equipmentId);
  if (equipment) {
    equipment.status = 'IN_TRANSIT';
  }

  storage.save();

  storage.addAuditLog(
    'RETURN_DISPATCHED',
    'TRANSFER',
    transfer.id,
    user,
    `Return dispatched for ${transfer.assetId} by ${user.name} from ${transfer.toDepartment} to ${transfer.owningDepartment}.`
  );

  res.json({ transfer, equipment });
});

// Step 4: Received Back & Close
app.post('/api/transfers/:id/close', (req: Request, res: Response) => {
  const db = storage.getDb();
  const transfer = db.transfers.find(t => t.id === req.params.id);
  if (!transfer) {
    return res.status(404).json({ error: 'Transfer not found' });
  }

  const { user, closeCondition, closeAccessoriesChecked, closeNotes, discrepancy } = req.body;
  if (!user) {
    return res.status(400).json({ error: 'Authenticated user required.' });
  }

  const istNow = getISTTimestamp();

  // If there is an unresolved discrepancy or an issue is reported right now:
  if (discrepancy && discrepancy.description) {
    const report: DiscrepancyReport = {
      id: 'disc-' + Date.now(),
      reportedBy: user,
      reportedAt: istNow,
      type: discrepancy.type || 'MISSING_ACCESSORY',
      description: discrepancy.description,
      photoUrl: discrepancy.photoUrl,
      resolved: false
    };
    transfer.discrepancies.push(report);
    transfer.hasOpenDiscrepancy = true;

    storage.addAuditLog(
      'DISCREPANCY_REPORTED',
      'TRANSFER',
      transfer.id,
      user,
      `Reported issue on ${transfer.assetId} during return inspection: [${report.type}] ${report.description}`
    );
  }

  // According to rules: "If equipment or accessories are missing or damaged, provide 'Report Issue' and keep the transaction open for Biomedical review."
  // If user requests close without open discrepancies:
  if (transfer.hasOpenDiscrepancy) {
    // Keep transaction open for Biomedical review!
    storage.save();
    return res.status(400).json({
      error: 'Cannot close transaction with open discrepancy! Issue has been flagged and transaction remains open for Biomedical review.',
      transfer
    });
  }

  transfer.status = 'Closed';
  transfer.closedBy = user;
  transfer.closedAt = istNow;
  transfer.closeCondition = closeCondition || 'EXCELLENT';
  transfer.closeAccessoriesChecked = closeAccessoriesChecked || transfer.accessoriesSent;
  transfer.closeNotes = closeNotes || 'Equipment returned in good condition. All accessories accounted for.';

  const equipment = db.equipment.find(e => e.id === transfer.equipmentId);
  if (equipment) {
    equipment.currentConfirmedDepartment = transfer.owningDepartment;
    equipment.status = 'AVAILABLE';
    equipment.activeLoanTo = null;
    equipment.currentTransferId = null;
  }

  storage.save();

  storage.addAuditLog(
    'TRANSFER_CLOSED',
    'TRANSFER',
    transfer.id,
    user,
    `Loan closed for ${transfer.assetId}. Confirmed location returned to ${transfer.owningDepartment}. Verified by ${user.name} (${user.staffId}).`
  );

  res.json({ transfer, equipment });
});

// Report Discrepancy / Problem
app.post('/api/transfers/:id/report-issue', (req: Request, res: Response) => {
  const db = storage.getDb();
  const transfer = db.transfers.find(t => t.id === req.params.id);
  if (!transfer) {
    return res.status(404).json({ error: 'Transfer not found' });
  }

  const { user, type, description, photoUrl } = req.body;
  if (!user || !description) {
    return res.status(400).json({ error: 'Authenticated user and description required.' });
  }

  const report: DiscrepancyReport = {
    id: 'disc-' + Date.now(),
    reportedBy: user,
    reportedAt: getISTTimestamp(),
    type: type || 'MISSING_ACCESSORY',
    description,
    photoUrl,
    resolved: false
  };

  transfer.discrepancies.push(report);
  transfer.hasOpenDiscrepancy = true;
  storage.save();

  storage.addAuditLog(
    'DISCREPANCY_REPORTED',
    'TRANSFER',
    transfer.id,
    user,
    `Flagged issue for Biomedical review on ${transfer.assetId}: [${report.type}] ${report.description}`
  );

  res.json({ transfer, report });
});

// Resolve Discrepancy (Biomedical engineer)
app.post('/api/transfers/:id/resolve-issue', (req: Request, res: Response) => {
  const db = storage.getDb();
  const transfer = db.transfers.find(t => t.id === req.params.id);
  if (!transfer) {
    return res.status(404).json({ error: 'Transfer not found' });
  }

  const { discrepancyId, user, resolutionNotes } = req.body;
  if (!user) {
    return res.status(400).json({ error: 'Authenticated user required.' });
  }

  const disc = transfer.discrepancies.find(d => d.id === discrepancyId);
  if (!disc) {
    return res.status(404).json({ error: 'Discrepancy report not found' });
  }

  disc.resolved = true;
  disc.resolvedBy = user;
  disc.resolvedAt = getISTTimestamp();
  disc.resolutionNotes = resolutionNotes || 'Resolved by Biomedical Engineering inspection.';

  // Check if all discrepancies are resolved
  transfer.hasOpenDiscrepancy = transfer.discrepancies.some(d => !d.resolved);
  storage.save();

  storage.addAuditLog(
    'DISCREPANCY_RESOLVED',
    'TRANSFER',
    transfer.id,
    user,
    `Biomedical resolved issue on ${transfer.assetId}: ${disc.resolutionNotes}`
  );

  res.json(transfer);
});

// Onward Transfer (e.g. ICU -> PICU -> OT)
app.post('/api/transfers/onward', (req: Request, res: Response) => {
  const db = storage.getDb();
  const { currentTransferId, toDepartment, user, accessoriesSent, condition, photoUrl, reason, expectedReturnDate } = req.body;

  const currentTransfer = db.transfers.find(t => t.id === currentTransferId);
  if (!currentTransfer) {
    return res.status(404).json({ error: 'Current active transfer not found' });
  }

  if (currentTransfer.status !== 'On Loan') {
    return res.status(400).json({ error: 'Can only create onward transfer for equipment currently "On Loan"' });
  }

  const equipment = db.equipment.find(e => e.id === currentTransfer.equipmentId);
  if (!equipment) {
    return res.status(404).json({ error: 'Equipment not found' });
  }

  // Close intermediate leg or transition
  currentTransfer.status = 'Closed';
  currentTransfer.closeNotes = `Onward transferred to ${toDepartment} per clinical requirement.`;
  currentTransfer.closedBy = user;
  currentTransfer.closedAt = getISTTimestamp();

  // Create new leg
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const dailyCount = db.transfers.filter(t => t.transferRef.includes(todayStr)).length + 1;
  const transferRef = `TR-${todayStr.slice(0, 4)}-${todayStr.slice(4)}-${String(dailyCount).padStart(3, '0')}`;

  const onwardTransfer: TransferRecord = {
    id: 'tr-' + Date.now(),
    transferRef,
    equipmentId: equipment.id,
    assetId: equipment.assetId,
    equipmentName: equipment.name,
    owningDepartment: currentTransfer.owningDepartment, // Preserves original owning department!
    fromDepartment: currentTransfer.toDepartment, // Current location
    toDepartment,
    status: 'Pending Receipt',
    dispatchedBy: user,
    dispatchedAt: getISTTimestamp(),
    dispatchPhotoUrl: photoUrl || currentTransfer.receivedPhotoUrl || equipment.photoUrl,
    dispatchCondition: condition || 'GOOD',
    accessoriesSent: accessoriesSent || currentTransfer.accessoriesReceived || [],
    transferReason: reason || `Onward transfer from ${currentTransfer.toDepartment} to ${toDepartment}`,
    expectedReturnDate,
    parentTransferId: currentTransfer.id,
    discrepancies: [],
    hasOpenDiscrepancy: false
  };

  equipment.status = 'IN_TRANSIT';
  equipment.currentTransferId = onwardTransfer.id;

  db.transfers.unshift(onwardTransfer);
  storage.save();

  storage.addAuditLog(
    'ONWARD_TRANSFER_DISPATCHED',
    'TRANSFER',
    onwardTransfer.id,
    user,
    `Onward transfer dispatched for ${equipment.assetId}: ${currentTransfer.toDepartment} -> ${toDepartment}. Original owner preserved as ${equipment.owningDepartment}. Ref: ${transferRef}`
  );

  res.status(201).json({ transfer: onwardTransfer, equipment });
});

// Audit Logs
app.get('/api/audit-logs', (_req: Request, res: Response) => {
  const db = storage.getDb();
  res.json(db.auditLogs);
});

// Export CSV
app.get('/api/export/csv', (req: Request, res: Response) => {
  const db = storage.getDb();
  const type = req.query.type || 'transfers';

  if (type === 'equipment') {
    let csv = 'Asset ID,Equipment Name,Category,Manufacturer,Model,Serial Number,Owning Department,Confirmed Location,Status,Last Maintenance\n';
    db.equipment.forEach(e => {
      csv += `"${e.assetId}","${e.name}","${e.category}","${e.manufacturer}","${e.model}","${e.serialNumber}","${e.owningDepartment}","${e.currentConfirmedDepartment}","${e.status}","${e.lastMaintenanceDate}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="Biomedical_Equipment_Inventory.csv"');
    return res.send(csv);
  }

  // Transfers CSV
  let csv = 'Transfer Ref,Asset ID,Equipment Name,Owning Dept,From Dept,To Dept,Status,Dispatched By,Dispatched At,Received By,Received At,Closed By,Closed At,Has Discrepancy\n';
  db.transfers.forEach(t => {
    csv += `"${t.transferRef}","${t.assetId}","${t.equipmentName}","${t.owningDepartment}","${t.fromDepartment}","${t.toDepartment}","${t.status}","${t.dispatchedBy.name} (${t.dispatchedBy.staffId})","${t.dispatchedAt}","${t.receivedBy ? `${t.receivedBy.name} (${t.receivedBy.staffId})` : 'Pending'}","${t.receivedAt || ''}","${t.closedBy ? `${t.closedBy.name} (${t.closedBy.staffId})` : ''}","${t.closedAt || ''}","${t.hasOpenDiscrepancy ? 'YES' : 'NO'}"\n`;
  });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="Equipment_Transfers_Register.csv"');
  return res.send(csv);
});

// Reset Demo Data
app.post('/api/reset-demo', (_req: Request, res: Response) => {
  storage.seed();
  res.json({ message: 'Demo data successfully reset to initial clinical baseline.' });
});

// -------------------------------------------------------------
// Vite Dev & Production Static Middleware
// -------------------------------------------------------------
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Dev] Vite middlewares mounted.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Server] Biomedical Equipment Transfer Register running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
