#!/usr/bin/env node

/**
 * Environment Configuration Checker
 * Validates that all required API keys and configurations are set
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Checking environment configuration...\n')

const envPath = path.join(__dirname, '..', '.env.local')
const envExists = fs.existsSync(envPath)

if (!envExists) {
  console.error('❌ .env.local file not found!')
  console.log('\n📝 Please create .env.local with the following content:')
  console.log(`
OPENROUTER_API_KEY=your_openrouter_key
REPLICATE_API_KEY=your_replicate_key
`)
  process.exit(1)
}

console.log('✅ .env.local file exists\n')

// Read and parse env file
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const trimmed = line.trim()
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=')
    envVars[key] = valueParts.join('=')
  }
})

// Check required keys
let allGood = true

// OpenRouter (required)
if (!envVars.OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY is not set')
  allGood = false
} else if (envVars.OPENROUTER_API_KEY === 'your_openrouter_key') {
  console.error('❌ OPENROUTER_API_KEY is set to placeholder value')
  allGood = false
} else if (envVars.OPENROUTER_API_KEY.startsWith('sk-or-v1-')) {
  console.log('✅ OPENROUTER_API_KEY is configured')
  console.log(`   Key: ${envVars.OPENROUTER_API_KEY.substring(0, 20)}...`)
} else {
  console.warn('⚠️  OPENROUTER_API_KEY format looks unusual')
  console.log(`   Key: ${envVars.OPENROUTER_API_KEY.substring(0, 20)}...`)
}

console.log('')

// Replicate (optional but recommended)
if (!envVars.REPLICATE_API_KEY) {
  console.warn('⚠️  REPLICATE_API_KEY is not set')
  console.log('   📝 Note: App will run in MOCK mode (returns original image)')
  console.log('   To enable real AI inpainting, get a key from https://replicate.com')
} else if (envVars.REPLICATE_API_KEY === 'your_replicate_api_key_here') {
  console.warn('⚠️  REPLICATE_API_KEY is set to placeholder value')
  console.log('   📝 Note: App will run in MOCK mode (returns original image)')
} else if (envVars.REPLICATE_API_KEY.startsWith('r8_')) {
  console.log('✅ REPLICATE_API_KEY is configured')
  console.log(`   Key: ${envVars.REPLICATE_API_KEY.substring(0, 15)}...`)
} else {
  console.warn('⚠️  REPLICATE_API_KEY format looks unusual')
  console.log(`   Key: ${envVars.REPLICATE_API_KEY.substring(0, 15)}...`)
}

console.log('')

if (allGood) {
  console.log('🎉 Configuration looks good!')
  console.log('\n📚 Next steps:')
  console.log('   1. Run: pnpm install (if not already done)')
  console.log('   2. Run: pnpm dev')
  console.log('   3. Open: http://localhost:3000')
  console.log('\n📖 See SETUP.md and TESTING.md for more details')
} else {
  console.log('❌ Please fix the configuration issues above')
  process.exit(1)
}
