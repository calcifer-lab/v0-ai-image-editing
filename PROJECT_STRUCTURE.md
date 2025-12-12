# Project Structure

## 📁 Directory Tree

```
v0-ai-image-editing-1/
├── 📄 Configuration Files
│   ├── .env.local                  # Environment variables (API keys)
│   ├── .gitignore                  # Git ignore rules
│   ├── package.json                # Dependencies and scripts
│   ├── pnpm-lock.yaml              # Dependency lock file
│   ├── tsconfig.json               # TypeScript configuration
│   ├── next.config.mjs             # Next.js configuration
│   ├── postcss.config.mjs          # PostCSS configuration
│   └── components.json             # shadcn/ui configuration
│
├── 📂 app/                         # Next.js App Router
│   ├── api/                        # API Routes (Backend)
│   │   ├── analyze-image/
│   │   │   └── route.ts            # 🔥 GPT-4o-mini image analysis
│   │   ├── inpaint/
│   │   │   └── route.ts            # 🔥 SDXL inpainting API
│   │   └── post-process/
│   │       └── route.ts            # 🔥 Image edge blending
│   │
│   ├── layout.tsx                  # Root layout with fonts & metadata
│   ├── page.tsx                    # Home page (renders ImageEditor)
│   └── globals.css                 # Global styles & theme variables
│
├── 📂 components/                  # React Components
│   ├── 🎨 Core Components
│   │   ├── image-editor.tsx        # 🔥 Main editor orchestrator
│   │   ├── image-upload-section.tsx # 🔥 Dual image upload UI
│   │   ├── canvas-editor.tsx       # 🔥 Mask drawing canvas
│   │   ├── control-panel.tsx       # 🔥 Parameters & AI analysis
│   │   └── results-view.tsx        # 🔥 Comparison & download
│   │
│   ├── 🧩 UI Components (shadcn/ui)
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── label.tsx
│   │       ├── slider.tsx
│   │       ├── switch.tsx
│   │       ├── tabs.tsx
│   │       └── textarea.tsx
│   │
│   └── theme-provider.tsx          # Theme context provider
│
├── 📂 lib/                         # Utilities
│   ├── utils.ts                    # General utilities (cn helper)
│   └── image-utils.ts              # 🔥 Image processing utilities
│
├── 📂 scripts/                     # Helper Scripts
│   └── check-env.js                # 🔥 Environment validator
│
├── 📂 public/                      # Static Assets
│   ├── icon.svg
│   ├── icon-light-32x32.png
│   ├── icon-dark-32x32.png
│   ├── apple-icon.png
│   └── placeholder images...
│
├── 📂 styles/                      # Additional Styles
│   └── globals.css                 # Base styles
│
└── 📚 Documentation
    ├── README.md                   # 🔥 Project overview
    ├── QUICKSTART.md               # 🔥 5-minute getting started
    ├── SETUP.md                    # 🔥 Detailed setup guide
    ├── TESTING.md                  # 🔥 Testing guide
    ├── IMPLEMENTATION_SUMMARY.md   # 🔥 Implementation details
    └── PROJECT_STRUCTURE.md        # 🔥 This file
```

## 🔥 Key Files Explained

### Backend API Routes

#### `/app/api/analyze-image/route.ts`
**Purpose**: AI-powered image analysis using GPT-4o-mini

**Functionality**:
- Receives base64 encoded image
- Calls OpenRouter GPT-4o-mini vision model
- Returns detailed object/feature description
- Used for automatic prompt generation

**API**:
```typescript
POST /api/analyze-image
Body: { image: string, prompt?: string }
Response: { analysis: string, meta: {...} }
```

#### `/app/api/inpaint/route.ts`
**Purpose**: AI inpainting using Replicate SDXL

**Functionality**:
- Receives base image, mask, reference image
- Validates inputs
- Calls Replicate SDXL Inpainting model
- Polls for completion
- Returns generated image
- Falls back to mock mode if no API key

**API**:
```typescript
POST /api/inpaint
Body: {
  base_image: string,
  mask_image: string,
  reference_image?: string,
  prompt: string,
  options?: { strength, steps, guidance_scale }
}
Response: { result_image: string, meta: {...} }
```

#### `/app/api/post-process/route.ts`
**Purpose**: Post-processing for edge blending

**Functionality**:
- Accepts result image, base image, mask
- Applies edge smoothing using Sharp
- Blends inpainted region with original
- Returns processed image

**API**:
```typescript
POST /api/post-process
Body: {
  result_image: string,
  base_image: string,
  mask_image: string,
  options?: { blend_edges, blur_radius }
}
Response: { processed_image: string, meta: {...} }
```

---

### Frontend Components

#### `/components/image-editor.tsx`
**Purpose**: Main application orchestrator

**Responsibilities**:
- State management (images, mask, params, results)
- Workflow step management (upload → edit → result)
- API integration (analyze, inpaint)
- Error handling
- Status updates

**State**:
```typescript
- step: "upload" | "edit" | "result"
- images: { elementImage, baseImage }
- mask: { dataUrl, coordinates }
- params: { prompt, strength, guidance, preserveStructure }
- resultImage: string
- imageAnalysis: string (from GPT-4o-mini)
- isProcessing, isAnalyzing
- error
```

#### `/components/image-upload-section.tsx`
**Purpose**: Dual image upload interface

**Features**:
- Drag & drop upload
- Click to browse
- Image preview
- Replace/delete uploaded images
- Validation (file type, size)
- Continue button (enabled when both uploaded)

#### `/components/canvas-editor.tsx`
**Purpose**: Interactive mask drawing canvas

**Features**:
- Brush tool (draw selection)
- Eraser tool (remove selection)
- Adjustable brush size (5-100px)
- Undo/Redo history
- Clear mask
- Blue overlay visualization
- Auto-calculate mask bounding box

**Technical**:
- Dual canvas architecture (display + mask)
- Black/white mask (white = selected)
- History stack management
- Real-time redraw

#### `/components/control-panel.tsx`
**Purpose**: Parameter configuration and status display

**Features**:
- AI analysis result display
- Loading states
- Error messages
- Prompt input (optional)
- Generation strength slider
- Guidance scale slider
- Preserve structure toggle
- Generate button with status

#### `/components/results-view.tsx`
**Purpose**: Result comparison and download

**Features**:
- Side-by-side comparison
- Interactive slider comparison
- Download button
- Edit again / Reset options

---

### Utilities

#### `/lib/image-utils.ts`
**Purpose**: Client-side image processing utilities

**Functions**:
```typescript
loadImage()           // Load image from data URL
getImageDimensions()  // Get width/height
resizeImage()         // Resize maintaining aspect ratio
resizeMaskToMatch()   // Ensure mask matches base size
isImageFile()         // Validate file type
isFileSizeValid()     // Validate file size
fileToDataUrl()       // Convert File to base64
downloadDataUrl()     // Download image
smoothMaskEdges()     // Blur mask edges
compressImage()       // Reduce file size
```

---

### Scripts

#### `/scripts/check-env.js`
**Purpose**: Validate environment configuration

**Functionality**:
- Check if `.env.local` exists
- Validate API keys format
- Warn about placeholder values
- Indicate mock mode vs production
- Display next steps

**Usage**:
```bash
pnpm check-env
```

---

### Configuration Files

#### `.env.local`
**Environment Variables**:
```env
OPENROUTER_API_KEY=sk-or-v1-...    # Required
REPLICATE_API_KEY=r8_...            # Optional (mock mode without)
```

#### `package.json`
**Key Scripts**:
```json
{
  "scripts": {
    "dev": "next dev",              // Development server
    "build": "next build",          // Production build
    "start": "next start",          // Production server
    "check-env": "...",             // Validate config
    "setup": "..."                  // Setup workflow
  }
}
```

#### `tsconfig.json`
**TypeScript Configuration**:
- Target: ES6
- Strict mode enabled
- Path alias: `@/*` → `./`

---

## 📊 Data Flow

### Upload to Result Flow

```
┌─────────────────┐
│  User uploads   │
│  images A & B   │
└────────┬────────┘
         │
         v
┌─────────────────────────┐
│  POST /api/analyze-     │
│  image (image A)        │
└────────┬────────────────┘
         │
         v
┌─────────────────────────┐
│  GPT-4o-mini returns    │
│  analysis description   │
└────────┬────────────────┘
         │
         v
┌─────────────────┐
│  User draws     │
│  mask on B      │
└────────┬────────┘
         │
         v
┌─────────────────────────┐
│  POST /api/inpaint      │
│  (B + mask + A +        │
│   prompt + options)     │
└────────┬────────────────┘
         │
         v
┌─────────────────────────┐
│  Replicate SDXL         │
│  processes (30-120s)    │
└────────┬────────────────┘
         │
         v
┌─────────────────────────┐
│  Result image returned  │
└────────┬────────────────┘
         │
         v
┌─────────────────┐
│  Display        │
│  comparison     │
└─────────────────┘
```

## 🎨 Component Hierarchy

```
<ImageEditor>                        # Main orchestrator
├── <StepIndicator />                # Progress indicator
├── <ImageUploadSection>             # Step 1: Upload
│   └── <UploadCard> × 2             # Element & Base
│
├── <div> Edit Step                  # Step 2: Edit
│   ├── <CanvasEditor>               # Left: Mask drawing
│   │   ├── <Tabs> Tool selection
│   │   ├── <Slider> Brush size
│   │   └── <canvas>                 # Drawing surface
│   │
│   └── <ControlPanel>               # Right: Parameters
│       ├── AI Analysis display
│       ├── <Textarea> Prompt
│       ├── <Slider> × 2 Strength/Guidance
│       ├── <Switch> Preserve structure
│       └── <Button> Generate
│
└── <ResultsView>                    # Step 3: Result
    ├── <Tabs> View mode
    │   ├── Side by side
    │   └── Slider comparison
    └── <Button> × 3 Download/Edit/Reset
```

## 🔄 State Management

### Global State (in ImageEditor)
```typescript
{
  // Core data
  step: EditorStep,
  images: ImageData,
  mask: MaskData,
  params: EditParams,
  resultImage: string,

  // AI analysis
  imageAnalysis: string,
  isAnalyzing: boolean,

  // Processing
  isProcessing: boolean,
  processingStatus: string,

  // Error handling
  error: string | null
}
```

### Local State (in components)
- **CanvasEditor**: history, historyIndex, isDrawing, tool, brushSize
- **ResultsView**: view mode, slider position
- **ImageUploadSection**: elementImage, baseImage (temporary)

## 🌐 API Integration Points

### OpenRouter
```typescript
Endpoint: https://openrouter.ai/api/v1/chat/completions
Model: openai/gpt-4o-mini
Auth: Bearer token
Input: Image (base64 or URL)
Output: Text analysis
```

### Replicate
```typescript
Endpoint: https://api.replicate.com/v1/predictions
Model: stability-ai/sdxl (inpainting)
Auth: Token
Input: { image, mask, prompt, parameters }
Output: Generated image URL
```

## 📦 Dependencies

### Core
- next: ^16.0.10
- react: ^19.2.0
- typescript: ^5

### UI
- @radix-ui/*: Various UI primitives
- tailwindcss: ^4.1.9
- lucide-react: ^0.454.0

### Image Processing
- sharp: ^0.33.5 (server-side)

### Utilities
- clsx, tailwind-merge: Class name utilities
- zod: Schema validation

## 🚀 Build Output

### Development
```
next dev
→ http://localhost:3000
→ Hot reload enabled
→ API routes at /api/*
```

### Production
```
next build
→ Optimized bundles
→ Static assets
→ Server-side routes
→ API routes
```

---

This structure provides a complete, production-ready AI image editing application with clear separation of concerns and extensible architecture.
