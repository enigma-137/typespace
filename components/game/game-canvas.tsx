"use client"

import { useRef, useEffect } from "react"
import type { Word } from "@/lib/game-types"
import { FallingWord } from "./falling-word"

interface GameCanvasProps {
  words: Word[]
  typedText: string
}

export function GameCanvas({ words, typedText }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[60vh] md:h-[70vh] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, #334155 1px, transparent 1px),
            linear-gradient(to bottom, #334155 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px"
        }}
      />

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-red-900/30 to-transparent pointer-events-none" />

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500/50" />

      {/* Falling words */}
      {words.map(word => (
        <FallingWord
          key={word.id}
          word={word}
          typedText={typedText}
        />
      ))}


      {words.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-slate-600 text-lg">Waiting for words...</p>
        </div>
      )}
    </div>
  )
}
