"use client"

import Link from "next/link"
import type { AnchorHTMLAttributes, ReactNode } from "react"
import { track } from "@/lib/analytics"

type TrackedLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  event: string
  children: ReactNode
}

export function TrackedLink({ href, event, children, onClick, ...props }: TrackedLinkProps) {
  return (
    <Link
      href={href}
      onClick={(clickEvent) => {
        track(event)
        onClick?.(clickEvent)
      }}
      {...props}
    >
      {children}
    </Link>
  )
}
