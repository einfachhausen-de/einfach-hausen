import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { initializeContactDirectory } from './contact-directory-schema';

const dbPath = process.env.DATABASE_PATH ? path.resolve(process.env.DATABASE_PATH) : path.join(process.cwd(), 'data', 'einfach-hausen.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const globalForDb = globalThis as unknown as { hausmeisterDb?: Database.Database };
export const db = globalForDb.hausmeisterDb ?? new Database(dbPath);
if (process.env.NODE_ENV !== 'production') globalForDb.hausmeisterDb = db;
// busy_timeout makes concurrent writers (build workers, parallel requests)
// wait instead of failing with SQLITE_BUSY; fail-closed limiter writes and
// deterministic startup both depend on it.
db.pragma('busy_timeout = 5000');
db.pragma('journal_mode = WAL'); db.pragma('foreign_keys = ON');
// T-0119 hot-path: WAL can grow unbounded under sustained write bursts (127MB
// observed in production) and synchronous=FULL fsyncs twice per commit for
// little benefit in WAL mode. NORMAL keeps durability across app crashes
// (only a power/OS failure may lose recent commits), and autocheckpoint
// bounds the WAL so large reader snapshots stay cheap.
db.pragma('synchronous = NORMAL');
db.pragma('wal_autocheckpoint = 1000');

// Startup statements run while Next.js may evaluate this module in several
// workers at once; tolerate transient SQLITE_BUSY with bounded retries.
function execWithRetry<T>(fn: () => T, attempts = 10): T {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try { return fn(); } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (!message.includes('busy') && !message.includes('locked')) throw error;
      const waitMs = 25 * (i + 1);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, waitMs);
    }
  }
  throw lastError;
}

execWithRetry(() => db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT NOT NULL UNIQUE COLLATE NOCASE,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('homeowner','provider')),first_name TEXT NOT NULL,last_name TEXT NOT NULL,phone TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,auth_subject TEXT UNIQUE);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at TEXT NOT NULL); CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS homeowner_profiles (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,postcode TEXT NOT NULL DEFAULT '',address TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS provider_profiles (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,business_name TEXT NOT NULL,trades TEXT NOT NULL DEFAULT '',postcode TEXT NOT NULL DEFAULT '',radius_km INTEGER NOT NULL DEFAULT 25,verified INTEGER NOT NULL DEFAULT 0,rating REAL NOT NULL DEFAULT 0,rating_count INTEGER NOT NULL DEFAULT 0,description TEXT NOT NULL DEFAULT '',stripe_account_id TEXT,stripe_onboarded INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS jobs (id INTEGER PRIMARY KEY AUTOINCREMENT,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,title TEXT NOT NULL,description TEXT NOT NULL,category TEXT NOT NULL,postcode TEXT NOT NULL,preferred_date TEXT,preferred_time TEXT,budget_min INTEGER,budget_max INTEGER,status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','quoted','accepted','in_progress','completed','cancelled')),accepted_quote_id INTEGER,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_jobs_homeowner ON jobs(homeowner_id,created_at DESC); CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status,category,postcode);
CREATE TABLE IF NOT EXISTS job_photos (id INTEGER PRIMARY KEY AUTOINCREMENT,job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,path TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS quotes (id INTEGER PRIMARY KEY AUTOINCREMENT,job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,amount INTEGER NOT NULL,available_at TEXT,message TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected','withdrawn')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(job_id,provider_id)); CREATE INDEX IF NOT EXISTS idx_quotes_job ON quotes(job_id,amount ASC);
CREATE TABLE IF NOT EXISTS appointments (id INTEGER PRIMARY KEY AUTOINCREMENT,job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,provider_id INTEGER NOT NULL REFERENCES users(id),homeowner_id INTEGER NOT NULL REFERENCES users(id),start_at TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','completed','cancelled')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_appointments_user_time ON appointments(homeowner_id,start_at);
CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT,job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,sender_id INTEGER NOT NULL REFERENCES users(id),recipient_id INTEGER NOT NULL REFERENCES users(id),body TEXT NOT NULL,read_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_messages_job ON messages(job_id,created_at ASC);
CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT,job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,homeowner_id INTEGER NOT NULL REFERENCES users(id),provider_id INTEGER NOT NULL REFERENCES users(id),amount INTEGER NOT NULL,currency TEXT NOT NULL DEFAULT 'eur',status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','failed','refunded')),stripe_session_id TEXT UNIQUE,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,paid_at TEXT);
CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT,job_id INTEGER NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,homeowner_id INTEGER NOT NULL REFERENCES users(id),provider_id INTEGER NOT NULL REFERENCES users(id),rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),comment TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS documents (id INTEGER PRIMARY KEY AUTOINCREMENT,job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,provider_id INTEGER REFERENCES users(id),kind TEXT NOT NULL CHECK(kind IN ('invoice','offer','report','warranty','other')),title TEXT NOT NULL,path TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_documents_job ON documents(job_id,created_at DESC);
CREATE TABLE IF NOT EXISTS verification_requests (id INTEGER PRIMARY KEY AUTOINCREMENT,provider_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,document_path TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),provider_note TEXT NOT NULL DEFAULT '',admin_note TEXT NOT NULL DEFAULT '',submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,reviewed_at TEXT);
CREATE TABLE IF NOT EXISTS claims (id INTEGER PRIMARY KEY AUTOINCREMENT,job_id INTEGER NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,homeowner_id INTEGER NOT NULL REFERENCES users(id),provider_id INTEGER NOT NULL REFERENCES users(id),description TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','reviewing','resolved','rejected')),admin_note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS admin_sessions (token TEXT PRIMARY KEY,expires_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,kind TEXT NOT NULL DEFAULT 'info',title TEXT NOT NULL,body TEXT NOT NULL DEFAULT '',href TEXT NOT NULL DEFAULT '',read_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id,read_at,created_at DESC);
CREATE TABLE IF NOT EXISTS postcode_geo (postcode TEXT PRIMARY KEY,lat REAL NOT NULL,lon REAL NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS partner_contracts (provider_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','suspended','ended')),commission_bps INTEGER NOT NULL DEFAULT 0,customer_discount_bps INTEGER NOT NULL DEFAULT 0,insurance_verified INTEGER NOT NULL DEFAULT 0,qualification_verified INTEGER NOT NULL DEFAULT 0,contract_verified INTEGER NOT NULL DEFAULT 0,quality_standard_verified INTEGER NOT NULL DEFAULT 0,response_target_minutes INTEGER NOT NULL DEFAULT 30,starts_at TEXT,ends_at TEXT,notes TEXT NOT NULL DEFAULT '',updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS job_dispatches (id INTEGER PRIMARY KEY AUTOINCREMENT,job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,status TEXT NOT NULL DEFAULT 'sent' CHECK(status IN ('sent','viewed','declined','quoted','accepted','closed','expired')),match_score REAL NOT NULL DEFAULT 0,distance_km REAL,sent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,responded_at TEXT,UNIQUE(job_id,provider_id)); CREATE INDEX IF NOT EXISTS idx_dispatch_provider ON job_dispatches(provider_id,status,sent_at DESC);
CREATE TABLE IF NOT EXISTS assistant_threads (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,channel TEXT NOT NULL DEFAULT 'app' CHECK(channel IN ('app','whatsapp')),active_job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_threads_user ON assistant_threads(user_id,updated_at DESC);
CREATE TABLE IF NOT EXISTS assistant_messages (id INTEGER PRIMARY KEY AUTOINCREMENT,thread_id INTEGER NOT NULL REFERENCES assistant_threads(id) ON DELETE CASCADE,role TEXT NOT NULL CHECK(role IN ('user','assistant','event')),body TEXT NOT NULL,metadata_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_assistant_messages_thread ON assistant_messages(thread_id,created_at ASC);
CREATE TABLE IF NOT EXISTS assistant_drafts (thread_id INTEGER PRIMARY KEY REFERENCES assistant_threads(id) ON DELETE CASCADE,combined_text TEXT NOT NULL,photo_path TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS service_catalog (slug TEXT PRIMARY KEY,title TEXT NOT NULL,category TEXT NOT NULL,keywords TEXT NOT NULL,estimate_min INTEGER NOT NULL,estimate_max INTEGER NOT NULL,requires_license INTEGER NOT NULL DEFAULT 0,active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS membership_plans (slug TEXT PRIMARY KEY,title TEXT NOT NULL,monthly_amount INTEGER NOT NULL,description TEXT NOT NULL,priority_level INTEGER NOT NULL DEFAULT 0,annual_house_check INTEGER NOT NULL DEFAULT 0,partner_discount_bps INTEGER NOT NULL DEFAULT 0,active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS subscriptions (id INTEGER PRIMARY KEY AUTOINCREMENT,homeowner_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,plan_slug TEXT NOT NULL REFERENCES membership_plans(slug),status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','past_due','cancelled')),stripe_subscription_id TEXT UNIQUE,current_period_end TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS service_packages (slug TEXT PRIMARY KEY,title TEXT NOT NULL,price_amount INTEGER NOT NULL,description TEXT NOT NULL,services_json TEXT NOT NULL DEFAULT '[]',active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS review_reports (id INTEGER PRIMARY KEY AUTOINCREMENT,review_id INTEGER NOT NULL UNIQUE REFERENCES reviews(id) ON DELETE CASCADE,reported_by INTEGER NOT NULL REFERENCES users(id),reason TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','actioned','dismissed')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,handled_at TEXT);
CREATE TABLE IF NOT EXISTS data_requests (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,kind TEXT NOT NULL CHECK(kind IN ('export','deletion')),status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('requested','completed','failed')),detail TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,completed_at TEXT);
CREATE INDEX IF NOT EXISTS idx_data_requests_user ON data_requests(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS feature_flags (key TEXT PRIMARY KEY,enabled INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_by TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS cwv_metrics (id INTEGER PRIMARY KEY AUTOINCREMENT,metric TEXT NOT NULL,value INTEGER NOT NULL,rating TEXT NOT NULL,path TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_cwv_metric ON cwv_metrics(metric,created_at DESC);
CREATE TABLE IF NOT EXISTS error_events (id INTEGER PRIMARY KEY AUTOINCREMENT,source TEXT NOT NULL DEFAULT 'client',error_class TEXT NOT NULL DEFAULT 'internal',digest TEXT NOT NULL DEFAULT '',message TEXT NOT NULL DEFAULT '',path TEXT NOT NULL DEFAULT '',correlation_id TEXT NOT NULL DEFAULT '',release TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_error_events_created ON error_events(created_at DESC);
CREATE TABLE IF NOT EXISTS pilot_cohort (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,discount_bps INTEGER NOT NULL DEFAULT 1500,joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS package_orders (id INTEGER PRIMARY KEY AUTOINCREMENT,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,package_slug TEXT NOT NULL REFERENCES service_packages(slug),status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','scheduled','completed','cancelled')),stripe_session_id TEXT UNIQUE,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS house_assets (id INTEGER PRIMARY KEY AUTOINCREMENT,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,kind TEXT NOT NULL,name TEXT NOT NULL,details TEXT NOT NULL DEFAULT '',installed_year INTEGER,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS maintenance_tasks (id INTEGER PRIMARY KEY AUTOINCREMENT,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,asset_id INTEGER REFERENCES house_assets(id) ON DELETE SET NULL,title TEXT NOT NULL,category TEXT NOT NULL,due_date TEXT NOT NULL,recurrence_months INTEGER,status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','completed','skipped')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_maintenance_user_due ON maintenance_tasks(homeowner_id,status,due_date);
CREATE TABLE IF NOT EXISTS provider_members (id INTEGER PRIMARY KEY AUTOINCREMENT,provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,job_title TEXT NOT NULL DEFAULT '',can_manage_jobs INTEGER NOT NULL DEFAULT 0,active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(provider_id,user_id)); CREATE INDEX IF NOT EXISTS idx_provider_members_company ON provider_members(provider_id,active,can_manage_jobs);
CREATE TABLE IF NOT EXISTS job_assignments (job_id INTEGER PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE,provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,contact_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,assigned_by_user_id INTEGER NOT NULL REFERENCES users(id),assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_job_assignments_contact ON job_assignments(contact_user_id,assigned_at DESC);
CREATE TABLE IF NOT EXISTS homeowner_contacts (homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,contact_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,category TEXT NOT NULL DEFAULT '',last_job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(homeowner_id,contact_user_id));
CREATE TABLE IF NOT EXISTS contact_messages (id INTEGER PRIMARY KEY AUTOINCREMENT,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,contact_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,body TEXT NOT NULL,read_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_contact_messages_thread ON contact_messages(homeowner_id,contact_user_id,created_at ASC);
CREATE TABLE IF NOT EXISTS partner_plans (slug TEXT PRIMARY KEY,title TEXT NOT NULL,monthly_amount INTEGER NOT NULL,description TEXT NOT NULL,monthly_lead_limit INTEGER,priority_level INTEGER NOT NULL DEFAULT 0,trial_days INTEGER NOT NULL DEFAULT 60,active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS partner_subscriptions (id INTEGER PRIMARY KEY AUTOINCREMENT,provider_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,plan_slug TEXT NOT NULL REFERENCES partner_plans(slug),status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','trialing','active','past_due','cancelled')),stripe_subscription_id TEXT UNIQUE,current_period_end TEXT,trial_end TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS provider_preferences (provider_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,accepts_normal_jobs INTEGER NOT NULL DEFAULT 1,accepts_short_notice INTEGER NOT NULL DEFAULT 1,accepts_consultation INTEGER NOT NULL DEFAULT 1,accepts_emergencies INTEGER NOT NULL DEFAULT 0,emergency_mode TEXT NOT NULL DEFAULT 'local' CHECK(emergency_mode IN ('local','24_7')),emergency_start TEXT NOT NULL DEFAULT '18:00',emergency_end TEXT NOT NULL DEFAULT '22:00',emergency_days TEXT NOT NULL DEFAULT '1,2,3,4,5,6,0',emergency_markup_bps INTEGER NOT NULL DEFAULT 0,opening_hours_text TEXT NOT NULL DEFAULT '',bookable_hours_text TEXT NOT NULL DEFAULT '',instant_booking INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS invoices (id INTEGER PRIMARY KEY AUTOINCREMENT,job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,invoice_number TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sent','paid','cancelled')),issue_date TEXT NOT NULL,service_date TEXT NOT NULL,due_date TEXT NOT NULL,currency TEXT NOT NULL DEFAULT 'eur',seller_name TEXT NOT NULL,seller_address TEXT NOT NULL DEFAULT '',seller_tax_id TEXT NOT NULL DEFAULT '',seller_vat_id TEXT NOT NULL DEFAULT '',seller_email TEXT NOT NULL DEFAULT '',seller_phone TEXT NOT NULL DEFAULT '',buyer_name TEXT NOT NULL,buyer_address TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',subtotal_net INTEGER NOT NULL DEFAULT 0,tax_amount INTEGER NOT NULL DEFAULT 0,total_gross INTEGER NOT NULL DEFAULT 0,created_by_user_id INTEGER NOT NULL REFERENCES users(id),sent_at TEXT,paid_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(provider_id,invoice_number)); CREATE INDEX IF NOT EXISTS idx_invoices_homeowner ON invoices(homeowner_id,status,created_at DESC); CREATE INDEX IF NOT EXISTS idx_invoices_provider ON invoices(provider_id,status,created_at DESC);
CREATE TABLE IF NOT EXISTS invoice_items (id INTEGER PRIMARY KEY AUTOINCREMENT,invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,position INTEGER NOT NULL,description TEXT NOT NULL,quantity REAL NOT NULL DEFAULT 1,unit TEXT NOT NULL DEFAULT 'Stk.',unit_price_net INTEGER NOT NULL,tax_rate_bps INTEGER NOT NULL DEFAULT 1900,line_net INTEGER NOT NULL,line_tax INTEGER NOT NULL,line_gross INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id,position);
CREATE TABLE IF NOT EXISTS house_history_entries (id INTEGER PRIMARY KEY AUTOINCREMENT,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,category TEXT NOT NULL,title TEXT NOT NULL,performed_at TEXT NOT NULL,company_name TEXT NOT NULL DEFAULT '',provider_id INTEGER REFERENCES users(id) ON DELETE SET NULL,contact_name TEXT NOT NULL DEFAULT '',contact_phone TEXT NOT NULL DEFAULT '',contact_email TEXT NOT NULL DEFAULT '',cost_amount INTEGER,guarantee_until TEXT,maintenance_due TEXT,notes TEXT NOT NULL DEFAULT '',before_photo TEXT,after_photo TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_house_history_owner_date ON house_history_entries(homeowner_id,performed_at DESC);
CREATE TABLE IF NOT EXISTS house_history_documents (id INTEGER PRIMARY KEY AUTOINCREMENT,entry_id INTEGER NOT NULL REFERENCES house_history_entries(id) ON DELETE CASCADE,title TEXT NOT NULL,path TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS house_contracts (id INTEGER PRIMARY KEY AUTOINCREMENT,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,kind TEXT NOT NULL DEFAULT 'sonstiges',provider TEXT NOT NULL,tariff TEXT NOT NULL DEFAULT '',contract_number TEXT NOT NULL DEFAULT '',cost_amount INTEGER,cost_interval TEXT NOT NULL DEFAULT 'month' CHECK(cost_interval IN ('month','quarter','halfyear','year')),started_at TEXT,term_months INTEGER,renewal_months INTEGER NOT NULL DEFAULT 12,cancellation_days INTEGER NOT NULL DEFAULT 30,cancellation_deadline TEXT,notice TEXT NOT NULL DEFAULT '',document_title TEXT NOT NULL DEFAULT '',document_path TEXT,status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','cancelled','expired')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_house_contracts_owner ON house_contracts(homeowner_id,status,created_at DESC);
CREATE TABLE IF NOT EXISTS provider_invites (id INTEGER PRIMARY KEY AUTOINCREMENT,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,email TEXT NOT NULL COLLATE NOCASE,company_name TEXT NOT NULL DEFAULT '',category TEXT NOT NULL DEFAULT '',token TEXT NOT NULL UNIQUE,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','linked','cancelled')),linked_provider_id INTEGER REFERENCES users(id) ON DELETE SET NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,linked_at TEXT); CREATE INDEX IF NOT EXISTS idx_provider_invites_email ON provider_invites(email,status);
CREATE TABLE IF NOT EXISTS house_transfers (id INTEGER PRIMARY KEY AUTOINCREMENT,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,target_email TEXT NOT NULL COLLATE NOCASE,token TEXT NOT NULL UNIQUE,status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','accepted','revoked')),accepted_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,accepted_at TEXT);
CREATE TABLE IF NOT EXISTS properties (id INTEGER PRIMARY KEY AUTOINCREMENT,address TEXT NOT NULL DEFAULT '',postcode TEXT NOT NULL DEFAULT '',lat REAL,lon REAL,property_type TEXT NOT NULL DEFAULT '',build_year INTEGER,living_area REAL,plot_area REAL,estimated_value_min INTEGER,estimated_value_max INTEGER,use_type TEXT NOT NULL DEFAULT 'residential' CHECK(use_type IN ('residential','commercial','mixed')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS property_ownerships (id INTEGER PRIMARY KEY AUTOINCREMENT,property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,ended_at TEXT,active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_property_ownerships_owner ON property_ownerships(homeowner_id,active,started_at DESC); CREATE INDEX IF NOT EXISTS idx_property_ownerships_property ON property_ownerships(property_id,active,started_at DESC);
CREATE TABLE IF NOT EXISTS provider_categories (slug TEXT PRIMARY KEY,title TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS provider_category_assignments (provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,category_slug TEXT NOT NULL REFERENCES provider_categories(slug) ON DELETE CASCADE,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(provider_id,category_slug)); CREATE INDEX IF NOT EXISTS idx_provider_category_provider ON provider_category_assignments(provider_id);
CREATE TABLE IF NOT EXISTS provider_service_offerings (provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,service_slug TEXT NOT NULL REFERENCES service_catalog(slug) ON DELETE CASCADE,active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(provider_id,service_slug));
CREATE TABLE IF NOT EXISTS broker_search_profiles (provider_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,regions_text TEXT NOT NULL DEFAULT '',property_types_text TEXT NOT NULL DEFAULT '',min_price INTEGER,max_price INTEGER,min_living_area REAL,max_living_area REAL,min_plot_area REAL,max_plot_area REAL,residential INTEGER NOT NULL DEFAULT 1,commercial INTEGER NOT NULL DEFAULT 0,specialties TEXT NOT NULL DEFAULT '',updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS property_shares (id INTEGER PRIMARY KEY AUTOINCREMENT,property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,purpose TEXT NOT NULL,permissions_json TEXT NOT NULL DEFAULT '[]',status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked')),granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,revoked_at TEXT); CREATE INDEX IF NOT EXISTS idx_property_shares_provider ON property_shares(provider_id,status,granted_at DESC);
CREATE TABLE IF NOT EXISTS property_valuations (id INTEGER PRIMARY KEY AUTOINCREMENT,property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','completed','cancelled')),valuation_type TEXT NOT NULL DEFAULT 'orientation',estimated_min INTEGER,estimated_max INTEGER,notes TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,completed_at TEXT); CREATE INDEX IF NOT EXISTS idx_valuations_property ON property_valuations(property_id,created_at DESC);
CREATE TABLE IF NOT EXISTS sale_leads (id INTEGER PRIMARY KEY AUTOINCREMENT,property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,status TEXT NOT NULL DEFAULT 'interested' CHECK(status IN ('interested','matched','contact_released','inspection','mandate','sold','cancelled')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_sale_leads_property ON sale_leads(property_id,status,created_at DESC);
CREATE TABLE IF NOT EXISTS broker_lead_matches (id INTEGER PRIMARY KEY AUTOINCREMENT,sale_lead_id INTEGER NOT NULL REFERENCES sale_leads(id) ON DELETE CASCADE,provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,match_score REAL NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'suggested' CHECK(status IN ('suggested','contact_released','interested','rejected','inspection','mandate','sold','revoked')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(sale_lead_id,provider_id)); CREATE INDEX IF NOT EXISTS idx_broker_matches_provider ON broker_lead_matches(provider_id,status,created_at DESC);
CREATE TABLE IF NOT EXISTS auth_rate_limits (kind TEXT NOT NULL,identifier TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,window_start_at TEXT NOT NULL,blocked_until TEXT,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(kind,identifier));
CREATE TABLE IF NOT EXISTS admin_audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT,actor TEXT NOT NULL,action TEXT NOT NULL,target TEXT NOT NULL DEFAULT '',detail TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at DESC);
CREATE TABLE IF NOT EXISTS security_events (id INTEGER PRIMARY KEY AUTOINCREMENT,kind TEXT NOT NULL,identifier TEXT NOT NULL DEFAULT '',detail TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at DESC);
CREATE TABLE IF NOT EXISTS webhook_events (source TEXT NOT NULL CHECK(source IN ('whatsapp','stripe')),event_id TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('processing','processed')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,processed_at TEXT,PRIMARY KEY(source,event_id)); CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events(created_at DESC);
`));

const seed=db.transaction(()=>{
  const service=db.prepare('INSERT OR IGNORE INTO service_catalog(slug,title,category,keywords,estimate_min,estimate_max,requires_license) VALUES(?,?,?,?,?,?,?)');
  [
    ['heckenschnitt','Heckenschnitt','Garten & Außenbereich','hecke,heckenschnitt,schneiden',12000,17000,0],
    ['rasenpflege','Rasenpflege','Garten & Außenbereich','rasen,mähen,rasenpflege',7000,14000,0],
    ['terrassenreinigung','Terrassenreinigung','Garten & Außenbereich','terrasse,hochdruck,reinigung',9000,18000,0],
    ['grundreinigung','Grundreinigung','Reinigung','reinigung,putzen,grundreinigung',9000,22000,0],
    ['fensterreinigung','Fensterreinigung','Reinigung','fenster,fensterreinigung,glas,putzen',7000,18000,0],
    ['elektro','Elektroarbeiten','Elektro','elektrik,strom,steckdose,sicherung,lampe',12000,28000,1],
    ['sanitaer','Sanitär & Heizung','Sanitär & Heizung','wasser,abfluss,wc,toilette,heizung,therme,wärmepumpe',14000,32000,1],
    ['montage','Montage & Reparatur','Montage & Reparatur','montage,reparatur,tür,schloss,möbel,regal',8000,22000,0],
    ['dach','Dach & Fassade','Dach & Fassade','dach,dachrinne,rinne,fassade,ziegel',14000,35000,1],
    ['maler','Maler & Ausbau','Maler & Ausbau','maler,streichen,tapete,wand,decke,trockenbau',12000,30000,0],
    ['umzug','Umzug & Transport','Umzug & Transport','umzug,transport,tragen,möbeltransport,entrümpelung',15000,45000,0],
    ['energie','Energie & Smart Home','Energie & Smart Home','pv,photovoltaik,speicher,wallbox,smart home,energie',12000,30000,1],
    ['sonstiges','Hausservice','Hausmeister & Sonstiges','haus,hilfe,sonstiges',8000,22000,0]
  ].forEach((x:any)=>service.run(...x));
  const plan=db.prepare(`INSERT INTO membership_plans(slug,title,monthly_amount,description,priority_level,annual_house_check,partner_discount_bps,active) VALUES(?,?,?,?,?,?,?,?)
    ON CONFLICT(slug) DO UPDATE SET title=excluded.title,monthly_amount=excluded.monthly_amount,description=excluded.description,priority_level=excluded.priority_level,annual_house_check=excluded.annual_house_check,partner_discount_bps=excluded.partner_discount_bps,active=excluded.active`);
  plan.run('free','Free',0,'Hausmeisterservice, Aufträge, Angebote, persönliche Ansprechpartner und digitale Hausakte.',0,0,0,1);
  plan.run('plus','Plus',1990,'Automatische Wartungsplanung, Hausjahresplan, Erinnerungen, Dokumentenverwaltung, bevorzugte Vermittlung und Prioritätsservice.',2,0,0,1);
  plan.run('premium','Premium',3990,'Persönliche Betreuung, höchste Priorität, jährlicher Hauscheck, automatische Wartungsorganisation, Premium-Partner und erweiterte Hausverwaltung.',3,1,0,1);
  db.prepare("UPDATE membership_plans SET active=0 WHERE slug='basic'").run();
  const partnerPlan=db.prepare(`INSERT INTO partner_plans(slug,title,monthly_amount,description,monthly_lead_limit,priority_level,trial_days,active) VALUES(?,?,?,?,?,?,?,1)
    ON CONFLICT(slug) DO UPDATE SET title=excluded.title,monthly_amount=excluded.monthly_amount,description=excluded.description,monthly_lead_limit=excluded.monthly_lead_limit,priority_level=excluded.priority_level,trial_days=excluded.trial_days,active=excluded.active`);
  partnerPlan.run('free','Free',0,'Kostenlos starten, 0 % Provision und eine begrenzte Zahl neuer Anfragen.',5,0,0);
  partnerPlan.run('start','Start',2900,'Mehr Anfragevolumen und einfache Partnerfunktionen für kleine Betriebe. 0 % Provision und keine Gebühr pro Auftrag.',50,0,60);
  partnerPlan.run('pro','Pro',7900,'Für aktive Partner mit höherem Anfragevolumen, erweiterten Betriebsfunktionen und 0 % Provision. Das Qualitätsmatching bleibt tarifneutral.',null,0,60);
  partnerPlan.run('premium','Premium',19900,'Für stark ausgelastete Partner mit erweitertem Support und Auswertungen bei 0 % Provision. Das Qualitätsmatching bleibt tarifneutral.',null,0,60);
  const pkg=db.prepare('INSERT OR IGNORE INTO service_packages(slug,title,price_amount,description,services_json) VALUES(?,?,?,?,?)');
  pkg.run('haus-jahrespflege','Haus Jahrespflege',29900,'Ein strukturierter jährlicher Haus-Check mit Planung typischer Wartungs- und Werterhaltsthemen.',JSON.stringify(['Haus-Check','Dachrinne','Fenster/Türen','Haustechnik','Wartungsplan']));
  pkg.run('garten-premium','Garten Premium Jahr',49900,'Saisonale Gartenplanung mit wiederkehrenden Pflegepunkten und priorisierter Partnerorganisation.',JSON.stringify(['Frühjahrscheck','Rasenpflege','Heckenplanung','Herbstcheck','Saisonplan']));
  pkg.run('energie-technik','Energie & Technik Check',24900,'Jährlicher Organisations-Check für PV, Speicher, Wallbox, Heizung/Wärmepumpe und relevante Haustechnik.',JSON.stringify(['PV','Speicher','Wallbox','Heizung/Wärmepumpe','Smart Home']));
  const providerCategory=db.prepare(`INSERT INTO provider_categories(slug,title,description,active) VALUES(?,?,?,1)
    ON CONFLICT(slug) DO UPDATE SET title=excluded.title,description=excluded.description,active=excluded.active`);
  providerCategory.run('handwerk','Handwerker','Handwerkliche Leistungen rund um Gebäude, Technik und Außenbereich.');
  providerCategory.run('dienstleistung','Dienstleister','Hausnahe Dienstleistungen wie Reinigung, Pflege, Umzug oder Hausservice.');
  providerCategory.run('makler','Immobilienmakler','Vermarktung, Verkauf und Käufer-/Verkäuferberatung.');
  providerCategory.run('gutachter','Gutachter / Sachverständiger','Bewertungen, Gutachten und technische Sachkunde.');
  providerCategory.run('energieberatung','Energieberatung','Energieeffizienz, Förderberatung und technische Planung.');
  providerCategory.run('hausverwaltung','Hausverwaltung','Verwaltung und organisatorische Betreuung von Immobilien.');
}); execWithRetry(() => seed());

// Safe additive migrations for databases created by earlier versions. Next.js can
// evaluate this module in parallel build workers, so tolerate the tiny race where
// another worker adds a column after our PRAGMA check.
function addColumnIfMissing(table:string,column:string,definition:string){
  const columns=db.prepare(`PRAGMA table_info(${table})`).all() as Array<{name:string}>;
  if(columns.some(c=>c.name===column)) return;
  try{ db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`); }
  catch(error){
    if(!(error instanceof Error) || !error.message.toLowerCase().includes('duplicate column name')) throw error;
  }
}
addColumnIfMissing('provider_profiles','stripe_account_id','stripe_account_id TEXT');
addColumnIfMissing('feature_flags','rollout_percent','rollout_percent INTEGER');
addColumnIfMissing('reviews','hidden','hidden INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('provider_profiles','stripe_onboarded','stripe_onboarded INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('homeowner_profiles','lat','lat REAL');
addColumnIfMissing('homeowner_profiles','lon','lon REAL');
addColumnIfMissing('provider_profiles','lat','lat REAL');
addColumnIfMissing('provider_profiles','lon','lon REAL');
addColumnIfMissing('jobs','lat','lat REAL');
addColumnIfMissing('jobs','lon','lon REAL');
addColumnIfMissing('jobs','service_slug','service_slug TEXT');
addColumnIfMissing('jobs','source_channel',"source_channel TEXT NOT NULL DEFAULT 'app'");
addColumnIfMissing('jobs','request_kind',"request_kind TEXT NOT NULL DEFAULT 'service'");
addColumnIfMissing('assistant_drafts','intent',"intent TEXT NOT NULL DEFAULT 'service'");
addColumnIfMissing('quotes','submitted_by_user_id','submitted_by_user_id INTEGER REFERENCES users(id)');
addColumnIfMissing('appointments','contact_user_id','contact_user_id INTEGER REFERENCES users(id)');
addColumnIfMissing('homeowner_profiles','house_type',"house_type TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('homeowner_profiles','build_year','build_year INTEGER');
addColumnIfMissing('homeowner_profiles','living_area','living_area REAL');
addColumnIfMissing('homeowner_profiles','plot_area','plot_area REAL');
addColumnIfMissing('provider_profiles','logo_path','logo_path TEXT');
addColumnIfMissing('provider_profiles','street_address',"street_address TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('provider_profiles','legal_form',"legal_form TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('provider_profiles','founded_year','founded_year INTEGER');
addColumnIfMissing('provider_profiles','employees',"employees TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('provider_profiles','website',"website TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('provider_profiles','master_company','master_company INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('provider_profiles','wizard_step',"wizard_step TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('provider_profiles','tax_id',"tax_id TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('provider_profiles','vat_id',"vat_id TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('provider_preferences','emergency_days',"emergency_days TEXT NOT NULL DEFAULT '1,2,3,4,5,6,0'");
// Weekly job capacity cap (EH T-0102 partner onboarding); NULL = no explicit cap set.
addColumnIfMissing('provider_preferences','weekly_capacity','weekly_capacity INTEGER');
addColumnIfMissing('jobs','urgency',"urgency TEXT NOT NULL DEFAULT 'normal'");
addColumnIfMissing('jobs','emergency_type','emergency_type TEXT');
addColumnIfMissing('payments','invoice_id','invoice_id INTEGER REFERENCES invoices(id)');
addColumnIfMissing('jobs','property_id','property_id INTEGER REFERENCES properties(id)');
addColumnIfMissing('house_assets','property_id','property_id INTEGER REFERENCES properties(id)');
addColumnIfMissing('maintenance_tasks','property_id','property_id INTEGER REFERENCES properties(id)');
addColumnIfMissing('house_history_entries','property_id','property_id INTEGER REFERENCES properties(id)');
addColumnIfMissing('house_history_entries','job_id','job_id INTEGER REFERENCES jobs(id)');
addColumnIfMissing('homeowner_contacts','property_id','property_id INTEGER REFERENCES properties(id)');
addColumnIfMissing('provider_invites','property_id','property_id INTEGER REFERENCES properties(id)');
addColumnIfMissing('house_transfers','property_id','property_id INTEGER REFERENCES properties(id)');
addColumnIfMissing('users','auth_subject','auth_subject TEXT');
execWithRetry(() => db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_subject ON users(auth_subject) WHERE auth_subject IS NOT NULL'));
addColumnIfMissing('sessions','issued_at','issued_at TEXT');
addColumnIfMissing('admin_sessions','issued_at','issued_at TEXT');
// First-run onboarding state for homeowners (EH T-0101). 'done' keeps every
// Post-job review eligibility + verified data model (EH T-0110).
addColumnIfMissing('reviews','verified','verified INTEGER NOT NULL DEFAULT 1');
addColumnIfMissing('reviews','eligibility_reason','eligibility_reason TEXT');
/* Explainable matching (EH T-0107): per-dispatch decision trace.*/
db.exec(`CREATE TABLE IF NOT EXISTS match_decision_trace (id INTEGER PRIMARY KEY AUTOINCREMENT,job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,decision TEXT NOT NULL CHECK(decision IN ('dispatched','excluded')),reason_key TEXT NOT NULL,detail TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_match_trace_job ON match_decision_trace(job_id,created_at DESC)`);
addColumnIfMissing('job_dispatches','reasons_json','reasons_json TEXT');
// Durable notification outbox (EH T-0104): domain events plus per-message
// channel/priority/status/retry state. Historical rows count as delivered.
db.exec(`CREATE TABLE IF NOT EXISTS notification_events (id INTEGER PRIMARY KEY AUTOINCREMENT,event_type TEXT NOT NULL,payload_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,processed_at TEXT)`);
// Per-attempt delivery receipts make every outbox attempt auditable (EH T-0106).
db.exec(`CREATE TABLE IF NOT EXISTS notification_receipts (id INTEGER PRIMARY KEY AUTOINCREMENT,notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,channel TEXT NOT NULL,state TEXT NOT NULL CHECK(state IN ('sent','failed','dead')),detail TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_notification_receipts_msg ON notification_receipts(notification_id,created_at DESC)`);
addColumnIfMissing('notifications','channel',"channel TEXT NOT NULL DEFAULT 'in_app'");
addColumnIfMissing('notifications','priority','priority INTEGER NOT NULL DEFAULT 5');
addColumnIfMissing('notifications','status',"status TEXT NOT NULL DEFAULT 'sent'");
addColumnIfMissing('notifications','retry_count','retry_count INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('notifications','next_retry_at','next_retry_at TEXT');
addColumnIfMissing('notifications','event_id','event_id INTEGER REFERENCES notification_events(id)');
// pre-existing account unaffected; fresh registrations start at 'profile'.
addColumnIfMissing('homeowner_profiles','onboarding_step',"onboarding_step TEXT NOT NULL DEFAULT 'done'");
addColumnIfMissing('homeowner_profiles','interests',"interests TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('homeowner_profiles','preferred_channel',"preferred_channel TEXT NOT NULL DEFAULT ''");

// One-time security migration: sessions predating issued_at have unknown
// provenance and cannot satisfy the single-live-session invariant, so they are
// invalidated exactly once. Rows created after this migration always carry a
// non-null issued_at and are preserved.
execWithRetry(() => db.transaction(() => {
  db.prepare('DELETE FROM sessions WHERE issued_at IS NULL').run();
  // Keep only the newest session row per user, then enforce the invariant in SQL.
  db.prepare(`DELETE FROM sessions WHERE rowid NOT IN (
    SELECT MAX(rowid) FROM sessions GROUP BY user_id )`).run();
  db.prepare('DELETE FROM admin_sessions WHERE issued_at IS NULL').run();
  db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_user_live ON sessions(user_id)').run();
  // Expression unique index: at most one admin session row may exist at all.
  db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_sessions_single ON admin_sessions((1))').run();
})());

execWithRetry(() => db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at); CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry ON admin_sessions(expires_at);`));

// Product model migration: one company can have many simple app contacts; no per-job platform commission.
db.prepare('UPDATE partner_contracts SET commission_bps=0 WHERE commission_bps!=0').run();
db.prepare(`INSERT OR IGNORE INTO provider_members(provider_id,user_id,job_title,can_manage_jobs,active)
  SELECT user_id,user_id,'Geschäftsführung',1,1 FROM provider_profiles`).run();
db.prepare(`INSERT OR IGNORE INTO provider_preferences(provider_id) SELECT user_id FROM provider_profiles`).run();

// Flexible provider categories: existing partner accounts default to Handwerker until changed in the profile.
db.prepare(`INSERT OR IGNORE INTO provider_category_assignments(provider_id,category_slug) SELECT user_id,'handwerk' FROM provider_profiles`).run();

// Every existing owner gets one persistent property record. New code attaches house data to this property,
// while legacy homeowner_id columns remain for backwards compatibility during the pilot migration.
const legacyOwners=db.prepare(`SELECT h.* FROM homeowner_profiles h JOIN users u ON u.id=h.user_id WHERE u.role='homeowner'`).all() as any[];
for(const h of legacyOwners){
  let ownership=db.prepare(`SELECT o.property_id FROM property_ownerships o WHERE o.homeowner_id=? AND o.active=1 ORDER BY o.started_at DESC,o.id DESC LIMIT 1`).get(h.user_id) as {property_id:number}|undefined;
  if(!ownership){
    const result=db.prepare(`INSERT INTO properties(address,postcode,lat,lon,property_type,build_year,living_area,plot_area) VALUES(?,?,?,?,?,?,?,?)`).run(h.address||'',h.postcode||'',h.lat??null,h.lon??null,h.house_type||'',h.build_year??null,h.living_area??null,h.plot_area??null);
    const propertyId=Number(result.lastInsertRowid);
    db.prepare(`INSERT INTO property_ownerships(property_id,homeowner_id,active) VALUES(?,?,1)`).run(propertyId,h.user_id);
    ownership={property_id:propertyId};
  }
  const propertyId=ownership.property_id;
  db.prepare(`UPDATE jobs SET property_id=COALESCE(property_id,?) WHERE homeowner_id=?`).run(propertyId,h.user_id);
  db.prepare(`UPDATE house_assets SET property_id=COALESCE(property_id,?) WHERE homeowner_id=?`).run(propertyId,h.user_id);
  db.prepare(`UPDATE maintenance_tasks SET property_id=COALESCE(property_id,?) WHERE homeowner_id=?`).run(propertyId,h.user_id);
  db.prepare(`UPDATE house_history_entries SET property_id=COALESCE(property_id,?) WHERE homeowner_id=?`).run(propertyId,h.user_id);
  db.prepare(`UPDATE homeowner_contacts SET property_id=COALESCE(property_id,?) WHERE homeowner_id=?`).run(propertyId,h.user_id);
  db.prepare(`UPDATE provider_invites SET property_id=COALESCE(property_id,?) WHERE homeowner_id=?`).run(propertyId,h.user_id);
  db.prepare(`UPDATE house_transfers SET property_id=COALESCE(property_id,?) WHERE homeowner_id=?`).run(propertyId,h.user_id);
}

// ============ AI 3-stage cost architecture (EH T-0207) ============
db.exec(`CREATE TABLE IF NOT EXISTS user_settings (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,ai_byok_enabled INTEGER NOT NULL DEFAULT 0,ai_byok_provider TEXT NOT NULL DEFAULT '',updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
// ai_usage: per-user monthly freemium consumption of cloud AI actions.
// ai_credits: granted bonus actions (rewarded ads / purchases), consumed
// after the monthly allowance. mode: 'freemium' | 'ad' | 'purchase'.
db.exec(`CREATE TABLE IF NOT EXISTS ai_usage (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,period TEXT NOT NULL,action TEXT NOT NULL DEFAULT 'chat',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_ai_usage_user_period ON ai_usage(user_id,period,created_at DESC)`);
db.exec(`CREATE TABLE IF NOT EXISTS ai_credits (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,granted INTEGER NOT NULL,mode TEXT NOT NULL CHECK(mode IN ('ad','purchase','manual')),source TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_ai_credits_user ON ai_credits(user_id,created_at DESC)`);
addColumnIfMissing('ai_usage','credit_id','credit_id INTEGER REFERENCES ai_credits(id)');
addColumnIfMissing('user_settings','ai_byok_key_enc','ai_byok_key_enc TEXT');
addColumnIfMissing('user_settings','ai_byok_base_url',"ai_byok_base_url TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('user_settings','ai_byok_model',"ai_byok_model TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('user_settings','automation_prefs',"automation_prefs TEXT NOT NULL DEFAULT '{}'");

// Non-destructive address-book registry and legacy contact mirror.
execWithRetry(() => initializeContactDirectory(db));
addColumnIfMissing('homeowner_contact_entries','is_pinned','is_pinned INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('homeowner_contact_entries','is_emergency','is_emergency INTEGER NOT NULL DEFAULT 0');
