# AI Image Editor MVP

An intelligent image editing tool that uses AI to analyze and replace image regions with content from reference images.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/calcifer-labs-projects/v0-ai-image-editing)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/fSixzbUjkqX)

## 🚀 Features

### AI-Powered Workflow

1. **Dual Image Upload**
   - Upload an element image (A) as reference
   - Upload a base image (B) to edit

2. **Automatic AI Analysis**
   - GPT-4o-mini analyzes element image automatically
   - Extracts object descriptions, colors, materials, and visual features
   - Generates intelligent prompts for inpainting

3. **Interactive Mask Editor**
   - Brush and eraser tools with adjustable size
   - Visual feedback with blue overlay
   - Undo/redo support
   - Clear mask functionality

4. **AI Inpainting**
   - SDXL-based inpainting via Replicate API
   - Reference-guided generation using element image
   - Customizable strength and guidance parameters
   - Real-time status updates

5. **Result Comparison**
   - Side-by-side view
   - Interactive slider comparison
   - One-click download

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui
- **AI Models**:
  - OpenRouter GPT-4o-mini (vision analysis)
  - Replicate SDXL Inpainting
- **Image Processing**: Canvas API, Sharp

## 📦 Quick Start

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Open http://localhost:3000
```

See [SETUP.md](./SETUP.md) for detailed setup instructions.

## 🔑 API Configuration

Create a `.env.local` file:

```env
# Required: OpenRouter for AI analysis
OPENROUTER_API_KEY=your_openrouter_key

# Required for production: Replicate for inpainting
REPLICATE_API_KEY=your_replicate_key
```

**Note**: The OpenRouter key is already configured. You need to add a Replicate API key for production inpainting (without it, the app runs in mock mode).

## 📖 How to Use

1. **Upload Images**
   - Upload element image (A) - the source of reference elements
   - Upload base image (B) - the image you want to edit

2. **Draw Mask**
   - Use brush tool to select regions to replace
   - Use eraser to refine selection
   - Adjust brush size as needed

3. **Configure & Generate**
   - Review AI analysis or add custom prompt
   - Adjust generation parameters
   - Click "Generate"

4. **Review & Download**
   - Compare original vs. result
   - Use slider for detailed comparison
   - Download your edited image

## 🏗️ Architecture

```
├── app/
│   ├── api/
│   │   ├── analyze-image/    # GPT-4o-mini vision analysis
│   │   ├── inpaint/           # SDXL inpainting
│   │   └── post-process/      # Edge blending (optional)
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── image-editor.tsx       # Main state management
│   ├── image-upload-section.tsx
│   ├── canvas-editor.tsx      # Mask drawing
│   ├── control-panel.tsx      # Parameters & status
│   └── results-view.tsx       # Comparison view
└── lib/
    └── image-utils.ts         # Image processing utilities
```

## 🎯 Workflow

```
Upload → AI Analysis → Edit Mask → Generate → Compare
```

## 🚧 Roadmap

- [ ] Rectangle/Circle selection tools
- [ ] Zoom and pan on canvas
- [ ] Multiple mask layers
- [ ] Batch processing
- [ ] Project save/load
- [ ] User authentication
- [ ] Version history

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

---

**Need help?** Check [SETUP.md](./SETUP.md) for troubleshooting and detailed documentation.
