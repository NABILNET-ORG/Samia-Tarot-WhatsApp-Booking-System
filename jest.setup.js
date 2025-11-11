// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.OPENAI_API_KEY = 'sk-test-key'
process.env.INTERNAL_API_KEY = 'test-internal-key'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.SESSION_SECRET = 'test-session-secret'
process.env.ENCRYPTION_MASTER_KEY = 'test-encryption-key'
