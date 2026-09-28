import fs from 'fs';
import path from 'path';
import { StaffUser, Equipment, TransferRecord, AuditLog, HospitalSettings } from '../src/types';
import { 
  getISTTimestamp, 
  MEDICAL_PHOTOS, 
  INITIAL_STAFF, 
  INITIAL_SETTINGS, 
  INITIAL_EQUIPMENT, 
  INITIAL_TRANSFERS, 
  INITIAL_AUDIT_LOGS 
} from '../src/constants/initialData.js';

export { 
  getISTTimestamp, 
  MEDICAL_PHOTOS, 
  INITIAL_STAFF, 
  INITIAL_SETTINGS, 
  INITIAL_EQUIPMENT, 
  INITIAL_TRANSFERS, 
  INITIAL_AUDIT_LOGS 
};

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface DatabaseSchema {
  equipment: Equipment[];
  transfers: TransferRecord[];
  auditLogs: AuditLog[];
  staff: StaffUser[];
  settings: HospitalSettings;
}

class StorageManager {
  private db: DatabaseSchema | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(raw);
        console.log('[Storage] Successfully loaded database from disk.');
      } catch (err) {
        console.error('[Storage] Error reading db.json, re-seeding:', err);
        this.seed();
      }
    } else {
      this.seed();
    }
  }

  public seed() {
    this.db = {
      equipment: JSON.parse(JSON.stringify(INITIAL_EQUIPMENT)),
      transfers: JSON.parse(JSON.stringify(INITIAL_TRANSFERS)),
      auditLogs: JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)),
      staff: JSON.parse(JSON.stringify(INITIAL_STAFF)),
      settings: JSON.parse(JSON.stringify(INITIAL_SETTINGS))
    };
    this.save();
    console.log('[Storage] Database seeded with initial hospital data.');
  }

  public save() {
    if (!this.db) return;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Storage] Error saving db.json:', err);
    }
  }

  public getDb(): DatabaseSchema {
    if (!this.db) {
      this.init();
    }
    return this.db!;
  }

  public addAuditLog(action: string, entityType: AuditLog['entityType'], entityId: string, performedBy: StaffUser, details: string, correctionReason?: string) {
    const log: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: getISTTimestamp(),
      action,
      entityType,
      entityId,
      performedBy,
      details,
      correctionReason
    };
    this.db?.auditLogs.unshift(log);
    this.save();
    return log;
  }
}

export const storage = new StorageManager();
