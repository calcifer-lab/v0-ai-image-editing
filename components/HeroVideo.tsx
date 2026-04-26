'use client'

import { useEffect, useRef } from 'react'

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Video plays when entering viewport, pauses when leaving — saves bandwidth
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {
            // Autoplay blocked — silent, poster stays visible
          })
        } else {
          video.pause()
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl">
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        preload="auto"
        poster="/videos/hero-poster.jpg"
        className="w-full h-auto"
        aria-label="ReDiagram Fix demo: transplanting a correct element from one image into another"
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>
    </div>
  )
}
