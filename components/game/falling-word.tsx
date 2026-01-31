"use client"

import { memo } from "react"
import type { Word } from "@/lib/game-types"
import { cn } from "@/lib/utils"

interface FallingWordProps {
  word: Word
  typedText: string
}

export const FallingWord = memo(function FallingWord({ word, typedText }: FallingWordProps) {
  const isMatching = word.text.toLowerCase().startsWith(typedText.toLowerCase()) && typedText.length > 0
  const matchedLength = isMatching ? typedText.length : 0
  
  const difficultyColors = {
    easy: "bg-emerald-500/20 border-emerald-500/50 text-emerald-300",
    medium: "bg-amber-500/20 border-amber-500/50 text-amber-300",
    hard: "bg-rose-500/20 border-rose-500/50 text-rose-300"
  }

  return (
    <div
      className={cn(
        "absolute px-3 py-1.5 rounded-lg border font-mono text-sm md:text-base",
        "transition-all duration-100 backdrop-blur-sm",
        difficultyColors[word.difficulty],
        isMatching && "ring-2 ring-cyan-400 scale-110 shadow-lg shadow-cyan-400/30"
      )}
      style={{
        left: `${word.x}%`,
        top: `${word.y}%`,
        transform: "translateX(-50%)"
      }}
    >
      {isMatching ? (
        <>
          <span className="text-cyan-300 font-bold">{word.text.slice(0, matchedLength)}</span>
          <span>{word.text.slice(matchedLength)}</span>
        </>
      ) : (
        word.text
      )}
    </div>
  )
})
