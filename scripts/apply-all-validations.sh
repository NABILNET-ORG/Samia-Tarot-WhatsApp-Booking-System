#!/bin/bash

# Apply validation to all endpoints that need it

echo "🚀 Applying Zod validation to all endpoints..."
echo ""

# Auth endpoints
echo "📝 Auth Endpoints..."
node scripts/add-validation-to-endpoint.js src/app/api/auth/reset-password/route.ts ResetPasswordSchema
node scripts/add-validation-to-endpoint.js src/app/api/auth/send-verification/route.ts SendVerificationSchema

# Business endpoints
echo ""
echo "📝 Business Endpoints..."
node scripts/add-validation-to-endpoint.js src/app/api/businesses/route.ts BusinessSchema
node scripts/add-validation-to-endpoint.js src/app/api/businesses/[id]/route.ts UpdateBusinessSchema

# Employee endpoints
echo ""
echo "📝 Employee Endpoints..."
node scripts/add-validation-to-endpoint.js src/app/api/employees/route.ts EmployeeSchema
node scripts/add-validation-to-endpoint.js src/app/api/employees/[id]/route.ts UpdateEmployeeSchema

# Conversation endpoints
echo ""
echo "📝 Conversation Endpoints..."
node scripts/add-validation-to-endpoint.js src/app/api/conversations/[id]/route.ts UpdateConversationSchema
node scripts/add-validation-to-endpoint.js src/app/api/conversations/takeover/route.ts TakeoverConversationSchema
node scripts/add-validation-to-endpoint.js src/app/api/conversations/givebacktoai/route.ts TakeoverConversationSchema

# Message endpoints
echo ""
echo "📝 Message Endpoints..."
node scripts/add-validation-to-endpoint.js src/app/api/messages/route.ts MessageSchema

# Notification endpoints
echo ""
echo "📝 Notification Endpoints..."
node scripts/add-validation-to-endpoint.js src/app/api/notifications/route.ts CreateNotificationSchema
node scripts/add-validation-to-endpoint.js src/app/api/notifications/subscribe/route.ts PushSubscriptionSchema

# Settings endpoints
echo ""
echo "📝 Settings Endpoints..."
node scripts/add-validation-to-endpoint.js src/app/api/settings/route.ts UpdateSettingsSchema
node scripts/add-validation-to-endpoint.js src/app/api/ai-instructions/route.ts UpdateAIInstructionsSchema
node scripts/add-validation-to-endpoint.js src/app/api/admin/settings/route.ts UpdateSettingsSchema

# Template endpoints
echo ""
echo "📝 Template Endpoints..."
node scripts/add-validation-to-endpoint.js src/app/api/templates/route.ts TemplateSchema
node scripts/add-validation-to-endpoint.js src/app/api/templates/[id]/route.ts UpdateTemplateSchema
node scripts/add-validation-to-endpoint.js src/app/api/canned-responses/route.ts CannedResponseSchema
node scripts/add-validation-to-endpoint.js src/app/api/canned-responses/[id]/route.ts UpdateCannedResponseSchema

# Remaining endpoints
echo ""
echo "📝 Remaining Endpoints..."
node scripts/add-validation-to-endpoint.js src/app/api/customers/bulk/route.ts BulkCustomerSchema

echo ""
echo "✅ Validation application complete!"
echo "   Review the changes and test endpoints"
