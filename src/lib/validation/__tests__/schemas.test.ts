/**
 * Unit Tests for Zod Validation Schemas
 */

import {
  LoginSchema,
  CustomerSchema,
  UpdateCustomerSchema,
  ServiceSchema,
  BookingSchema,
  EmployeeSchema,
  MessageSchema,
  ConversationSchema,
  CreateNotificationSchema,
  UpdateSettingsSchema,
  BulkCustomerSchema,
  AdminProviderSchema,
  AnalyticsQuerySchema,
  SubscriptionCheckoutSchema,
} from '../schemas'

describe('Authentication Schemas', () => {
  describe('LoginSchema', () => {
    it('should validate correct login data', () => {
      const result = LoginSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123'
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = LoginSchema.safeParse({
        email: 'invalid-email',
        password: 'Password123'
      })
      expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
      const result = LoginSchema.safeParse({
        email: 'test@example.com',
        password: 'short'
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('Customer Schemas', () => {
  describe('CustomerSchema', () => {
    it('should validate correct customer data', () => {
      const result = CustomerSchema.safeParse({
        phone: '+961362086',
        name_english: 'John Doe',
        email: 'john@example.com',
        vip_status: false
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid phone', () => {
      const result = CustomerSchema.safeParse({
        phone: 'abc', // Non-numeric
        name_english: 'John Doe'
      })
      expect(result.success).toBe(false)
    })

    it('should allow optional fields', () => {
      const result = CustomerSchema.safeParse({
        phone: '+961362086'
      })
      expect(result.success).toBe(true)
    })
  })

  describe('BulkCustomerSchema', () => {
    it('should validate bulk delete', () => {
      const result = BulkCustomerSchema.safeParse({
        action: 'delete',
        customer_ids: ['550e8400-e29b-41d4-a716-446655440000']
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty customer_ids', () => {
      const result = BulkCustomerSchema.safeParse({
        action: 'delete',
        customer_ids: []
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('Booking Schemas', () => {
  describe('BookingSchema', () => {
    it('should validate correct booking data', () => {
      const result = BookingSchema.safeParse({
        customer_id: '550e8400-e29b-41d4-a716-446655440000',
        service_id: '550e8400-e29b-41d4-a716-446655440001',
        scheduled_at: new Date().toISOString(),
        status: 'pending',
        payment_status: 'pending'
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const result = BookingSchema.safeParse({
        customer_id: 'invalid-uuid',
        service_id: '550e8400-e29b-41d4-a716-446655440001',
        scheduled_at: new Date().toISOString()
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('Analytics Schemas', () => {
  describe('AnalyticsQuerySchema', () => {
    it('should validate date range query', () => {
      const result = AnalyticsQuerySchema.safeParse({
        start_date: '2025-01-01T00:00:00Z',
        end_date: '2025-12-31T23:59:59Z',
        period: 'month'
      })
      expect(result.success).toBe(true)
    })

    it('should allow empty query', () => {
      const result = AnalyticsQuerySchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })
})

describe('Subscription Schemas', () => {
  describe('SubscriptionCheckoutSchema', () => {
    it('should validate checkout data', () => {
      const result = SubscriptionCheckoutSchema.safeParse({
        priceId: 'price_123456',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      })
      expect(result.success).toBe(true)
    })

    it('should reject missing priceId', () => {
      const result = SubscriptionCheckoutSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })
})

describe('Admin Schemas', () => {
  describe('AdminProviderSchema', () => {
    it('should validate meta provider', () => {
      const result = AdminProviderSchema.safeParse({
        provider: 'meta'
      })
      expect(result.success).toBe(true)
    })

    it('should validate twilio provider', () => {
      const result = AdminProviderSchema.safeParse({
        provider: 'twilio'
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid provider', () => {
      const result = AdminProviderSchema.safeParse({
        provider: 'invalid'
      })
      expect(result.success).toBe(false)
    })
  })
})
