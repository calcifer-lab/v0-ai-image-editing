"use client"

import { useState, useRef } from "react"
import Image from "next/image"

const BA_SIZES = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"

export default function BeforeAfter({ before, after }: { before: string; after: string }) {
  const [sliderPos, setSliderPos] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPos(pct)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    handleMove(e.clientX)
    const onMove = (e: MouseEvent) => handleMove(e.clientX)
    const onUp = () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX)
  }

  return (
    <div
      ref={containerRef}
      className="ba-container"
      onMouseDown={handleMouseDown}
      onMouseMove={(e) => {
        // Only respond to mousemove if mouse is down
        if (e.buttons === 1) handleMove(e.clientX)
      }}
      onMouseLeave={(e) => {
        if (e.buttons === 1) handleMove(e.clientX)
      }}
      onTouchMove={handleTouchMove}
      style={{ cursor: "ew-resize", touchAction: "none" }}
    >
      {/* Before image (full, bottom layer) */}
      <Image
        src={before}
        alt="Before fix"
        width={1672}
        height={941}
        sizes={BA_SIZES}
        className="ba-img"
        draggable={false}
      />

      {/* After image (clipped, top layer) — slider left = show more of after */}
      <Image
        src={after}
        alt="After fix"
        width={1672}
        height={941}
        sizes={BA_SIZES}
        className="ba-img ba-before"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        draggable={false}
      />

      {/* Slider line */}
      <div className="ba-slider" style={{ left: `${sliderPos}%` }}>
        <div className="ba-handle">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" fill="white" stroke="#2B5CE6" strokeWidth="2"/>
            <path d="M6 10h8M10 6l-4 4 4 4" stroke="#2B5CE6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Labels */}
      <span className="ba-label ba-label-before">Before</span>
      <span className="ba-label ba-label-after">After</span>
    </div>
  )
}
