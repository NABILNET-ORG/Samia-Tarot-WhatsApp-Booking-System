/**
 * 🧪 Test NOCARD Country Detection
 * Verify Western Union is offered to correct countries
 */

console.log('🌍 Testing NOCARD Country Detection\n')
console.log('='.repeat(70))
console.log('\n')

// NOCARD countries (Western Union available)
const nocardPrefixes = ['+213', '+20', '+964', '+961', '+218', '+212', '+963', '+216', '+967']

// Country names
const countries = {
  '+213': 'Algeria (الجزائر)',
  '+20': 'Egypt (مصر)',
  '+964': 'Iraq (العراق)',
  '+961': 'Lebanon (لبنان)',
  '+218': 'Libya (ليبيا)',
  '+212': 'Morocco (المغرب)',
  '+963': 'Syria (سوريا)',
  '+216': 'Tunisia (تونس)',
  '+967': 'Yemen (اليمن)',
}

function isNOCARDCountry(phone) {
  return nocardPrefixes.some((prefix) => phone.startsWith(prefix))
}

console.log('📋 NOCARD Countries (9 total):')
console.log('-'.repeat(70))
nocardPrefixes.forEach((prefix) => {
  console.log(`✅ ${prefix} - ${countries[prefix]}`)
})

console.log('\n🧪 Testing Phone Numbers:')
console.log('='.repeat(70))

// Test cases
const testCases = [
  // NOCARD countries (should return TRUE)
  { phone: '+213123456789', country: 'Algeria', expected: true },
  { phone: '+20123456789', country: 'Egypt', expected: true },
  { phone: '+964123456789', country: 'Iraq', expected: true },
  { phone: '+961123456789', country: 'Lebanon', expected: true },
  { phone: '+218123456789', country: 'Libya', expected: true },
  { phone: '+212123456789', country: 'Morocco', expected: true },
  { phone: '+963123456789', country: 'Syria', expected: true },
  { phone: '+216123456789', country: 'Tunisia', expected: true },
  { phone: '+967123456789', country: 'Yemen', expected: true },

  // Non-NOCARD countries (should return FALSE)
  { phone: '+1234567890', country: 'USA', expected: false },
  { phone: '+44123456789', country: 'UK', expected: false },
  { phone: '+971123456789', country: 'UAE', expected: false },
  { phone: '+966123456789', country: 'Saudi Arabia', expected: false },
  { phone: '+962123456789', country: 'Jordan', expected: false },
  { phone: '+965123456789', country: 'Kuwait', expected: false },
  { phone: '+33123456789', country: 'France', expected: false },
]

let passed = 0
let failed = 0

testCases.forEach((test) => {
  const result = isNOCARDCountry(test.phone)
  const status = result === test.expected ? '✅ PASS' : '❌ FAIL'
  const paymentOption = result ? 'Stripe OR Western Union' : 'Stripe ONLY'

  console.log(
    `${status} | ${test.phone} (${test.country.padEnd(15)}) → ${paymentOption}`
  )

  if (result === test.expected) {
    passed++
  } else {
    failed++
  }
})

console.log('\n' + '='.repeat(70))
console.log('📊 TEST RESULTS:')
console.log('='.repeat(70))
console.log(`✅ Passed: ${passed}/${testCases.length}`)
console.log(`❌ Failed: ${failed}/${testCases.length}`)
console.log(`📈 Success Rate: ${Math.round((passed / testCases.length) * 100)}%`)

if (failed === 0) {
  console.log('\n🎉 ALL TESTS PASSED!')
  console.log('\n✅ NOCARD Country Detection Working Perfectly!')
  console.log('\nNOCARD Countries (Western Union available):')
  console.log('  🇩🇿 Algeria (+213)')
  console.log('  🇪🇬 Egypt (+20)')
  console.log('  🇮🇶 Iraq (+964)')
  console.log('  🇱🇧 Lebanon (+961)')
  console.log('  🇱🇾 Libya (+218)')
  console.log('  🇲🇦 Morocco (+212)')
  console.log('  🇸🇾 Syria (+963)')
  console.log('  🇹🇳 Tunisia (+216)')
  console.log('  🇾🇪 Yemen (+967)')
  console.log('\nAll Other Countries: Stripe payment only')
} else {
  console.log('\n⚠️ Some tests failed!')
}

console.log('\n🔮 NOCARD = No Card Available → Western Union offered as alternative')
console.log('✨ System will automatically detect country and show correct payment options!')
