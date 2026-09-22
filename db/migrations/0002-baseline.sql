-- Einfach Hausen SQLite-Baseline (generiert aus src/lib/db.ts, 2026-09-22).
-- Quelle bleibt src/lib/db.ts; diese Datei ist Review-/Diff-Material (siehe docs/DB_MIGRATIONS.md).
-- Tabellen: 77, Indizes: 48, addColumnIfMissing: 0

CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT NOT NULL UNIQUE COLLATE NOCASE,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('homeowner','provider')),first_name TEXT NOT NULL,last_name TEXT NOT NULL,phone TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,auth_subject TEXT UNIQUE);

CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS homeowner_profiles (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,postcode TEXT NOT NULL DEFAULT '',address TEXT NOT NULL DEFAULT '');

CREATE TABLE IF NOT EXISTS provider_profiles (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,business_name TEXT NOT NULL,trades TEXT NOT NULL DEFAULT '',postcode TEXT NOT NULL DEFAULT '',radius_km INTEGER NOT NULL DEFAULT 25,verified INTEGER NOT NULL DEFAULT 0,rating REAL NOT NULL DEFAULT 0,rating_count INTEGER NOT NULL DEFAULT 0,description TEXT NOT NULL DEFAULT '',stripe_account_id TEXT,stripe_onboarded INTEGER NOT NULL DEFAULT 0);

CREATE TABLE IF NOT EXISTS jobs (id INTEGER PRIMARY KEY AUTOINCREMENT,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,title TEXT NOT NULL,description TEXT NOT NULL,category TEXT NOT NULL,postcode TEXT NOT NULL,preferred_date TEXT,preferred_time TEXT,budget_min INTEGER,budget_max INTEGER,status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','quoted','accepted','in_progress','completed','cancelled')),accepted_quote_id INTEGER,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS job_photos (id INTEGER PRIMARY KEY AUTOINCREMENT,job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,path TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS quotes (id INTEGER PRIMARY KEY AUTOINCREMENT,job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,amount INTEGER NOT NULL,available_at TEXT,message TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected','withdrawn')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(job_id,provider_id));

CREATE TABLE IF NOT EXISTS appointments (id INTEGER PRIMARY KEY AUTOINCREMENT,job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,provider_id INTEGER NOT NULL REFERENCES users(id),homeowner_id INTEGER NOT NULL REFERENCES users(id),start_at TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','completed','cancelled')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT,job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,sender_id INTEGER NOT NULL REFERENCES users(id),recipient_id INTEGER NOT NULL REFERENCES users(id),body TEXT NOT NULL,read_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT,job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,homeowner_id INTEGER NOT NULL REFERENCES users(id),provider_id INTEGER NOT NULL REFERENCES users(id),amount INTEGER NOT NULL,currency TEXT NOT NULL DEFAULT 'eur',status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','failed','refunded')),stripe_session_id TEXT UNIQUE,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,paid_at TEXT);

CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT,job_id INTEGER NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,homeowner_id INTEGER NOT NULL REFERENCES users(id),provider_id INTEGER NOT NULL REFERENCES users(id),rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),comment TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS documents (id INTEGER PRIMARY KEY AUTOINCREMENT,job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,provider_id INTEGER REFERENCES users(id),kind TEXT NOT NULL CHECK(kind IN ('invoice','offer','report','warranty','other')),title TEXT NOT NULL,path TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS verification_requests (id INTEGER PRIMARY KEY AUTOINCREMENT,provider_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,document_path TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),provider_note TEXT NOT NULL DEFAULT '',admin_note TEXT NOT NULL DEFAULT '',submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,reviewed_at TEXT);

CREATE TABLE IF NOT EXISTS claims (id INTEGER PRIMARY KEY AUTOINCREMENT,job_id INTEGER NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,homeowner_id INTEGER NOT NULL REFERENCES users(id),provider_id INTEGER NOT NULL REFERENCES users(id),description TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','reviewing','resolved','rejected')),admin_note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS admin_sessions (token TEXT PRIMARY KEY,expires_at TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,kind TEXT NOT NULL DEFAULT 'info',title TEXT NOT NULL,body TEXT NOT NULL DEFAULT '',href TEXT NOT NULL DEFAULT '',read_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS postcode_geo (postcode TEXT PRIMARY KEY,lat REAL NOT NULL,lon REAL NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS partner_contracts (provider_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','suspended','ended')),commission_bps INTEGER NOT NULL DEFAULT 0,customer_discount_bps INTEGER NOT NULL DEFAULT 0,insurance_verified INTEGER NOT NULL DEFAULT 0,qualification_verified INTEGER NOT NULL DEFAULT 0,contract_verified INTEGER NOT NULL DEFAULT 0,quality_standard_verified INTEGER NOT NULL DEFAULT 0,response_target_minutes INTEGER NOT NULL DEFAULT 30,starts_at TEXT,ends_at TEXT,notes TEXT NOT NULL DEFAULT '',updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS job_dispatches (id INTEGER PRIMARY KEY AUTOINCREMENT,job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,status TEXT NOT NULL DEFAULT 'sent' CHECK(status IN ('sent','viewed','declined','quoted','accepted','closed','expired')),match_score REAL NOT NULL DEFAULT 0,distance_km REAL,sent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,responded_at TEXT,UNIQUE(job_id,provider_id));

CREATE TABLE IF NOT EXISTS assistant_threads (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,channel TEXT NOT NULL DEFAULT 'app' CHECK(channel IN ('app','whatsapp')),active_job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS assistant_messages (id INTEGER PRIMARY KEY AUTOINCREMENT,thread_id INTEGER NOT NULL REFERENCES assistant_threads(id) ON DELETE CASCADE,role TEXT NOT NULL CHECK(role IN ('user','assistant','event')),body TEXT NOT NULL,metadata_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS assistant_drafts (thread_id INTEGER PRIMARY KEY REFERENCES assistant_threads(id) ON DELETE CASCADE,combined_text TEXT NOT NULL,photo_path TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS service_catalog (slug TEXT PRIMARY KEY,title TEXT NOT NULL,category TEXT NOT NULL,keywords TEXT NOT NULL,estimate_min INTEGER NOT NULL,estimate_max INTEGER NOT NULL,requires_license INTEGER NOT NULL DEFAULT 0,active INTEGER NOT NULL DEFAULT 1);

CREATE TABLE IF NOT EXISTS membership_plans (slug TEXT PRIMARY KEY,title TEXT NOT NULL,monthly_amount INTEGER NOT NULL,description TEXT NOT NULL,priority_level INTEGER NOT NULL DEFAULT 0,annual_house_check INTEGER NOT NULL DEFAULT 0,partner_discount_bps INTEGER NOT NULL DEFAULT 0,active INTEGER NOT NULL DEFAULT 1);

CREATE TABLE IF NOT EXISTS subscriptions (id INTEGER PRIMARY KEY AUTOINCREMENT,homeowner_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,plan_slug TEXT NOT NULL REFERENCES membership_plans(slug),status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','past_due','cancelled')),stripe_subscription_id TEXT UNIQUE,current_period_end TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS service_packages (slug TEXT PRIMARY KEY,title TEXT NOT NULL,price_amount INTEGER NOT NULL,description TEXT NOT NULL,services_json TEXT NOT NULL DEFAULT '[]',active INTEGER NOT NULL DEFAULT 1);

CREATE TABLE IF NOT EXISTS review_reports (id INTEGER PRIMARY KEY AUTOINCREMENT,review_id INTEGER NOT NULL UNIQUE REFERENCES reviews(id) ON DELETE CASCADE,reported_by INTEGER NOT NULL REFERENCES users(id),reason TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','actioned','dismissed')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,handled_at TEXT);

CREATE TABLE IF NOT EXISTS data_requests (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,kind TEXT NOT NULL CHECK(kind IN ('export','deletion')),status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('requested','completed','failed')),detail TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,completed_at TEXT);

CREATE TABLE IF NOT EXISTS feature_flags (key TEXT PRIMARY KEY,enabled INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_by TEXT NOT NULL DEFAULT '');

CREATE TABLE IF NOT EXISTS cwv_metrics (id INTEGER PRIMARY KEY AUTOINCREMENT,metric TEXT NOT NULL,value INTEGER NOT NULL,rating TEXT NOT NULL,path TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS error_events (id INTEGER PRIMARY KEY AUTOINCREMENT,source TEXT NOT NULL DEFAULT 'client',error_class TEXT NOT NULL DEFAULT 'internal',digest TEXT NOT NULL DEFAULT '',message TEXT NOT NULL DEFAULT '',path TEXT NOT NULL DEFAULT '',correlation_id TEXT NOT NULL DEFAULT '',release TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS pilot_cohort (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,discount_bps INTEGER NOT NULL DEFAULT 1500,joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS package_orders (id INTEGER PRIMARY KEY AUTOINCREMENT,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,package_slug TEXT NOT NULL REFERENCES service_packages(slug),status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','scheduled','completed','cancelled')),stripe_session_id TEXT UNIQUE,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS house_assets (id INTEGER PRIMARY KEY AUTOINCREMENT,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,kind TEXT NOT NULL,name TEXT NOT NULL,details TEXT NOT NULL DEFAULT '',installed_year INTEGER,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS maintenance_tasks (id INTEGER PRIMARY KEY AUTOINCREMENT,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,asset_id INTEGER REFERENCES house_assets(id) ON DELETE SET NULL,title TEXT NOT NULL,category TEXT NOT NULL,due_date TEXT NOT NULL,recurrence_months INTEGER,status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','completed','skipped')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS provider_members (id INTEGER PRIMARY KEY AUTOINCREMENT,provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,job_title TEXT NOT NULL DEFAULT '',can_manage_jobs INTEGER NOT NULL DEFAULT 0,active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(provider_id,user_id));

CREATE TABLE IF NOT EXISTS job_assignments (job_id INTEGER PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE,provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,contact_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,assigned_by_user_id INTEGER NOT NULL REFERENCES users(id),assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS homeowner_contacts (homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,contact_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,category TEXT NOT NULL DEFAULT '',last_job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(homeowner_id,contact_user_id));

CREATE TABLE IF NOT EXISTS contact_messages (id INTEGER PRIMARY KEY AUTOINCREMENT,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,contact_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,body TEXT NOT NULL,read_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS partner_plans (slug TEXT PRIMARY KEY,title TEXT NOT NULL,monthly_amount INTEGER NOT NULL,description TEXT NOT NULL,monthly_lead_limit INTEGER,priority_level INTEGER NOT NULL DEFAULT 0,trial_days INTEGER NOT NULL DEFAULT 60,active INTEGER NOT NULL DEFAULT 1);

CREATE TABLE IF NOT EXISTS partner_subscriptions (id INTEGER PRIMARY KEY AUTOINCREMENT,provider_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,plan_slug TEXT NOT NULL REFERENCES partner_plans(slug),status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','trialing','active','past_due','cancelled')),stripe_subscription_id TEXT UNIQUE,current_period_end TEXT,trial_end TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS provider_preferences (provider_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,accepts_normal_jobs INTEGER NOT NULL DEFAULT 1,accepts_short_notice INTEGER NOT NULL DEFAULT 1,accepts_consultation INTEGER NOT NULL DEFAULT 1,accepts_emergencies INTEGER NOT NULL DEFAULT 0,emergency_mode TEXT NOT NULL DEFAULT 'local' CHECK(emergency_mode IN ('local','24_7')),emergency_start TEXT NOT NULL DEFAULT '18:00',emergency_end TEXT NOT NULL DEFAULT '22:00',emergency_days TEXT NOT NULL DEFAULT '1,2,3,4,5,6,0',emergency_markup_bps INTEGER NOT NULL DEFAULT 0,opening_hours_text TEXT NOT NULL DEFAULT '',bookable_hours_text TEXT NOT NULL DEFAULT '',instant_booking INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS invoices (id INTEGER PRIMARY KEY AUTOINCREMENT,job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,invoice_number TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sent','paid','cancelled')),issue_date TEXT NOT NULL,service_date TEXT NOT NULL,due_date TEXT NOT NULL,currency TEXT NOT NULL DEFAULT 'eur',seller_name TEXT NOT NULL,seller_address TEXT NOT NULL DEFAULT '',seller_tax_id TEXT NOT NULL DEFAULT '',seller_vat_id TEXT NOT NULL DEFAULT '',seller_email TEXT NOT NULL DEFAULT '',seller_phone TEXT NOT NULL DEFAULT '',buyer_name TEXT NOT NULL,buyer_address TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',subtotal_net INTEGER NOT NULL DEFAULT 0,tax_amount INTEGER NOT NULL DEFAULT 0,total_gross INTEGER NOT NULL DEFAULT 0,created_by_user_id INTEGER NOT NULL REFERENCES users(id),sent_at TEXT,paid_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(provider_id,invoice_number));

CREATE TABLE IF NOT EXISTS invoice_items (id INTEGER PRIMARY KEY AUTOINCREMENT,invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,position INTEGER NOT NULL,description TEXT NOT NULL,quantity REAL NOT NULL DEFAULT 1,unit TEXT NOT NULL DEFAULT 'Stk.',unit_price_net INTEGER NOT NULL,tax_rate_bps INTEGER NOT NULL DEFAULT 1900,line_net INTEGER NOT NULL,line_tax INTEGER NOT NULL,line_gross INTEGER NOT NULL);

CREATE TABLE IF NOT EXISTS house_history_entries (id INTEGER PRIMARY KEY AUTOINCREMENT,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,category TEXT NOT NULL,title TEXT NOT NULL,performed_at TEXT NOT NULL,company_name TEXT NOT NULL DEFAULT '',provider_id INTEGER REFERENCES users(id) ON DELETE SET NULL,contact_name TEXT NOT NULL DEFAULT '',contact_phone TEXT NOT NULL DEFAULT '',contact_email TEXT NOT NULL DEFAULT '',cost_amount INTEGER,guarantee_until TEXT,maintenance_due TEXT,notes TEXT NOT NULL DEFAULT '',before_photo TEXT,after_photo TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS house_history_documents (id INTEGER PRIMARY KEY AUTOINCREMENT,entry_id INTEGER NOT NULL REFERENCES house_history_entries(id) ON DELETE CASCADE,title TEXT NOT NULL,path TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS house_contracts (id INTEGER PRIMARY KEY AUTOINCREMENT,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,kind TEXT NOT NULL DEFAULT 'sonstiges',provider TEXT NOT NULL,tariff TEXT NOT NULL DEFAULT '',contract_number TEXT NOT NULL DEFAULT '',cost_amount INTEGER,cost_interval TEXT NOT NULL DEFAULT 'month' CHECK(cost_interval IN ('month','quarter','halfyear','year')),started_at TEXT,term_months INTEGER,renewal_months INTEGER NOT NULL DEFAULT 12,cancellation_days INTEGER NOT NULL DEFAULT 30,cancellation_deadline TEXT,notice TEXT NOT NULL DEFAULT '',document_title TEXT NOT NULL DEFAULT '',document_path TEXT,status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','cancelled','expired')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS provider_invites (id INTEGER PRIMARY KEY AUTOINCREMENT,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,email TEXT NOT NULL COLLATE NOCASE,company_name TEXT NOT NULL DEFAULT '',category TEXT NOT NULL DEFAULT '',token TEXT NOT NULL UNIQUE,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','linked','cancelled')),linked_provider_id INTEGER REFERENCES users(id) ON DELETE SET NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,linked_at TEXT);

CREATE TABLE IF NOT EXISTS house_transfers (id INTEGER PRIMARY KEY AUTOINCREMENT,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,target_email TEXT NOT NULL COLLATE NOCASE,token TEXT NOT NULL UNIQUE,status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','accepted','revoked')),accepted_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,accepted_at TEXT);

CREATE TABLE IF NOT EXISTS properties (id INTEGER PRIMARY KEY AUTOINCREMENT,address TEXT NOT NULL DEFAULT '',postcode TEXT NOT NULL DEFAULT '',lat REAL,lon REAL,property_type TEXT NOT NULL DEFAULT '',build_year INTEGER,living_area REAL,plot_area REAL,estimated_value_min INTEGER,estimated_value_max INTEGER,use_type TEXT NOT NULL DEFAULT 'residential' CHECK(use_type IN ('residential','commercial','mixed')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS property_ownerships (id INTEGER PRIMARY KEY AUTOINCREMENT,property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,ended_at TEXT,active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS provider_categories (slug TEXT PRIMARY KEY,title TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',active INTEGER NOT NULL DEFAULT 1);

CREATE TABLE IF NOT EXISTS provider_category_assignments (provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,category_slug TEXT NOT NULL REFERENCES provider_categories(slug) ON DELETE CASCADE,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(provider_id,category_slug));

CREATE TABLE IF NOT EXISTS provider_service_offerings (provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,service_slug TEXT NOT NULL REFERENCES service_catalog(slug) ON DELETE CASCADE,active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(provider_id,service_slug));

CREATE TABLE IF NOT EXISTS broker_search_profiles (provider_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,regions_text TEXT NOT NULL DEFAULT '',property_types_text TEXT NOT NULL DEFAULT '',min_price INTEGER,max_price INTEGER,min_living_area REAL,max_living_area REAL,min_plot_area REAL,max_plot_area REAL,residential INTEGER NOT NULL DEFAULT 1,commercial INTEGER NOT NULL DEFAULT 0,specialties TEXT NOT NULL DEFAULT '',updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS property_shares (id INTEGER PRIMARY KEY AUTOINCREMENT,property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,purpose TEXT NOT NULL,permissions_json TEXT NOT NULL DEFAULT '[]',status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked')),granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,revoked_at TEXT);

CREATE TABLE IF NOT EXISTS property_valuations (id INTEGER PRIMARY KEY AUTOINCREMENT,property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','completed','cancelled')),valuation_type TEXT NOT NULL DEFAULT 'orientation',estimated_min INTEGER,estimated_max INTEGER,notes TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,completed_at TEXT);

CREATE TABLE IF NOT EXISTS sale_leads (id INTEGER PRIMARY KEY AUTOINCREMENT,property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,status TEXT NOT NULL DEFAULT 'interested' CHECK(status IN ('interested','matched','contact_released','inspection','mandate','sold','cancelled')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS broker_lead_matches (id INTEGER PRIMARY KEY AUTOINCREMENT,sale_lead_id INTEGER NOT NULL REFERENCES sale_leads(id) ON DELETE CASCADE,provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,match_score REAL NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'suggested' CHECK(status IN ('suggested','contact_released','interested','rejected','inspection','mandate','sold','revoked')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(sale_lead_id,provider_id));

CREATE TABLE IF NOT EXISTS auth_rate_limits (kind TEXT NOT NULL,identifier TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,window_start_at TEXT NOT NULL,blocked_until TEXT,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(kind,identifier));

CREATE TABLE IF NOT EXISTS admin_audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT,actor TEXT NOT NULL,action TEXT NOT NULL,target TEXT NOT NULL DEFAULT '',detail TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS security_events (id INTEGER PRIMARY KEY AUTOINCREMENT,kind TEXT NOT NULL,identifier TEXT NOT NULL DEFAULT '',detail TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS webhook_events (source TEXT NOT NULL CHECK(source IN ('whatsapp','stripe')),event_id TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('processing','processed')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,processed_at TEXT,PRIMARY KEY(source,event_id));

CREATE TABLE IF NOT EXISTS affiliate_clicks (id INTEGER PRIMARY KEY AUTOINCREMENT,category TEXT NOT NULL,partner_id TEXT NOT NULL,source TEXT NOT NULL,click_ref TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(partner_id,click_ref));

CREATE TABLE IF NOT EXISTS tariff_partner_offers (id INTEGER PRIMARY KEY AUTOINCREMENT,partner_id TEXT NOT NULL,category TEXT NOT NULL CHECK(category IN ('strom','gas','dsl','mobilfunk','versicherung')),provider_name TEXT NOT NULL,tariff_name TEXT NOT NULL,annual_cents INTEGER NOT NULL CHECK(annual_cents>=0),postcode_prefix TEXT NOT NULL DEFAULT '',source_ref TEXT NOT NULL DEFAULT '',valid_from TEXT,valid_until TEXT,active INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(partner_id,category,provider_name,tariff_name,postcode_prefix));

CREATE TABLE IF NOT EXISTS owner_ai_user_state (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,last_scanned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS owner_ai_insight_state (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,insight_key TEXT NOT NULL,fingerprint TEXT NOT NULL,notified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,insight_key));

CREATE TABLE IF NOT EXISTS house_documents (id INTEGER PRIMARY KEY AUTOINCREMENT,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,title TEXT NOT NULL,path TEXT NOT NULL,kind TEXT NOT NULL DEFAULT 'other' CHECK(kind IN ('invoice','offer','contract','warranty','maintenance','report','insurance','energy','other')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS document_intelligence_jobs (id INTEGER PRIMARY KEY AUTOINCREMENT,homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,source_type TEXT NOT NULL CHECK(source_type IN ('house_document','job_document','history_document','contract_document')),source_id INTEGER NOT NULL,stored_path TEXT NOT NULL,original_name TEXT NOT NULL DEFAULT '',mime_type TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','processing','done','review','failed')),document_kind TEXT NOT NULL DEFAULT '',relevant_date TEXT,search_text TEXT NOT NULL DEFAULT '',confidence REAL,attempts INTEGER NOT NULL DEFAULT 0,error_code TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(source_type,source_id));

CREATE TABLE IF NOT EXISTS file_archive_state (stored_path TEXT PRIMARY KEY,owner_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,kind TEXT NOT NULL,archive_provider TEXT NOT NULL CHECK(archive_provider IN ('google-drive','icloud')),archive_ref TEXT NOT NULL DEFAULT '',sha256 TEXT NOT NULL DEFAULT '',byte_size INTEGER,archived_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,rehydrate_requested INTEGER NOT NULL DEFAULT 0);

CREATE TABLE IF NOT EXISTS user_cloud_links (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,provider TEXT NOT NULL DEFAULT 'none' CHECK(provider IN ('google-drive','icloud','none')),auto_restore INTEGER NOT NULL DEFAULT 1,linked_at TEXT,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS match_decision_trace (id INTEGER PRIMARY KEY AUTOINCREMENT,job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,decision TEXT NOT NULL CHECK(decision IN ('dispatched','excluded')),reason_key TEXT NOT NULL,detail TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS notification_events (id INTEGER PRIMARY KEY AUTOINCREMENT,event_type TEXT NOT NULL,payload_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,processed_at TEXT);

CREATE TABLE IF NOT EXISTS notification_receipts (id INTEGER PRIMARY KEY AUTOINCREMENT,notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,channel TEXT NOT NULL,state TEXT NOT NULL CHECK(state IN ('sent','failed','dead')),detail TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS user_settings (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,ai_byok_enabled INTEGER NOT NULL DEFAULT 0,ai_byok_provider TEXT NOT NULL DEFAULT '',updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS ai_usage (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,period TEXT NOT NULL,action TEXT NOT NULL DEFAULT 'chat',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS ai_credits (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,granted INTEGER NOT NULL,mode TEXT NOT NULL CHECK(mode IN ('ad','purchase','manual')),source TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_jobs_homeowner ON jobs(homeowner_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status,category,postcode);

CREATE INDEX IF NOT EXISTS idx_quotes_job ON quotes(job_id,amount ASC);

CREATE INDEX IF NOT EXISTS idx_appointments_user_time ON appointments(homeowner_id,start_at);

CREATE INDEX IF NOT EXISTS idx_messages_job ON messages(job_id,created_at ASC);

CREATE INDEX IF NOT EXISTS idx_documents_job ON documents(job_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id,read_at,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dispatch_provider ON job_dispatches(provider_id,status,sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_threads_user ON assistant_threads(user_id,updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_assistant_messages_thread ON assistant_messages(thread_id,created_at ASC);

CREATE INDEX IF NOT EXISTS idx_data_requests_user ON data_requests(user_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cwv_metric ON cwv_metrics(metric,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_events_created ON error_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_maintenance_user_due ON maintenance_tasks(homeowner_id,status,due_date);

CREATE INDEX IF NOT EXISTS idx_provider_members_company ON provider_members(provider_id,active,can_manage_jobs);

CREATE INDEX IF NOT EXISTS idx_job_assignments_contact ON job_assignments(contact_user_id,assigned_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_messages_thread ON contact_messages(homeowner_id,contact_user_id,created_at ASC);

CREATE INDEX IF NOT EXISTS idx_invoices_homeowner ON invoices(homeowner_id,status,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_provider ON invoices(provider_id,status,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id,position);

CREATE INDEX IF NOT EXISTS idx_house_history_owner_date ON house_history_entries(homeowner_id,performed_at DESC);

CREATE INDEX IF NOT EXISTS idx_house_contracts_owner ON house_contracts(homeowner_id,status,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_invites_email ON provider_invites(email,status);

CREATE INDEX IF NOT EXISTS idx_property_ownerships_owner ON property_ownerships(homeowner_id,active,started_at DESC);

CREATE INDEX IF NOT EXISTS idx_property_ownerships_property ON property_ownerships(property_id,active,started_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_category_provider ON provider_category_assignments(provider_id);

CREATE INDEX IF NOT EXISTS idx_property_shares_provider ON property_shares(provider_id,status,granted_at DESC);

CREATE INDEX IF NOT EXISTS idx_valuations_property ON property_valuations(property_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sale_leads_property ON sale_leads(property_id,status,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_broker_matches_provider ON broker_lead_matches(provider_id,status,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_created ON affiliate_clicks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tariff_partner_offers_lookup ON tariff_partner_offers(category,partner_id,active,annual_cents);

CREATE INDEX IF NOT EXISTS idx_house_documents_owner ON house_documents(homeowner_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_document_intelligence_queue ON document_intelligence_jobs(status,updated_at,id);

CREATE INDEX IF NOT EXISTS idx_document_intelligence_owner ON document_intelligence_jobs(homeowner_id,document_kind,updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_file_archive_owner ON file_archive_state(owner_user_id,archived_at DESC);

CREATE INDEX IF NOT EXISTS idx_match_trace_job ON match_decision_trace(job_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_receipts_msg ON notification_receipts(notification_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry ON admin_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_period ON ai_usage(user_id,period,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_credits_user ON ai_credits(user_id,created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_subject ON users(auth_subject) WHERE auth_subject IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_user_live ON sessions(user_id);

-- Später per addColumnIfMissing ergänzte Spalten:
