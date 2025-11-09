# Batch Validation Application Guide

This guide shows the pattern for adding validation to each endpoint type.

## Pattern for All Endpoints

### Step 1: Import Schema
```typescript
import { [SchemaName] } from '@/lib/validation/schemas'
```

### Step 2: Add Validation
```typescript
const body = await request.json()

// Validate input with Zod
const validation = [SchemaName].safeParse(body)
if (!validation.success) {
  return NextResponse.json(
    { error: 'Validation failed', details: validation.error.format() },
    { status: 400 }
  )
}

const data = validation.data
// Use data instead of body
```

## Endpoints to Update

### Auth Endpoints (8)
- [x] POST /api/auth/login → LoginSchema
- [ ] POST /api/auth/forgot-password → ForgotPasswordSchema
- [ ] POST /api/auth/reset-password → ResetPasswordSchema
- [ ] POST /api/auth/send-verification → SendVerificationSchema
- [ ] POST /api/auth/logout → No body validation needed
- [ ] GET /api/auth/verify-email → Query param validation
- [ ] GET/DELETE /api/auth/sessions → No validation needed
- [ ] GET /api/auth/google → No validation needed
- [ ] GET /api/auth/google/callback → Query param validation

### Business Endpoints (4)
- [ ] POST /api/businesses → BusinessSchema
- [ ] PATCH /api/businesses/[id] → UpdateBusinessSchema
- [ ] PATCH /api/businesses/[id]/secrets → UpdateBusinessSecretsSchema (from schemas.ts)
- [ ] GET /api/businesses → No validation needed
- [ ] GET /api/businesses/[id] → No validation needed

### Employee Endpoints (3)
- [ ] POST /api/employees → EmployeeSchema
- [ ] PATCH /api/employees/[id] → UpdateEmployeeSchema
- [ ] GET /api/employees → No validation needed
- [ ] GET /api/employees/[id] → No validation needed
- [ ] DELETE /api/employees/[id] → No validation needed

### Conversation Endpoints (7)
- [ ] GET /api/conversations → Query params (optional)
- [ ] PATCH /api/conversations/[id] → UpdateConversationSchema
- [ ] POST /api/conversations/takeover → TakeoverConversationSchema
- [ ] POST /api/conversations/givebacktoai → TakeoverConversationSchema
- [ ] DELETE /api/conversations/[id] → No validation needed
- [ ] GET /api/conversations/[id]/customer → No validation needed
- [ ] DELETE /api/conversations/[id]/clear → No validation needed
- [ ] GET /api/conversations/[id]/export → Query params (optional)

### Message Endpoints (2)
- [ ] POST /api/messages → MessageSchema
- [ ] GET /api/messages → No validation needed
- [ ] GET /api/messages/[id] → No validation needed
- [ ] DELETE /api/messages/[id] → No validation needed

### Notification Endpoints (3)
- [ ] POST /api/notifications → CreateNotificationSchema
- [ ] PATCH /api/notifications → MarkNotificationsReadSchema
- [ ] POST /api/notifications/subscribe → PushSubscriptionSchema
- [ ] GET /api/notifications → No validation needed
- [ ] DELETE /api/notifications/[id] → No validation needed

### Settings Endpoints (3)
- [ ] PATCH /api/settings → UpdateSettingsSchema
- [ ] PATCH /api/ai-instructions → UpdateAIInstructionsSchema
- [ ] GET /api/settings → No validation needed
- [ ] GET /api/admin/settings → No validation needed
- [ ] PATCH /api/admin/settings → UpdateSettingsSchema

### Template Endpoints (4)
- [ ] POST /api/templates → TemplateSchema
- [ ] PATCH /api/templates/[id] → UpdateTemplateSchema
- [ ] POST /api/canned-responses → CannedResponseSchema
- [ ] PATCH /api/canned-responses/[id] → UpdateCannedResponseSchema
- [ ] GET endpoints → No validation needed
- [ ] DELETE endpoints → No validation needed

### Note Endpoints (2)
- [x] POST /api/notes → CreateNoteSchema (already has validation)
- [x] PATCH /api/notes/[id] → UpdateNoteSchema (already has validation)

### Customer Endpoints (2)
- [x] POST /api/customers → CustomerSchema (already has validation)
- [x] PATCH /api/customers/[id] → UpdateCustomerSchema (already has validation)
- [ ] POST /api/customers/bulk → BulkCustomerSchema

### Remaining Endpoints
- [ ] POST /api/context → Add validation
- [ ] POST /api/voice/transcribe → Add validation
- [ ] POST /api/knowledge-base/refresh → No validation needed
- [ ] All webhook endpoints → Already validated or no body

## Total Count
- Already validated: ~15 endpoints
- Need validation: ~35 endpoints
- No validation needed: ~16 endpoints
