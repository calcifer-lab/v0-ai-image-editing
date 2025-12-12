# Testing Guide

This guide will help you test the AI Image Editor functionality.

## Pre-Testing Checklist

- [ ] Dependencies installed (`pnpm install`)
- [ ] `.env.local` file created with API keys
- [ ] Development server running (`pnpm dev`)

## Test Cases

### 1. Image Upload Flow

**Test**: Basic image upload
- Navigate to [http://localhost:3000](http://localhost:3000)
- You should see "Upload Your Images" screen
- Try uploading images via:
  - Drag and drop
  - Click to browse

**Expected Result**:
- Images display in preview cards
- "Continue to Editor" button enables when both images uploaded
- Green checkmark appears on uploaded images

**Test**: Image validation
- Try uploading non-image files
- Try uploading very large files (>10MB)

**Expected Result**:
- Only image files are accepted
- Large files should be handled gracefully

---

### 2. AI Image Analysis

**Test**: Automatic analysis
- Upload an element image (image A)
- Upload a base image (image B)
- Click "Continue to Editor"

**Expected Result**:
- Blue loading indicator appears: "Analyzing element image with AI..."
- After 2-5 seconds, green success box shows: "AI Analysis: [description]"
- Analysis should describe objects, colors, materials in the element image

**Troubleshooting**:
- If analysis fails, check console for OpenRouter API errors
- Verify OPENROUTER_API_KEY in `.env.local`
- Check network tab for API response

---

### 3. Canvas Mask Editor

**Test**: Brush tool
- Select "Brush" tab
- Draw on the base image
- Adjust brush size slider

**Expected Result**:
- Blue overlay appears where you draw
- Brush size changes affect drawing width
- Drawing is smooth and responsive

**Test**: Eraser tool
- Draw some areas with brush
- Switch to "Eraser" tab
- Erase parts of the drawn mask

**Expected Result**:
- Blue overlay is removed where you erase
- Eraser size is adjustable

**Test**: Undo/Redo
- Draw several strokes
- Click Undo button
- Click Redo button

**Expected Result**:
- Undo removes last stroke
- Redo restores it
- History tracking works correctly

**Test**: Clear mask
- Draw complex mask
- Click Clear (trash icon)

**Expected Result**:
- Entire mask is cleared
- Canvas shows only base image

---

### 4. AI Inpainting (Mock Mode)

**Test**: Generate without Replicate API key
- Draw a mask on the canvas
- Optionally add a custom prompt
- Click "Generate" button

**Expected Result**:
- Button shows spinning loader
- Status updates: "Preparing images..." → "Sending request..." → "Processing complete..."
- After ~2 seconds, result view appears
- Result image is the same as base image (mock mode)
- Metadata shows `"model": "mock-inpainting"`

---

### 5. AI Inpainting (Production Mode)

**Prerequisites**:
- Replicate API key added to `.env.local`
- Restart dev server after adding key

**Test**: Real AI generation
- Draw a mask on the canvas
- The AI analysis should populate the prompt automatically
- Click "Generate" button

**Expected Result**:
- Processing takes 30-120 seconds
- Status updates throughout
- Result shows AI-generated content in masked region
- Metadata shows `"model": "sdxl-inpainting"`

**Test**: Custom prompt override
- Draw a mask
- Enter custom prompt: "a blue insulated cabin glove"
- Click "Generate"

**Expected Result**:
- Custom prompt is used instead of AI analysis
- Result reflects the custom prompt

---

### 6. Result Comparison

**Test**: Side-by-side view
- After generation completes
- Should land on "Side by Side" tab by default

**Expected Result**:
- Original image on left
- AI-edited image on right
- Both images clearly labeled

**Test**: Slider comparison
- Click "Slider" tab
- Drag the slider left and right

**Expected Result**:
- Slider reveals original vs. result
- Smooth dragging interaction
- Handle shows arrows icon

**Test**: Download
- Click "Download" button

**Expected Result**:
- Image downloads as PNG
- Filename: "ai-edited-image.png"
- Downloaded image matches result displayed

---

### 7. Error Handling

**Test**: Missing mask
- Upload images and go to edit step
- Don't draw any mask
- Try to click "Generate"

**Expected Result**:
- Button is disabled
- Message: "Select a region on the canvas to continue"

**Test**: API error simulation
- Temporarily invalidate OPENROUTER_API_KEY in `.env.local`
- Restart dev server
- Upload images

**Expected Result**:
- Red error box appears
- Error message is displayed clearly
- App doesn't crash

**Test**: Network error
- Disconnect internet
- Try to generate

**Expected Result**:
- Error message appears
- User can retry after reconnecting

---

### 8. Complete Workflow

**Test**: End-to-end happy path
1. Upload element image (e.g., glove photo)
2. Upload base image (e.g., person wearing different glove)
3. Wait for AI analysis
4. Review analysis result
5. Draw mask over the glove area on base image
6. Optionally modify prompt
7. Click "Generate"
8. Wait for processing
9. Compare results in slider view
10. Download result

**Expected Result**:
- Smooth flow with no errors
- Clear status updates at each step
- Final result shows inpainted content

---

## Console Logging

During testing, check browser console for:

```
[AI Editor] Images uploaded, analyzing element image...
[AI Editor] Image analysis complete: [description]
[AI Editor] Processing complete in X ms
```

These logs help track the flow and debug issues.

---

## Performance Benchmarks

**Expected Performance**:
- Image upload: < 1 second
- AI analysis: 2-5 seconds
- Mock inpainting: 2 seconds
- Real inpainting: 30-120 seconds (depends on steps/size)

---

## Common Issues & Solutions

### Issue: "OpenRouter API key not configured"
**Solution**:
- Check `.env.local` file exists
- Verify OPENROUTER_API_KEY is set correctly
- Restart dev server

### Issue: "Replicate API error"
**Solution**:
- Verify REPLICATE_API_KEY is valid
- Check Replicate account has sufficient credits
- Ensure API key has correct permissions

### Issue: Analysis fails silently
**Solution**:
- Open browser DevTools → Network tab
- Look for failed `/api/analyze-image` request
- Check response error message

### Issue: Canvas not responding
**Solution**:
- Check if images loaded correctly
- Verify base image is valid format
- Try refreshing the page

### Issue: Result is just black/white
**Solution**:
- Verify mask was created properly
- Check mask has white regions (selected areas)
- Try drawing a clearer, larger mask

---

## Reporting Bugs

When reporting issues, include:
1. Browser and version
2. Console error messages
3. Network tab errors (if API-related)
4. Steps to reproduce
5. Expected vs actual behavior

---

## Next Steps After Testing

Once basic testing passes:
1. Test with various image types (PNG, JPG, different sizes)
2. Test edge cases (very small/large masks)
3. Test with different prompts
4. Test parameter variations (strength, guidance)
5. Performance testing with large images

---

**Happy Testing! 🎨**
