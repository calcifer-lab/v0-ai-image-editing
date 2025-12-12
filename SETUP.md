# AI Image Editor - Setup Guide

This guide will help you set up and run the AI Image Editing MVP.

## Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- OpenRouter API Key (用于图像分析 + AI Inpainting)

## Installation

1. **Install dependencies**

```bash
pnpm install
# or
npm install
```

2. **Configure Environment Variables**

The `.env.local` file has been created with your OpenRouter API key:

```env
# OpenRouter API Configuration
# 用于 GPT-4o-mini 图像分析 + Gemini 2.5 Flash Image inpainting
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional: Site URL for OpenRouter referrer
SITE_URL=http://localhost:3000
```

**Note**: 只需要一个 OpenRouter API Key 即可使用所有功能！

## Running the Application

### Development Mode

```bash
pnpm dev
# or
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
pnpm build
pnpm start
```

## Features Implemented

### ✅ Core Functionality

1. **Dual Image Upload**
   - Upload Element Image (A) - source of reference elements
   - Upload Base Image (B) - image to be edited

2. **AI Image Analysis** (using GPT-4o-mini)
   - Automatically analyzes the element image when uploaded
   - Extracts description of objects, colors, materials, and features
   - Uses analysis as default prompt for inpainting

3. **Interactive Canvas Editor**
   - Brush tool: Paint selection mask
   - Eraser tool: Remove selection
   - Adjustable brush size (5-100px)
   - Undo/Redo history
   - Clear mask
   - Visual feedback with blue overlay on selected regions

4. **AI Inpainting** (via OpenRouter Gemini 2.5 Flash Image)
   - Replace selected regions with AI-generated content
   - Reference-based generation using element image
   - Configurable parameters:
     - Custom prompt (optional, defaults to AI analysis)
     - Generation strength (0.1-1.0)
     - Guidance scale (1-20)

5. **Result Comparison**
   - Side-by-side view
   - Interactive slider comparison
   - Download result image

6. **Error Handling & Status**
   - Real-time processing status
   - Error messages display
   - Loading states throughout the workflow

## Architecture

### Frontend (Next.js 16 + React 19)

- **App Router** structure
- **TypeScript** for type safety
- **Tailwind CSS** + shadcn/ui components
- **Canvas API** for mask editing

### Backend (Next.js API Routes)

#### `/api/analyze-image`
- Uses OpenRouter GPT-4o-mini vision model
- Analyzes uploaded images for reference features
- Returns detailed description for inpainting prompt

#### `/api/inpaint`
- Integrates with OpenRouter Gemini 2.5 Flash Image model
- Accepts: base image, mask, reference image, prompt, options
- Returns: AI-generated result image
- Falls back to mock mode without API key

#### `/api/post-process` (Optional)
- Edge blending using sharp library
- Smooths transitions between inpainted and original regions

### Key Libraries

- **OpenRouter** - Vision AI for image analysis + Gemini 2.5 Flash Image for inpainting
- **sharp** - Server-side image processing
- **Konva.js** (planned) - Advanced canvas manipulation

## Workflow

1. **Upload Step**
   - User uploads element image (A) and base image (B)
   - GPT-4o-mini automatically analyzes element image
   - System moves to edit step

2. **Edit Step**
   - User draws mask on base image using brush/eraser tools
   - AI analysis shown in control panel
   - User can override with custom prompt
   - Adjust generation parameters

3. **Processing**
   - Send base image + mask + element image to inpainting API
   - Show real-time status updates
   - Handle errors gracefully

4. **Result Step**
   - Display original vs. AI-edited comparison
   - Side-by-side and slider views
   - Download or re-edit options

## API Keys Setup

### OpenRouter (一个 Key 搞定全部！)

Your OpenRouter API key provides:

**1. 图像分析 (GPT-4o-mini)**
- Vision model for analyzing reference images
- ~$0.00015 per image analysis

**2. AI Inpainting (Gemini 2.5 Flash Image)**
- State-of-the-art image generation model
- Supports image editing and inpainting
- ~$0.30/M input tokens, $2.50/M output tokens

#### 获取 API Key

1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Go to API Keys
3. Create a new key
4. Add to `.env.local`:
   ```
   OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
   ```

## Troubleshooting

### Mock Mode Active

If you see "mock-inpainting" in the result metadata, it means:
- OpenRouter API key is not configured
- The app is returning the original image as a placeholder
- Add your OpenRouter API key to enable real AI inpainting

### Image Analysis or Inpainting Fails

Check:
- OpenRouter API key is correct in `.env.local`
- API key has sufficient credits
- Image is valid base64 format
- Image size is not too large (keep under 10MB)

### Build Errors with Sharp

Sharp requires native bindings. If you encounter build errors:

```bash
# Remove node_modules and reinstall
rm -rf node_modules
pnpm install

# Or use npm
npm rebuild sharp
```

## Next Steps for Enhancement

1. **Implement Rectangle/Circle selection tools**
2. **Add batch processing capability**
3. **Implement zoom/pan on canvas**
4. **Add multiple mask layers**
5. **Save/load projects**
6. **Add more inpainting models**
7. **Implement user authentication**
8. **Add image history/versions**

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

Ensure:
- Node.js 18+ runtime
- Environment variables configured
- Build command: `pnpm build`
- Start command: `pnpm start`

## Support

For issues or questions:
- Check the console for detailed error logs
- Verify API keys are correctly set
- Ensure images are under 10MB
- Check API credit balances

---

Built with ❤️ using Next.js, React, and AI APIs
