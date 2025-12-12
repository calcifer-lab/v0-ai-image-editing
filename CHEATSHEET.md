# Quick Reference Cheatsheet

## 🚀 Common Commands

```bash
# First time setup
pnpm install
pnpm check-env

# Development
pnpm dev              # Start dev server at http://localhost:3000
pnpm build            # Build for production
pnpm start            # Start production server

# Utilities
pnpm check-env        # Verify API keys configuration
pnpm lint             # Run linter
```

## 🔑 Environment Variables

```env
# Required for AI analysis
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional for production inpainting (without it: mock mode)
REPLICATE_API_KEY=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 📡 API Endpoints

### Analyze Image
```http
POST /api/analyze-image
Content-Type: application/json

{
  "image": "data:image/png;base64,...",
  "prompt": "Optional custom analysis prompt"
}
```

### Inpaint
```http
POST /api/inpaint
Content-Type: application/json

{
  "base_image": "data:image/png;base64,...",
  "mask_image": "data:image/png;base64,...",
  "reference_image": "data:image/png;base64,...",
  "prompt": "Description of desired result",
  "options": {
    "strength": 0.9,
    "steps": 30,
    "guidance_scale": 7.5
  }
}
```

### Post-Process
```http
POST /api/post-process
Content-Type: application/json

{
  "result_image": "data:image/png;base64,...",
  "base_image": "data:image/png;base64,...",
  "mask_image": "data:image/png;base64,...",
  "options": {
    "blend_edges": true,
    "blur_radius": 5
  }
}
```

## 🎨 Component Props Quick Reference

### ImageEditor
```typescript
// Main component - no props (self-contained)
<ImageEditor />
```

### ImageUploadSection
```typescript
<ImageUploadSection
  onImagesUploaded={(elementImg, baseImg) => void}
/>
```

### CanvasEditor
```typescript
<CanvasEditor
  elementImage={string}
  baseImage={string}
  onMaskCreated={(mask: MaskData) => void}
/>
```

### ControlPanel
```typescript
<ControlPanel
  params={EditParams}
  onParamsChange={(params) => void}
  onProcess={() => void}
  isProcessing={boolean}
  canProcess={boolean}
  processingStatus={string}
  error={string | null}
  imageAnalysis={string | null}
  isAnalyzing={boolean}
/>
```

### ResultsView
```typescript
<ResultsView
  originalImage={string}
  resultImage={string}
  onEdit={() => void}
  onReset={() => void}
/>
```

## 🔧 Image Utilities

```typescript
import {
  loadImage,
  getImageDimensions,
  resizeImage,
  fileToDataUrl,
  downloadDataUrl,
  smoothMaskEdges,
  compressImage
} from '@/lib/image-utils'

// Load image
const img = await loadImage(dataUrl)

// Get dimensions
const { width, height } = await getImageDimensions(dataUrl)

// Resize
const resized = await resizeImage(dataUrl, 1024, 1024)

// Convert file
const dataUrl = await fileToDataUrl(file)

// Download
downloadDataUrl(dataUrl, 'result.png')

// Smooth edges
const smoothed = await smoothMaskEdges(maskDataUrl, 5)

// Compress
const compressed = await compressImage(dataUrl, 0.8)
```

## 🎯 Workflow States

```typescript
type EditorStep = "upload" | "edit" | "result"

// State transitions
"upload" → "edit"   // After both images uploaded & analyzed
"edit" → "result"   // After successful generation
"result" → "edit"   // Click "Edit Again"
"result" → "upload" // Click "Start New"
```

## 🖌️ Canvas Tools

```typescript
type Tool = "brush" | "eraser" | "rectangle" | "circle"

// Currently active tools
- "brush"    ✅ Draw selection
- "eraser"   ✅ Remove selection
- "rectangle" ⚠️ Reserved (disabled)
- "circle"   ⚠️ Reserved (disabled)
```

## 📊 Generation Parameters

```typescript
interface EditParams {
  prompt: string              // Description (auto-filled from AI analysis)
  strength: number            // 0.1 - 1.0 (creativity level)
  guidance: number            // 1 - 20 (adherence to prompt)
  preserveStructure: boolean  // Maintain composition
}

// Recommended ranges
strength: 0.7 - 0.9   // Good balance
guidance: 7 - 10      // Follows prompt well
```

## 🎨 Mask Format

```typescript
interface MaskData {
  dataUrl: string              // Base64 black/white image
  coordinates: {
    x: number                  // Bounding box top-left X
    y: number                  // Bounding box top-left Y
    width: number              // Bounding box width
    height: number             // Bounding box height
  }
}

// Mask rules
- White pixels (255,255,255) = Selected region
- Black pixels (0,0,0) = Unselected region
```

## 🔍 Debugging

### Browser Console Logs
```javascript
// Look for these patterns
[AI Editor] Images uploaded, analyzing element image...
[AI Editor] Image analysis complete: [description]
[AI Editor] Processing complete in X ms
```

### Check API Responses
```javascript
// Network tab filters
/api/analyze-image
/api/inpaint
/api/post-process
```

### Common Error Patterns
```
"OpenRouter API key not configured"
→ Check .env.local, restart server

"Replicate API error"
→ Verify API key, check credits

"Invalid image format"
→ Ensure base64 data URL format

"No output image from model"
→ Check Replicate model status
```

## 📈 Performance Benchmarks

```
Image upload:        < 1s
AI analysis:         2-5s
Mock inpainting:     2s
Real inpainting:     30-120s (depends on complexity)

Max image size:      10MB
Recommended size:    < 2MB
Max dimensions:      1024x1024 (for faster processing)
```

## 💰 API Costs (Approximate)

```
OpenRouter (GPT-4o-mini):
- Image analysis: ~$0.00015 per image
- Very affordable for frequent use

Replicate (SDXL Inpainting):
- Generation: ~$0.01-0.05 per image
- Depends on: steps, size, complexity

Typical workflow cost:
- Analysis + Generation: ~$0.02-0.10
```

## 🔐 Security Checklist

```
✅ API keys in .env.local (never commit)
✅ .env.local in .gitignore
✅ Keys only used server-side
✅ No keys exposed to client
✅ Input validation on all uploads
✅ File size limits enforced
```

## 📁 Important File Paths

```
Configuration:
  .env.local                    # API keys
  package.json                  # Dependencies
  tsconfig.json                 # TypeScript config

Backend:
  app/api/analyze-image/route.ts
  app/api/inpaint/route.ts
  app/api/post-process/route.ts

Frontend:
  components/image-editor.tsx
  components/canvas-editor.tsx
  components/control-panel.tsx

Utils:
  lib/image-utils.ts

Scripts:
  scripts/check-env.js

Docs:
  README.md
  QUICKSTART.md
  SETUP.md
  TESTING.md
```

## 🐛 Troubleshooting Quick Fixes

```bash
# API key issues
cat .env.local                  # Verify keys present
pnpm check-env                  # Run validator

# Dependency issues
rm -rf node_modules
pnpm install

# Sharp build issues
pnpm rebuild sharp

# Port already in use
# Kill process on port 3000
npx kill-port 3000
pnpm dev

# Cache issues
rm -rf .next
pnpm dev
```

## 🎓 Learning Resources

```
Next.js Docs:        https://nextjs.org/docs
React Docs:          https://react.dev
Tailwind CSS:        https://tailwindcss.com
shadcn/ui:           https://ui.shadcn.com

OpenRouter:          https://openrouter.ai/docs
Replicate:           https://replicate.com/docs
Sharp:               https://sharp.pixelplumbing.com
```

## 🎯 Quick Test Workflow

```bash
# 1. Setup
pnpm install
pnpm check-env

# 2. Start dev server
pnpm dev

# 3. Open browser
# Navigate to http://localhost:3000

# 4. Test flow
# - Upload 2 images
# - Wait for AI analysis
# - Draw mask
# - Click generate
# - View result
# - Download

# 5. Check console
# Should see success logs
```

---

**Need more details?** Check the full documentation:
- 📖 [QUICKSTART.md](./QUICKSTART.md) - Getting started
- 🔧 [SETUP.md](./SETUP.md) - Detailed setup
- 🧪 [TESTING.md](./TESTING.md) - Testing guide
- 📊 [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Full details
