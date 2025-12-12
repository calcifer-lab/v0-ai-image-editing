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
# OpenRouter API Key (用于图像分析 + AI Inpainting)
OPENROUTER_API_KEY=sk-or-v1-your_key_here

# Optional: Site URL
SITE_URL=http://localhost:3000
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

// OpenRouter (required - for both image analysis and inpainting)
if (!envVars.OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY is not set')
  console.log('   📝 Get your key from https://openrouter.ai')
  allGood = false
} else if (envVars.OPENROUTER_API_KEY === 'your_openrouter_key' || 
           envVars.OPENROUTER_API_KEY === 'sk-or-v1-your_key_here') {
  console.error('❌ OPENROUTER_API_KEY is set to placeholder value')
  console.log('   📝 Get your key from https://openrouter.ai')
  allGood = false
} else if (envVars.OPENROUTER_API_KEY.startsWith('sk-or-v1-')) {
  console.log('✅ OPENROUTER_API_KEY is configured')
  console.log(`   Key: ${envVars.OPENROUTER_API_KEY.substring(0, 20)}...`)
  console.log('   📌 Used for: Image Analysis (GPT-4o-mini) + AI Inpainting (Gemini 2.5 Flash Image)')
} else {
  console.warn('⚠️  OPENROUTER_API_KEY format looks unusual (expected sk-or-v1-...)')
  console.log(`   Key: ${envVars.OPENROUTER_API_KEY.substring(0, 20)}...`)
}

console.log('')

// Site URL (optional)
if (envVars.SITE_URL) {
  console.log(`✅ SITE_URL is set to: ${envVars.SITE_URL}`)
} else {
  console.log('ℹ️  SITE_URL not set (defaults to http://localhost:3000)')
}

console.log('')

if (allGood) {
  console.log('🎉 Configuration looks good!')
  console.log('\n📚 Next steps:')
  console.log('   1. Run: pnpm install (if not already done)')
  console.log('   2. Run: pnpm dev')
  console.log('   3. Open: http://localhost:3000')
  console.log('\n📖 See SETUP.md and TESTING.md for more details')
  console.log('\n💡 Tip: 只需要一个 OpenRouter API Key 即可使用全部功能！')
} else {
  console.log('❌ Please fix the configuration issues above')
  process.exit(1)
}
