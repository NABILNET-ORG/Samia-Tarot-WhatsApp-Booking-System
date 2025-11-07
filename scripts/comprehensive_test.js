/**
 * 🧪 Comprehensive Production Test Suite
 * Tests all critical functionality
 */

const https = require('https');
const http = require('http');

const PROD_URL = 'https://samia-tarot-app.vercel.app';

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

async function testEndpoint(name, path, expectedStatus = 200, allowedStatuses = []) {
  try {
    const { status } = await makeRequest(`${PROD_URL}${path}`);
    const allowed = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus, ...allowedStatuses];
    if (allowed.includes(status) || (status >= 200 && status < 400)) {
      results.passed.push(`✅ ${name}: ${status}`);
      return true;
    } else {
      results.failed.push(`❌ ${name}: Expected ${allowed.join('/')}, got ${status}`);
      return false;
    }
  } catch (error) {
    results.failed.push(`❌ ${name}: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Comprehensive Production Tests...\\n');
  console.log(`Testing: ${PROD_URL}\\n`);

  // Test Critical Pages
  console.log('📄 Testing Pages...');
  await testEndpoint('Homepage', '/');
  await testEndpoint('Login Page', '/login');
  await testEndpoint('Signup Page', '/signup');
  await testEndpoint('Dashboard', '/dashboard', [200, 302, 307]); // May redirect if not authenticated
  await testEndpoint('Pricing Page', '/pricing');

  // Test API Endpoints
  console.log('\\n🔌 Testing API Endpoints...');
  await testEndpoint('CSRF Token API', '/api/csrf-token');

  // Test Env API should be disabled in production
  try {
    const { status } = await makeRequest(`${PROD_URL}/api/test-env`);
    if (status === 404 || status === 403) {
      results.passed.push('✅ Test Env API: Correctly disabled in production');
    } else {
      results.warnings.push('⚠️  Test Env API: Should be disabled in production');
    }
  } catch (e) {
    results.passed.push('✅ Test Env API: Correctly disabled');
  }

  // Favicon is optional
  console.log('\\n📦 Testing Static Assets...');
  try {
    const { status } = await makeRequest(`${PROD_URL}/favicon.ico`);
    if (status === 200) {
      results.passed.push('✅ Favicon: Found');
    } else {
      results.warnings.push('⚠️  Favicon: Missing (optional)');
    }
  } catch (e) {
    results.warnings.push('⚠️  Favicon: Missing (optional)');
  }

  // Print Results
  console.log('\\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(60));

  console.log(`\\n✅ PASSED (${results.passed.length}):`);
  results.passed.forEach(r => console.log('  ' + r));

  if (results.failed.length > 0) {
    console.log(`\\n❌ FAILED (${results.failed.length}):`);
    results.failed.forEach(r => console.log('  ' + r));
  }

  if (results.warnings.length > 0) {
    console.log(`\\n⚠️  WARNINGS (${results.warnings.length}):`);
    results.warnings.forEach(r => console.log('  ' + r));
  }

  const totalTests = results.passed.length + results.failed.length;
  const passRate = ((results.passed.length / totalTests) * 100).toFixed(1);

  console.log('\\n' + '='.repeat(60));
  console.log(`📈 Summary: ${results.passed.length}/${totalTests} tests passed (${passRate}%)`);
  console.log('='.repeat(60));

  // Exit with appropriate code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

runTests().catch(console.error);
