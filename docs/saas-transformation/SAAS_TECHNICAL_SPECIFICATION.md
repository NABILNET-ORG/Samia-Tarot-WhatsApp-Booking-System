# 🏢 Multi-Business WhatsApp AI SaaS Platform - Technical Specification

**Project Name:** WhatsApp AI Business Assistant Platform
**Version:** 2.0.0 (SaaS Transformation)
**Date:** November 4, 2025
**Est. Timeline:** 6-7 weeks across multiple development sessions

---

## 📋 **EXECUTIVE SUMMARY**

Transform the current single-tenant Samia Tarot WhatsApp booking system into a **multi-business SaaS platform** that can be sold to restaurants, clinics, salons, consultants, and any service-based business.

### **Key Capabilities:**
- ✅ Multi-business tenant isolation
- ✅ WhatsApp-like real-time chat interface
- ✅ Employee accounts with role-based permissions
- ✅ Live conversation monitoring with manual takeover
- ✅ Voice note transcription (Google Speech-to-Text)
- ✅ Customizable AI prompts per business
- ✅ Canned response library
- ✅ Push notifications (web + mobile)
- ✅ Logo upload & WhatsApp profile sync
- ✅ Per-client conversation history
- ✅ Mobile-first PWA interface

---

## 🎯 **TARGET USERS**

### **Business Owners** (Buyers of the platform)
- Restaurants (reservation booking)
- Clinics (appointment scheduling)
- Salons/Spas (booking services)
- Consultants (call scheduling)
- E-commerce (order tracking)
- Real estate (property inquiries)

### **Platform Users**
- **Super Admin**: Platform owner, manages all businesses
- **Business Admin**: Business owner, manages their company
- **Manager**: Oversees agents, analytics access
- **Agent**: Handles customer conversations
- **Viewer**: Read-only access to analytics

---

## 🗄️ **DATABASE ARCHITECTURE**

### **New Core Tables**

#### **1. businesses**
Primary table for multi-tenancy.

```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Business Information
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly name
  industry TEXT, -- 'restaurant', 'clinic', 'salon', 'consultant'
  description TEXT,

  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6B46C1',
  secondary_color TEXT DEFAULT '#F59E0B',

  -- WhatsApp Configuration
  whatsapp_provider TEXT CHECK (whatsapp_provider IN ('meta', 'twilio')),
  whatsapp_number TEXT,
  whatsapp_profile_image_url TEXT,

  -- Meta WhatsApp
  meta_phone_id TEXT,
  meta_access_token_encrypted TEXT,
  meta_app_secret_encrypted TEXT,
  meta_verify_token_encrypted TEXT,

  -- Twilio WhatsApp
  twilio_account_sid_encrypted TEXT,
  twilio_auth_token_encrypted TEXT,
  twilio_whatsapp_number TEXT,

  -- Business Settings
  timezone TEXT DEFAULT 'Asia/Beirut',
  business_hours_start TIME DEFAULT '09:00',
  business_hours_end TIME DEFAULT '20:00',
  currency TEXT DEFAULT 'USD',
  language_primary TEXT DEFAULT 'en',
  language_secondary TEXT DEFAULT 'ar',

  -- AI Configuration
  openai_api_key_encrypted TEXT,
  ai_model TEXT DEFAULT 'gpt-4o',
  ai_temperature DECIMAL DEFAULT 0.7,
  ai_max_tokens INT DEFAULT 700,

  -- Google Integration
  google_client_id_encrypted TEXT,
  google_client_secret_encrypted TEXT,
  google_refresh_token_encrypted TEXT,
  google_calendar_id TEXT,

  -- Stripe Integration
  stripe_secret_key_encrypted TEXT,
  stripe_publishable_key TEXT,
  stripe_webhook_secret_encrypted TEXT,

  -- Subscription & Billing
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trial', 'past_due', 'canceled')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMP,
  subscription_started_at TIMESTAMP,
  subscription_canceled_at TIMESTAMP,

  -- Limits & Usage
  plan_max_conversations_monthly INT DEFAULT 100,
  plan_max_employees INT DEFAULT 1,
  plan_max_services INT DEFAULT 10,
  usage_conversations_current_month INT DEFAULT 0,
  usage_voice_minutes_current_month DECIMAL DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_onboarding_complete BOOLEAN DEFAULT false,
  onboarding_step INT DEFAULT 1,

  -- Metadata
  settings_json JSONB DEFAULT '{}',
  metadata_json JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_businesses_slug ON businesses(slug);
CREATE INDEX idx_businesses_active ON businesses(is_active) WHERE is_active = true;
CREATE INDEX idx_businesses_subscription ON businesses(subscription_tier, subscription_status);
```

#### **2. employees**
User accounts for business team members.

```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Authentication
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  email_verification_token TEXT,
  password_reset_token TEXT,
  password_reset_expires_at TIMESTAMP,

  -- Profile
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  preferred_language TEXT DEFAULT 'en',

  -- Role & Permissions
  role_id UUID REFERENCES roles(id),
  permissions_json JSONB DEFAULT '{}', -- Override role permissions

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT false,

  -- Activity
  last_login_at TIMESTAMP,
  last_active_at TIMESTAMP,
  total_conversations_handled INT DEFAULT 0,
  total_bookings_closed INT DEFAULT 0,

  -- Notifications
  notification_preferences_json JSONB DEFAULT '{
    "email": true,
    "push": true,
    "sound": true,
    "new_message": true,
    "new_booking": true,
    "payment_received": true
  }',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX idx_employees_email_business ON employees(email, business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_business ON employees(business_id);
CREATE INDEX idx_employees_active ON employees(is_active) WHERE is_active = true;
```

#### **3. roles**
Permission roles for employees.

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,

  -- Role Definition
  name TEXT NOT NULL, -- 'admin', 'manager', 'agent', 'viewer'
  display_name TEXT NOT NULL, -- 'Business Administrator', 'Support Agent'
  description TEXT,
  color TEXT DEFAULT '#6B46C1', -- Badge color

  -- Permissions
  permissions_json JSONB NOT NULL DEFAULT '{
    "conversations.view": true,
    "conversations.takeover": false,
    "conversations.send_message": false,
    "conversations.delete": false,
    "bookings.view": true,
    "bookings.create": false,
    "bookings.edit": false,
    "bookings.delete": false,
    "services.view": true,
    "services.edit": false,
    "analytics.view": true,
    "analytics.export": false,
    "employees.view": false,
    "employees.manage": false,
    "settings.view": true,
    "settings.edit": false,
    "prompts.edit": false,
    "templates.manage": false
  }',

  -- Metadata
  is_system_role BOOLEAN DEFAULT false, -- Cannot be deleted
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_roles_business ON roles(business_id);
CREATE UNIQUE INDEX idx_roles_name_business ON roles(name, business_id) WHERE is_active = true;
```

#### **4. prompt_templates**
Customizable AI prompts per business and workflow state.

```sql
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Template Identity
  name TEXT NOT NULL, -- 'greeting', 'service_selection', 'payment'
  display_name TEXT NOT NULL, -- 'Greeting Message'
  description TEXT,
  state_name TEXT NOT NULL, -- Links to conversation state

  -- Prompt Content
  content TEXT NOT NULL, -- The actual prompt with {{variables}}
  language TEXT NOT NULL DEFAULT 'en', -- 'ar' | 'en'

  -- Variables
  variables_json JSONB DEFAULT '{}', -- { "customer_name": { "source": "context", "path": "customer.name" }}

  -- AI Parameters
  model TEXT DEFAULT 'gpt-4o',
  temperature DECIMAL DEFAULT 0.7,
  max_tokens INT DEFAULT 700,

  -- Versioning
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  parent_template_id UUID REFERENCES prompt_templates(id), -- For versions

  -- Usage Analytics
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMP,
  avg_response_time_ms INT,
  success_rate DECIMAL, -- Conversations that complete successfully

  -- Metadata
  tags TEXT[], -- ['urgent', 'vip', 'payment']
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES employees(id)
);

CREATE INDEX idx_prompt_templates_business ON prompt_templates(business_id);
CREATE INDEX idx_prompt_templates_state ON prompt_templates(business_id, state_name) WHERE is_active = true;
CREATE INDEX idx_prompt_templates_language ON prompt_templates(business_id, language) WHERE is_active = true;
```

#### **5. canned_responses**
Quick reply templates for manual messaging.

```sql
CREATE TABLE canned_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Response Identity
  title TEXT NOT NULL, -- 'VIP Greeting', 'Payment Confirmation'
  shortcut TEXT, -- '/vip-greeting', '/confirm-pay'
  category TEXT, -- 'greetings', 'payments', 'support', 'follow-up'

  -- Content
  content_english TEXT NOT NULL,
  content_arabic TEXT,

  -- Variables Support
  variables TEXT[], -- ['customer_name', 'service_name', 'amount']

  -- Metadata
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,

  -- Usage Analytics
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMP,
  last_used_by UUID REFERENCES employees(id),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES employees(id)
);

CREATE INDEX idx_canned_responses_business ON canned_responses(business_id);
CREATE INDEX idx_canned_responses_shortcut ON canned_responses(business_id, shortcut) WHERE is_active = true;
CREATE INDEX idx_canned_responses_category ON canned_responses(business_id, category);
```

#### **6. notifications**
In-app and push notifications.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Recipient
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  -- NULL employee_id means notify all employees

  -- Notification Content
  type TEXT NOT NULL, -- 'new_message', 'new_booking', 'payment_received', 'support_request'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT, -- emoji or icon name

  -- Action
  action_url TEXT, -- '/admin/chat?conversation=xxx'
  action_label TEXT, -- 'View Conversation', 'View Booking'

  -- Related Resources
  related_conversation_id UUID REFERENCES conversations(id),
  related_booking_id UUID REFERENCES bookings(id),
  related_customer_id UUID REFERENCES customers(id),

  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,

  -- Push Notification
  push_sent BOOLEAN DEFAULT false,
  push_sent_at TIMESTAMP,
  push_error TEXT,

  -- Priority
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Metadata
  metadata_json JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP -- Auto-delete old notifications
);

CREATE INDEX idx_notifications_employee ON notifications(employee_id, is_read);
CREATE INDEX idx_notifications_business ON notifications(business_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(employee_id, is_read) WHERE is_read = false;
```

#### **7. push_subscriptions**
Web Push API subscriptions for each device.

```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Push Subscription Data (from Push API)
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL, -- Public key
  auth_key TEXT NOT NULL, -- Authentication secret

  -- Device Info
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  browser TEXT, -- 'chrome', 'firefox', 'safari'
  os TEXT, -- 'windows', 'macos', 'ios', 'android'
  device_name TEXT, -- User-friendly name

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  error_count INT DEFAULT 0,
  last_error TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_push_subscriptions_employee ON push_subscriptions(employee_id) WHERE is_active = true;
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
```

#### **8. voice_messages**
Voice note transcriptions and metadata.

```sql
CREATE TABLE voice_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES conversation_messages(id),

  -- Audio File
  audio_url TEXT NOT NULL, -- CloudFlare R2 / AWS S3 URL
  audio_format TEXT, -- 'ogg', 'mp3', 'wav'
  audio_size_bytes INT,
  audio_duration_seconds INT,

  -- Transcription
  transcription_text TEXT,
  transcription_language TEXT, -- 'ar', 'en', 'auto-detected'
  transcription_confidence DECIMAL, -- 0.0 to 1.0
  transcription_status TEXT DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  transcription_error TEXT,
  transcription_cost DECIMAL, -- Track API costs

  -- Google Speech-to-Text Response
  transcription_response_json JSONB, -- Full API response

  -- Processing
  processed_by_ai BOOLEAN DEFAULT false,
  ai_response_generated BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  transcribed_at TIMESTAMP,
  processed_at TIMESTAMP
);

CREATE INDEX idx_voice_messages_conversation ON voice_messages(conversation_id);
CREATE INDEX idx_voice_messages_status ON voice_messages(transcription_status) WHERE transcription_status != 'completed';
CREATE INDEX idx_voice_messages_business ON voice_messages(business_id, created_at DESC);
```

#### **9. media_files**
General media storage (images, documents, etc.)

```sql
CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- File Information
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image', 'document', 'logo', 'avatar'
  mime_type TEXT NOT NULL, -- 'image/jpeg', 'image/png'
  file_size_bytes INT,

  -- Image Dimensions (if applicable)
  width INT,
  height INT,

  -- Usage
  used_for TEXT, -- 'business_logo', 'whatsapp_profile', 'employee_avatar', 'message_attachment'
  used_by_id UUID, -- business_id, employee_id, or conversation_id

  -- CDN
  cdn_url TEXT, -- Optimized/cached version
  thumbnail_url TEXT,

  -- Uploaded By
  uploaded_by UUID REFERENCES employees(id),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_media_files_business ON media_files(business_id);
CREATE INDEX idx_media_files_type ON media_files(file_type, used_for);
```

#### **10. conversation_assignments**
Track which employee is handling which conversation.

```sql
CREATE TABLE conversation_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Assignment
  assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES employees(id),
  assignment_type TEXT DEFAULT 'manual' CHECK (assignment_type IN ('auto', 'manual', 'escalation')),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'transferred', 'abandoned')),

  -- Mode
  mode TEXT DEFAULT 'ai' CHECK (mode IN ('ai', 'human', 'hybrid')), -- Current handling mode
  taken_over_at TIMESTAMP, -- When agent took over from AI
  taken_over_by UUID REFERENCES employees(id),

  -- Timestamps
  assigned_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  transferred_at TIMESTAMP
);

CREATE INDEX idx_conversation_assignments_conversation ON conversation_assignments(conversation_id);
CREATE INDEX idx_conversation_assignments_employee ON conversation_assignments(assigned_to, status) WHERE status = 'active';
CREATE INDEX idx_conversation_assignments_business ON conversation_assignments(business_id, status);
```

#### **11. internal_notes**
Private notes between employees about conversations.

```sql
CREATE TABLE internal_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,

  -- Note Content
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'warning', 'follow_up', 'reminder')),

  -- Visibility
  is_pinned BOOLEAN DEFAULT false,
  mentioned_employee_ids UUID[], -- @mention employees

  -- Created By
  created_by UUID NOT NULL REFERENCES employees(id),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_internal_notes_conversation ON internal_notes(conversation_id, created_at DESC);
CREATE INDEX idx_internal_notes_customer ON internal_notes(customer_id, created_at DESC);
CREATE INDEX idx_internal_notes_business ON internal_notes(business_id);
```

#### **12. activity_logs**
Audit trail of all employee actions.

```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,

  -- Action Details
  action TEXT NOT NULL, -- 'conversation.takeover', 'booking.create', 'service.edit'
  action_category TEXT, -- 'conversations', 'bookings', 'settings'
  description TEXT, -- Human-readable description

  -- Resource
  resource_type TEXT, -- 'conversation', 'booking', 'service', 'employee'
  resource_id UUID,

  -- Changes (for edit actions)
  changes_json JSONB, -- { "before": {...}, "after": {...} }

  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  metadata_json JSONB DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_business ON activity_logs(business_id, created_at DESC);
CREATE INDEX idx_activity_logs_employee ON activity_logs(employee_id, created_at DESC);
CREATE INDEX idx_activity_logs_resource ON activity_logs(resource_type, resource_id);
```

---

### **Modified Existing Tables**

#### **Add business_id to ALL existing tables:**

```sql
-- customers
ALTER TABLE customers ADD COLUMN business_id UUID REFERENCES businesses(id);
CREATE INDEX idx_customers_business ON customers(business_id, phone);

-- conversations
ALTER TABLE conversations ADD COLUMN business_id UUID REFERENCES businesses(id);
ALTER TABLE conversations ADD COLUMN mode TEXT DEFAULT 'ai' CHECK (mode IN ('ai', 'human', 'hybrid'));
ALTER TABLE conversations ADD COLUMN assigned_to UUID REFERENCES employees(id);
CREATE INDEX idx_conversations_business ON conversations(business_id, is_active);
CREATE INDEX idx_conversations_assigned ON conversations(assigned_to, is_active) WHERE is_active = true;

-- bookings
ALTER TABLE bookings ADD COLUMN business_id UUID REFERENCES businesses(id);
ALTER TABLE bookings ADD COLUMN handled_by UUID REFERENCES employees(id);
CREATE INDEX idx_bookings_business ON bookings(business_id, created_at DESC);

-- services
ALTER TABLE services ADD COLUMN business_id UUID REFERENCES businesses(id);
CREATE INDEX idx_services_business ON services(business_id, is_active) WHERE is_active = true;

-- admin_notifications
ALTER TABLE admin_notifications ADD COLUMN business_id UUID REFERENCES businesses(id);
ALTER TABLE admin_notifications ADD COLUMN employee_id UUID REFERENCES employees(id);

-- analytics_events
ALTER TABLE analytics_events ADD COLUMN business_id UUID REFERENCES businesses(id);

-- webhook_logs
ALTER TABLE webhook_logs ADD COLUMN business_id UUID REFERENCES businesses(id);
```

---

### **Row-Level Security (RLS) Policies**

```sql
-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
-- etc for all tables

-- Example Policy: Employees can only see their business data
CREATE POLICY employee_business_isolation ON customers
  FOR ALL
  USING (business_id = current_setting('app.current_business_id')::UUID);

CREATE POLICY employee_business_isolation ON conversations
  FOR ALL
  USING (business_id = current_setting('app.current_business_id')::UUID);

-- Super Admin bypass (for platform owner)
CREATE POLICY super_admin_access ON customers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = current_setting('app.current_employee_id')::UUID
      AND email = 'superadmin@platform.com'
    )
  );
```

---

## 🔌 **API ENDPOINTS SPECIFICATION**

### **Business Management**

```
POST   /api/businesses                    # Create new business (signup)
GET    /api/businesses/:id                # Get business details
PATCH  /api/businesses/:id                # Update business
DELETE /api/businesses/:id                # Delete business
POST   /api/businesses/:id/logo           # Upload logo
POST   /api/businesses/:id/whatsapp-profile # Sync WhatsApp profile image
GET    /api/businesses/:id/usage          # Get usage stats
POST   /api/businesses/:id/subscription   # Update subscription
```

### **Employee Management**

```
GET    /api/businesses/:id/employees      # List employees
POST   /api/businesses/:id/employees      # Invite employee
GET    /api/employees/:id                 # Get employee profile
PATCH  /api/employees/:id                 # Update employee
DELETE /api/employees/:id                 # Deactivate employee
POST   /api/employees/:id/avatar          # Upload avatar
GET    /api/employees/:id/activity        # Activity log
GET    /api/employees/:id/analytics       # Performance metrics
```

### **Real-Time Chat**

```
WS     /api/socket                        # WebSocket connection
       Events:
       - 'conversation:new'               # New conversation started
       - 'message:new'                    # New message received
       - 'message:sent'                   # Message sent successfully
       - 'typing:start'                   # Customer/agent typing
       - 'typing:stop'                    # Stopped typing
       - 'conversation:assigned'          # Assigned to agent
       - 'conversation:takeover'          # AI → Human switch

POST   /api/conversations/:id/takeover    # Manual takeover
POST   /api/conversations/:id/handback    # Give back to AI
POST   /api/conversations/:id/assign      # Assign to employee
POST   /api/conversations/:id/send        # Send message as employee
POST   /api/conversations/:id/typing      # Typing indicator
```

### **Voice & Media**

```
POST   /api/upload/voice                  # Upload voice note
GET    /api/voice/:id/transcription       # Get transcription
POST   /api/voice/:id/retranscribe        # Retry transcription
GET    /api/voice/:id/audio               # Download audio file
POST   /api/upload/media                  # Upload image/document
```

### **Notifications**

```
GET    /api/notifications                 # List notifications
POST   /api/notifications/:id/read        # Mark as read
DELETE /api/notifications/:id             # Delete notification
PATCH  /api/notifications/read-all        # Mark all as read
GET    /api/notifications/unread-count    # Badge count

POST   /api/push/subscribe                # Subscribe to push
DELETE /api/push/unsubscribe              # Unsubscribe
GET    /api/push/subscriptions            # List devices
POST   /api/push/test                     # Send test notification
```

### **Templates & Prompts**

```
GET    /api/prompts                       # List prompt templates
POST   /api/prompts                       # Create template
PATCH  /api/prompts/:id                   # Update template
DELETE /api/prompts/:id                   # Delete template
POST   /api/prompts/:id/test              # Test prompt
GET    /api/prompts/:id/versions          # Version history

GET    /api/canned-responses              # List canned responses
POST   /api/canned-responses              # Create response
PATCH  /api/canned-responses/:id          # Update response
DELETE /api/canned-responses/:id          # Delete response
GET    /api/canned-responses/search       # Search by shortcut/category
```

---

## 🎨 **FRONTEND COMPONENTS ARCHITECTURE**

### **Core Components (100+ components to build)**

```typescript
// Layout Components
├── ChatLayout.tsx                   # Main WhatsApp-like layout
├── AdminLayout.tsx                  # Admin dashboard layout
├── EmployeeLayout.tsx               # Employee dashboard layout
├── BottomNavigation.tsx             # Mobile navigation
└── TopBar.tsx                       # Header with logo, notifications

// Chat Components
├── ConversationList.tsx             # Left sidebar - conversation list
├── ConversationItem.tsx             # Single conversation preview
├── ChatWindow.tsx                   # Main chat area
├── MessageBubble.tsx                # Individual message bubble
├── MessageComposer.tsx              # Message input with canned responses
├── VoiceNotePlayer.tsx              # Audio player with waveform
├── VoiceNoteRecorder.tsx            # Record voice (future)
├── TypingIndicator.tsx              # "Customer is typing..."
├── MessageStatus.tsx                # Sent/Delivered/Read checkmarks
├── CustomerInfoPanel.tsx            # Right sidebar - customer details
├── TakeOverButton.tsx               # AI → Human switch
├── CannedResponsePicker.tsx         # Quick reply dropdown
├── EmojiPicker.tsx                  # Emoji selector
└── ImagePreview.tsx                 # Image lightbox

// Notification Components
├── NotificationCenter.tsx           # Dropdown notification list
├── NotificationItem.tsx             # Single notification
├── NotificationBadge.tsx            # Unread count badge
├── PushPermissionPrompt.tsx         # Request push permission
├── NotificationPreferences.tsx      # Settings page
└── Toast.tsx                        # Toast notification

// Business Management
├── BusinessOnboarding.tsx           # Multi-step signup flow
├── BusinessSettings.tsx             # Settings page
├── LogoUploader.tsx                 # Drag-and-drop logo upload
├── WhatsAppProfileSync.tsx          # Sync profile image
├── BrandingCustomizer.tsx           # Theme color picker
└── SubscriptionManager.tsx          # Billing & plans

// Employee Management
├── EmployeeList.tsx                 # Team members table
├── EmployeeInvite.tsx               # Invite modal
├── RoleEditor.tsx                   # Permission matrix
├── EmployeeProfile.tsx              # Employee details
├── EmployeeAnalytics.tsx            # Performance dashboard
└── ActivityLog.tsx                  # Audit trail

// Prompt & Template Management
├── PromptTemplateEditor.tsx         # Monaco editor with variables
├── PromptTemplateList.tsx           # Template library
├── VariablePicker.tsx               # {{variable}} selector
├── PromptTester.tsx                 # Test playground
├── VersionHistory.tsx               # Template versions
├── CannedResponseLibrary.tsx        # Response management
└── TemplatePreview.tsx              # Live preview

// Analytics & Reporting
├── ConversationAnalytics.tsx        # Conversation metrics
├── EmployeePerformance.tsx          # Agent leaderboard
├── RevenueChart.tsx                 # Booking revenue
├── ResponseTimeChart.tsx            # Avg response time
└── ExportData.tsx                   # CSV/PDF export
```

---

## 🔧 **INTEGRATION SPECIFICATIONS**

### **1. Google Speech-to-Text Integration**

**API Setup:**
```typescript
import { SpeechClient } from '@google-cloud/speech'

const client = new SpeechClient({
  credentials: {
    client_email: process.env.GOOGLE_SPEECH_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SPEECH_PRIVATE_KEY,
  },
})

async function transcribeVoiceNote(audioBuffer: Buffer, language: 'ar' | 'en' | 'auto') {
  const request = {
    audio: { content: audioBuffer.toString('base64') },
    config: {
      encoding: 'OGG_OPUS',
      sampleRateHertz: 48000,
      languageCode: language === 'ar' ? 'ar-SA' : 'en-US',
      alternativeLanguageCodes: ['ar-EG', 'ar-LB', 'en-GB'],
      enableAutomaticPunctuation: true,
      model: 'latest_long',
    },
  }

  const [response] = await client.recognize(request)
  return {
    transcription: response.results[0].alternatives[0].transcript,
    confidence: response.results[0].alternatives[0].confidence,
    language: response.results[0].languageCode,
  }
}
```

**Cost Calculation:**
- $0.006 per 15 seconds
- Average 30-second voice note = $0.012
- 100 voice notes/day = $36/month

### **2. Web Push Notifications**

**Service Worker Setup:**
```javascript
// public/sw.js
self.addEventListener('push', event => {
  const data = event.data.json()

  self.registration.showNotification(data.title, {
    body: data.message,
    icon: data.icon || '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.action_url,
      conversation_id: data.conversation_id,
    },
    actions: [
      { action: 'open', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    requireInteraction: data.priority === 'urgent',
  })
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  if (event.action === 'open') {
    clients.openWindow(event.notification.data.url)
  }
})
```

**Backend Push API:**
```typescript
import webpush from 'web-push'

webpush.setVAPIDDetails(
  'mailto:admin@platform.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

async function sendPushNotification(employee: Employee, notification: Notification) {
  const subscriptions = await getPushSubscriptions(employee.id)

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key,
          },
        },
        JSON.stringify({
          title: notification.title,
          message: notification.message,
          icon: notification.icon,
          action_url: notification.action_url,
          priority: notification.priority,
        })
      )
    } catch (error) {
      // Handle failed subscription (410 = expired, remove it)
      if (error.statusCode === 410) {
        await deletePushSubscription(sub.id)
      }
    }
  }
}
```

### **3. WhatsApp Profile Image Sync**

**Meta API:**
```typescript
async function updateWhatsAppProfileImage(business: Business, imageUrl: string) {
  // Download image
  const imageBuffer = await fetch(imageUrl).then(r => r.buffer())

  // Upload to Meta
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${business.meta_phone_id}/whatsapp_business_profile`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${business.meta_access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        profile_picture_handle: imageBuffer.toString('base64'),
      }),
    }
  )

  return response.json()
}
```

### **4. Real-Time Socket.io Events**

```typescript
// Server-side (src/lib/socket/server.ts)
io.on('connection', async (socket) => {
  const employee = await authenticateSocket(socket.handshake.auth.token)
  const business = await getBusiness(employee.business_id)

  // Join business room
  socket.join(`business:${business.id}`)
  socket.join(`employee:${employee.id}`)

  // Employee comes online
  await updateEmployeeStatus(employee.id, true)
  io.to(`business:${business.id}`).emit('employee:online', { employee_id: employee.id })

  // Listen for events
  socket.on('message:send', async (data) => {
    const message = await sendMessageAsEmployee(data.conversation_id, data.text, employee.id)
    io.to(`business:${business.id}`).emit('message:new', message)
  })

  socket.on('conversation:takeover', async (data) => {
    await takeoverConversation(data.conversation_id, employee.id)
    io.to(`business:${business.id}`).emit('conversation:mode_changed', {
      conversation_id: data.conversation_id,
      mode: 'human',
      taken_over_by: employee.id,
    })
  })

  socket.on('typing:start', (data) => {
    socket.to(`conversation:${data.conversation_id}`).emit('agent:typing', { employee })
  })

  // Disconnect
  socket.on('disconnect', async () => {
    await updateEmployeeStatus(employee.id, false)
    io.to(`business:${business.id}`).emit('employee:offline', { employee_id: employee.id })
  })
})
```

---

## 📱 **MOBILE PWA FEATURES**

### **Native-Like Capabilities:**

**1. Install Prompts:**
```typescript
// iOS Add to Home Screen
if (isIOS && !isInstalled) {
  showIOSInstallPrompt() // "Tap Share → Add to Home Screen"
}

// Android Install Banner
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  setInstallPrompt(e)
  showInstallBanner()
})
```

**2. Push Notification Permission:**
```typescript
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported'
  }

  const permission = await Notification.requestPermission()

  if (permission === 'granted') {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY,
    })

    // Save subscription to database
    await savePushSubscription(subscription)
  }

  return permission
}
```

**3. Background Sync:**
```javascript
// Queue messages when offline
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  await navigator.serviceWorker.ready.then(registration => {
    return registration.sync.register('sync-messages')
  })
}

// Service worker handles sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncPendingMessages())
  }
})
```

**4. App Badge (Unread Count):**
```typescript
if ('setAppBadge' in navigator) {
  navigator.setAppBadge(unreadCount)
}
```

**5. Vibration/Haptic:**
```typescript
if ('vibrate' in navigator) {
  navigator.vibrate(200) // On new message
}
```

---

## 🎨 **UI/UX DESIGN SYSTEM**

### **Mobile-First Breakpoints:**
```css
/* Mobile (default) */
@media (min-width: 640px)  { /* sm - Small tablets */ }
@media (min-width: 768px)  { /* md - Tablets */ }
@media (min-width: 1024px) { /* lg - Desktop */ }
@media (min-width: 1280px) { /* xl - Large desktop */ }
```

### **Chat UI Layout:**
```
┌─────────────────────────────────────────┐
│ TopBar: Logo | Business Name | 🔔(3)   │
├──────────┬──────────────────┬───────────┤
│          │                  │           │
│  Convos  │   Chat Window    │ Customer  │
│   List   │                  │   Info    │
│          │                  │  Panel    │
│  [●] Ali │  ┌──────────┐    │           │
│  [ ] Sara│  │Customer  │    │ 📱 Phone  │
│  [ ] John│  └──────────┘    │ 📧 Email  │
│          │                  │ 📊 Stats  │
│          │  ┌──────────┐    │ 📝 Notes  │
│  + New   │  │Agent     │    │           │
│          │  └──────────┘    │ [Takeover]│
│          │                  │           │
│          │  [Type message]  │           │
│          │  [😊] [📎] [🎤] │           │
└──────────┴──────────────────┴───────────┘
│  Chats  Analytics  Settings  Profile   │ ← Bottom Nav (Mobile)
└─────────────────────────────────────────┘
```

### **Color Scheme (Customizable per Business):**
```typescript
const defaultTheme = {
  primary: '#6B46C1',     // Purple
  secondary: '#F59E0B',   // Amber
  success: '#10B981',     // Green
  danger: '#EF4444',      // Red
  info: '#3B82F6',        // Blue

  // Message bubbles
  bubbleAgent: '#DCF8C6', // Light green (like WhatsApp)
  bubbleCustomer: '#FFFFFF', // White
  bubbleAI: '#E3F2FD',    // Light blue

  // Backgrounds
  chatBg: '#ECE5DD',      // WhatsApp beige
  sidebarBg: '#FFFFFF',

  // Text
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
}
```

---

## 📊 **SESSION BREAKDOWN**

### **Session 1 (TODAY): Foundation & Specs**
**Duration:** Current session
**Deliverables:**
- ✅ Complete technical specification (this document)
- ✅ Database schema design (SQL files)
- ✅ Migration scripts
- ✅ API endpoint specifications
- ✅ Component architecture
- ✅ Roadmap for sessions 2-10

**Files Created:**
- `docs/saas-transformation/SAAS_TECHNICAL_SPECIFICATION.md`
- `docs/saas-transformation/DATABASE_SCHEMA.md`
- `docs/saas-transformation/API_SPECIFICATION.md`
- `docs/saas-transformation/COMPONENT_ARCHITECTURE.md`
- `docs/saas-transformation/SESSION_ROADMAP.md`
- `supabase/migrations/001_add_multi_tenancy.sql`
- `supabase/migrations/002_add_notifications.sql`
- `supabase/migrations/003_add_voice_messages.sql`
- `supabase/migrations/004_add_templates.sql`
- `supabase/migrations/005_add_rls_policies.sql`

---

### **Session 2-3: Backend Foundation**
- Multi-tenant middleware
- Business CRUD APIs
- Employee management APIs
- Authentication system (JWT + sessions)
- Encryption helpers for API keys
- Database seeding scripts

### **Session 4-5: Real-Time Infrastructure**
- Socket.io server setup
- Redis configuration
- Message queue (Bull)
- Real-time conversation sync
- Typing indicators
- WebSocket authentication

### **Session 6-7: Chat Interface**
- WhatsApp-like UI components
- Infinite scroll conversations
- Message bubbles with status
- Voice note player
- Message composer
- Take over functionality

### **Session 8: Voice & Media**
- Google Speech-to-Text integration
- Audio processing worker
- Media upload handlers
- CDN integration (Cloudflare R2)
- Voice UI components

### **Session 9: AI Templates & Prompts**
- Prompt template system
- Monaco editor integration
- Variable interpolation engine
- Template testing playground
- Version management

### **Session 10: Notifications & Polish**
- Web Push setup
- Notification center UI
- Push subscription management
- Logo upload & branding
- Final testing & documentation

---

## 💡 **MY ADDITIONAL FEATURE RECOMMENDATIONS**

### **Essential for SaaS:**
1. **Customer Segmentation**: Auto-tag VIP based on total_spent > $500
2. **Broadcast Messaging**: Send announcements to customer groups
3. **Automated Follow-ups**: "Still interested?" after 3 days inactive
4. **Conversation Templates**: Save/reuse common workflows
5. **Multi-language Admin Dashboard**: Interface in Arabic + English

### **Revenue Generators:**
6. **WhatsApp Business Templates**: Pre-approved marketing messages
7. **API Access**: REST API for third-party integrations
8. **White-Label**: Remove platform branding (enterprise tier)
9. **Custom Domain**: business.yourdomain.com (enterprise)
10. **Advanced Analytics**: Conversion funnels, cohort analysis

### **Operational Efficiency:**
11. **Auto-assignment Rules**: Route conversations based on keywords/language
12. **SLA Tracking**: Alert if response time > 5 minutes
13. **Customer Satisfaction**: Post-conversation surveys
14. **Knowledge Base**: FAQ bot for common questions
15. **Shift Management**: Agent availability schedules

---

## 🚀 **NEXT STEPS**

I'll now create the detailed specification documents and database migration files. This session will deliver the complete foundation needed to start building in the next sessions.

**Estimated completion for today's session:** Next 2-3 hours of development time.

Ready to proceed?
