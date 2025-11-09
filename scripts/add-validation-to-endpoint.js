/**
 * Script to add Zod validation to API endpoints
 * Usage: node scripts/add-validation-to-endpoint.js <endpoint-path> <schema-name>
 */

const fs = require('fs')
const path = require('path')

const endpointPath = process.argv[2]
const schemaName = process.argv[3]

if (!endpointPath || !schemaName) {
  console.error('Usage: node scripts/add-validation-to-endpoint.js <endpoint-path> <schema-name>')
  console.error('Example: node scripts/add-validation-to-endpoint.js src/app/api/auth/reset-password/route.ts ResetPasswordSchema')
  process.exit(1)
}

const fullPath = path.join(process.cwd(), endpointPath)

if (!fs.existsSync(fullPath)) {
  console.error(`File not found: ${fullPath}`)
  process.exit(1)
}

let content = fs.readFileSync(fullPath, 'utf8')

// Check if already has the import
if (!content.includes(schemaName)) {
  // Add import after other imports
  const importLines = content.match(/^import .+ from .+$/gm) || []
  if (importLines.length > 0) {
    const lastImport = importLines[importLines.length - 1]
    const importStatement = `import { ${schemaName} } from '@/lib/validation/schemas'`
    content = content.replace(lastImport, `${lastImport}\n${importStatement}`)
  }
}

// Add validation code
const validationCode = `
    // Validate input with Zod
    const validation = ${schemaName}.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.format()
        },
        { status: 400 }
      )
    }

    const validatedData = validation.data
`

// Try to find where to insert validation
// Look for pattern: const body = await request.json()
if (content.includes('const body = await request.json()')) {
  // Check if validation already exists
  if (!content.includes('safeParse(body)')) {
    content = content.replace(
      /(const body = await request\.json\(\))/,
      `$1\n${validationCode}`
    )

    console.log(`✅ Added validation to ${endpointPath}`)
    console.log(`Schema: ${schemaName}`)

    fs.writeFileSync(fullPath, content)
  } else {
    console.log(`⏭️  Validation already exists in ${endpointPath}`)
  }
} else {
  console.log(`⚠️  Could not find 'const body = await request.json()' in ${endpointPath}`)
  console.log(`   Manual update required`)
}
