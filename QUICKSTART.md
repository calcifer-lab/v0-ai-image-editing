# Quick Start Guide

Get the AI Image Editor running in 5 minutes!

## 1. Prerequisites

- Node.js 18+ installed
- pnpm installed (or npm/yarn)

## 2. Installation

```bash
# Clone or navigate to the project directory
cd v0-ai-image-editing-1

# Install dependencies
pnpm install
```

## 3. Configuration

The `.env.local` file has already been created with your OpenRouter API key.

**For Mock Mode** (testing only):
- You're ready to go! The app will simulate AI processing.

**For Production Mode** (real AI inpainting):
1. Sign up at [Replicate.com](https://replicate.com)
2. Get your API token from Account → API Tokens
3. Open `.env.local` and update:
   ```env
   REPLICATE_API_KEY=r8_your_actual_key_here
   ```

## 4. Verify Configuration

```bash
# Check if everything is configured correctly
pnpm check-env
```

You should see:
```
✅ .env.local file exists
✅ OPENROUTER_API_KEY is configured
⚠️  REPLICATE_API_KEY is not set (or shows placeholder warning)
```

## 5. Run the App

```bash
# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## 6. Test the Workflow

### Step 1: Upload Images
- Drag & drop or click to upload:
  - **Element Image (A)**: An image containing the element you want to use as reference
  - **Base Image (B)**: The image you want to edit

Example:
- A: Photo of a blue glove
- B: Photo of a person wearing a different glove

### Step 2: Wait for AI Analysis
- The app will automatically analyze image A using GPT-4o-mini
- You'll see a green box with the analysis result
- This takes 2-5 seconds

### Step 3: Draw a Mask
- Use the **Brush** tool to select the area to replace on image B
- Paint over the region you want to edit
- The selected area will show in blue
- Adjust brush size as needed

### Step 4: Generate
- Review the AI analysis (or add custom prompt)
- Click **Generate** button
- Wait for processing (2 seconds in mock mode, 30-120s in production)

### Step 5: Compare & Download
- View side-by-side comparison
- Use slider for interactive comparison
- Click **Download** to save your result

## Mock Mode vs Production Mode

### Mock Mode (No Replicate Key)
- ✅ Tests the full UI workflow
- ✅ AI analysis works (uses GPT-4o-mini)
- ❌ Inpainting just returns original image
- ⚡ Fast (2 seconds)

### Production Mode (With Replicate Key)
- ✅ Full AI inpainting with SDXL
- ✅ Real content replacement
- ✅ Reference-guided generation
- 🐢 Slower (30-120 seconds)
- 💰 Costs ~$0.01-0.05 per generation

## Troubleshooting

### "OpenRouter API key not configured"
```bash
# Verify .env.local exists and has correct key
cat .env.local
# Restart dev server
pnpm dev
```

### Canvas not loading
- Check browser console for errors
- Try refreshing the page
- Ensure images are valid formats (JPG, PNG)

### Analysis fails
- Check OpenRouter API key is valid
- Verify you have API credits
- Check network connection

## Next Steps

Once the basic workflow works:

1. **Read Full Documentation**
   - [SETUP.md](./SETUP.md) - Detailed setup and architecture
   - [TESTING.md](./TESTING.md) - Comprehensive testing guide

2. **Try Different Images**
   - Test with various image types and sizes
   - Experiment with different prompts
   - Try different parameter settings

3. **Enable Production Mode**
   - Add Replicate API key
   - Test real AI inpainting
   - Compare results with different settings

4. **Customize & Extend**
   - Modify prompts for specific use cases
   - Adjust UI to your needs
   - Add custom features

## Support

Need help?
- Check console logs in browser DevTools
- Review error messages in the UI
- See [TESTING.md](./TESTING.md) for common issues

---

**Ready to create amazing AI-edited images! 🎨✨**
