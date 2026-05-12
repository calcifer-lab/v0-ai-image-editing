"use client"

import { useState } from "react"
import Image from "next/image"
import { LogOut, Settings, User as UserIcon } from "lucide-react"
import { toast } from "sonner"
import type { User } from "@supabase/supabase-js"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import SignOutConfirm from "./sign-out-confirm"

interface UserDropdownProps {
  user: User
}

export default function UserDropdown({ user }: UserDropdownProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)

  const display = displayName(user)
  const initial = initialOf(display)
  const avatarUrl = avatarOf(user)

  function comingSoon(label: string) {
    setPopoverOpen(false)
    toast(`${label} — Coming soon`)
  }

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Account menu"
            className="flex h-[30px] w-[30px] items-center justify-center overflow-hidden rounded-full border border-transparent bg-[#0a0a0a] text-xs font-semibold text-white transition-all hover:border-black/25 hover:opacity-90"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={30}
                height={30}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <span aria-hidden="true">{initial}</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[216px] p-1.5">
          <div className="flex items-center gap-2.5 px-2 py-2 border-b border-black/[0.09]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0a0a0a] text-[11px] font-semibold text-white">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={28}
                  height={28}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <span aria-hidden="true">{initial}</span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium leading-tight text-[#0a0a0a]">
                {display}
              </div>
              {user.email && (
                <div className="truncate text-[11.5px] text-[#6b6b68]">
                  {user.email}
                </div>
              )}
            </div>
          </div>

          <div className="mt-1">
            <MenuItem
              icon={<UserIcon className="h-3.5 w-3.5" />}
              onClick={() => comingSoon("Profile")}
            >
              Profile
            </MenuItem>
            <MenuItem
              icon={<Settings className="h-3.5 w-3.5" />}
              onClick={() => comingSoon("Settings")}
            >
              Settings
            </MenuItem>
          </div>

          <div className="my-1 h-px bg-black/[0.09]" />

          <MenuItem
            icon={<LogOut className="h-3.5 w-3.5" />}
            destructive
            onClick={() => {
              setPopoverOpen(false)
              setConfirmOpen(true)
            }}
          >
            Sign out
          </MenuItem>
        </PopoverContent>
      </Popover>

      <SignOutConfirm open={confirmOpen} onOpenChange={setConfirmOpen} />
    </>
  )
}

function MenuItem({
  icon,
  children,
  destructive,
  onClick,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  destructive?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        destructive
          ? "text-[#c0362f] hover:bg-[#c0362f]/[0.07]"
          : "text-[#0a0a0a] hover:bg-[#f7f7f5]",
      )}
    >
      <span
        aria-hidden="true"
        className={destructive ? "text-[#c0362f]" : "text-[#6b6b68]"}
      >
        {icon}
      </span>
      <span>{children}</span>
    </button>
  )
}

function displayName(user: User): string {
  const meta = user.user_metadata as Record<string, unknown> | null | undefined
  const full = typeof meta?.full_name === "string" ? meta.full_name : null
  const name = typeof meta?.name === "string" ? meta.name : null
  return full ?? name ?? user.email ?? "Account"
}

function initialOf(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return "U"
  return trimmed[0]!.toUpperCase()
}

function avatarOf(user: User): string | null {
  const meta = user.user_metadata as Record<string, unknown> | null | undefined
  const url = typeof meta?.avatar_url === "string" ? meta.avatar_url : null
  return url
}
