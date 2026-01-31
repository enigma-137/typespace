"use client"

import React from "react"

import { forwardRef } from "react"
import { cn } from "@/lib/utils"

interface TypingInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  combo: number
}

export const TypingInput = forwardRef<HTMLInputElement, TypingInputProps>(
  function TypingInput({ value, onChange, onSubmit, disabled, combo }, ref) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        onSubmit()
      }
    }

    return (
      <div className="relative">
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="Type the words..."
          className={cn(
            "w-full px-6 py-4 text-xl md:text-2xl font-mono",
            "bg-slate-900 border-2 border-slate-700 rounded-xl",
            "text-slate-100 placeholder:text-slate-600",
            "focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20",
            "transition-all duration-150",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        {combo > 1 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-bold">
              {combo}x Combo!
            </span>
          </div>
        )}
      </div>
    )
  }
)
