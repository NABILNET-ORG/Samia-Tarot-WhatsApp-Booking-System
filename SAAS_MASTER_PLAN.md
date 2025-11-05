# 🚀 MASTER PLAN: WhatsApp AI SaaS Platform Transformation

**Project:** Multi-Business WhatsApp AI Assistant Platform
**Timeline:** 10 sessions (~6-7 weeks)
**Current Status:** Session 1 Complete ✅
**Next Session:** Session 2 - Backend Foundation

---

## 🎯 **VISION:**

Transform single-tenant Samia Tarot app into a **multi-business SaaS platform** sellable to:
- Restaurants (reservations)
- Clinics (appointments)
- Salons (bookings)
- Consultants (calls)
- Any service business

---

## ✅ **FEATURES TO BUILD:**

1. ✅ Multi-business tenant isolation
2. ✅ WhatsApp-like real-time chat interface (mobile PWA)
3. ✅ Employee accounts with role-based permissions
4. ✅ Live conversation monitoring
5. ✅ Manual takeover (AI → Human mode)
6. ✅ Voice note transcription (Google Speech-to-Text)
7. ✅ Customizable AI prompts (template system with variables)
8. ✅ Canned response library with shortcuts
9. ✅ Push notifications (web + mobile)
10. ✅ Logo upload & WhatsApp profile sync
11. ✅ Per-client conversation history
12. ✅ Per-employee dashboards & analytics

---

## 📅 **SESSION ROADMAP:**

### **✅ Session 1: Planning & Specs (COMPLETE)**
- [x] Technical specification document
- [x] Database schema design (12 new tables)
- [x] API endpoint specifications (50+ endpoints)
- [x] Component architecture (100+ components)
- [x] Integration specs (Google Speech, Web Push, Socket.io)

**Next:** Session 2

---

### **⏳ Session 2-3: Backend Foundation**
**Goal:** Multi-tenancy + Core APIs

**Tasks:**
1. Create database migrations (12 tables)
2. Run migrations on Supabase
3. Build business CRUD API (`/api/businesses`)
4. Build employee management API (`/api/employees`)
5. Implement RBAC middleware
6. Create encryption helpers for API keys
7. Build authentication system (JWT + sessions)
8. Test tenant isolation
9. Seed first business (Samia Tarot migrated)

**Files to Create:**
- `supabase/migrations/001_create_businesses.sql`
- `supabase/migrations/002_create_employees_roles.sql`
- `supabase/migrations/003_create_notifications.sql`
- `supabase/migrations/004_create_voice_media.sql`
- `supabase/migrations/005_create_templates.sql`
- `supabase/migrations/006_add_business_id_to_existing.sql`
- `supabase/migrations/007_create_rls_policies.sql`
- `src/lib/multi-tenant/middleware.ts`
- `src/lib/multi-tenant/context.ts`
- `src/lib/rbac/permissions.ts`
- `src/lib/encryption/keys.ts`
- `src/app/api/businesses/route.ts`
- `src/app/api/employees/route.ts`

---

### **⏳ Session 4-5: Real-Time Infrastructure**
**Goal:** Socket.io + Live Messaging

**Tasks:**
1. Install Socket.io dependencies
2. Create WebSocket server
3. Implement Redis for pub/sub
4. Build message queue (Bull)
5. Create real-time conversation sync
6. Implement typing indicators
7. Build read receipt system
8. WebSocket authentication
9. Test real-time updates

**Files to Create:**
- `src/lib/socket/server.ts`
- `src/lib/socket/client.ts`
- `src/lib/redis/client.ts`
- `src/lib/queue/conversation-queue.ts`
- `src/hooks/useSocket.ts`
- `src/hooks/useConversations.ts`
- `src/app/api/socket/route.ts`

**Dependencies:**
- `socket.io` + `socket.io-client`
- `ioredis`
- `bull`

---

### **⏳ Session 6-7: WhatsApp-Like Chat UI**
**Goal:** Mobile-first chat interface

**Tasks:**
1. Create chat layout components
2. Build conversation list with infinite scroll
3. Create message bubble components
4. Build message composer
5. Implement canned response picker
6. Create customer info panel
7. Build takeover button & mode indicator
8. Add typing indicators
9. Implement message status icons
10. Mobile responsive design
11. Bottom navigation
12. Swipe gestures

**Files to Create:**
- `src/components/chat/ChatLayout.tsx`
- `src/components/chat/ConversationList.tsx`
- `src/components/chat/ChatWindow.tsx`
- `src/components/chat/MessageBubble.tsx`
- `src/components/chat/MessageComposer.tsx`
- `src/components/chat/VoiceNotePlayer.tsx`
- `src/components/chat/CustomerInfoPanel.tsx`
- `src/components/chat/TakeOverButton.tsx`
- `src/components/chat/CannedResponsePicker.tsx`
- `src/components/chat/TypingIndicator.tsx`
- `src/app/admin/chat/page.tsx`
- `src/hooks/useTakeover.ts`
- `src/hooks/useMessages.ts`

---

### **⏳ Session 8: Voice & Media**
**Goal:** Voice transcription + Media handling

**Tasks:**
1. Set up Google Speech-to-Text
2. Create voice processing worker
3. Build media upload API
4. Set up Cloudflare R2 / AWS S3
5. Create voice player component
6. Build transcription display
7. Implement retry mechanism
8. Add confidence score display

**Files to Create:**
- `src/lib/transcription/google-speech.ts`
- `src/lib/storage/media-storage.ts`
- `src/lib/queue/voice-queue.ts`
- `src/app/api/upload/voice/route.ts`
- `src/app/api/transcribe/route.ts`
- `src/components/chat/VoicePlayer.tsx`
- `src/components/chat/TranscriptionDisplay.tsx`

**Dependencies:**
- `@google-cloud/speech`
- `@aws-sdk/client-s3` or Cloudflare R2

---

### **⏳ Session 9: AI Templates & Prompts**
**Goal:** Customizable AI system

**Tasks:**
1. Create prompt template database helpers
2. Build template editor UI (Monaco)
3. Implement variable interpolation
4. Create template testing playground
5. Build version management
6. Implement canned response CRUD
7. Create template library UI

**Files to Create:**
- `src/lib/prompts/template-engine.ts`
- `src/lib/prompts/variable-resolver.ts`
- `src/app/api/prompts/route.ts`
- `src/app/api/canned-responses/route.ts`
- `src/app/admin/prompts/page.tsx`
- `src/components/prompts/TemplateEditor.tsx`
- `src/components/prompts/VariablePicker.tsx`
- `src/components/prompts/PromptTester.tsx`

**Dependencies:**
- `@monaco-editor/react`
- `handlebars` (for template variables)

---

### **⏳ Session 10: Notifications & Polish**
**Goal:** Push notifications + Final touches

**Tasks:**
1. Set up Web Push API
2. Create push subscription management
3. Build notification center UI
4. Implement in-app toasts
5. Create logo upload component
6. Build WhatsApp profile sync
7. Add theme customization
8. Final testing
9. Documentation
10. **SINGLE GIT COMMIT**

**Files to Create:**
- `src/lib/notifications/push-service.ts`
- `src/lib/notifications/notification-manager.ts`
- `src/app/api/push/subscribe/route.ts`
- `src/app/api/notifications/route.ts`
- `src/components/notifications/NotificationCenter.tsx`
- `src/components/notifications/Toast.tsx`
- `src/components/branding/LogoUploader.tsx`
- `src/app/admin/branding/page.tsx`

**Dependencies:**
- `web-push`
- `react-hot-toast`

---

## 🔑 **CRITICAL DECISIONS NEEDED:**

### **For Session 2:**
1. **Redis Hosting:** Upstash (serverless) vs self-hosted?
2. **Media Storage:** Cloudflare R2 (cheaper) vs AWS S3 (standard)?
3. **Data Migration:** Migrate Samia Tarot as first business automatically?

### **For Future:**
4. **Subscription Billing:** Stripe subscriptions or manual?
5. **Domain Strategy:** Subdomains (business.platform.com) or paths (/business-slug)?

---

## 📊 **PROGRESS TRACKER:**

- [x] Session 1: Planning (100%)
- [ ] Session 2-3: Backend (0%)
- [ ] Session 4-5: Real-Time (0%)
- [ ] Session 6-7: Chat UI (0%)
- [ ] Session 8: Voice (0%)
- [ ] Session 9: AI Templates (0%)
- [ ] Session 10: Notifications (0%)

**Overall: 10% Complete**

---

## 🚀 **LET'S BEGIN SESSION 2!**

Starting with database migrations...

**Token Usage: 364.6K/1000K (36.5%), 635.4K remaining**
