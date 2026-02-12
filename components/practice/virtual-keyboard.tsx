import React from "react"
import { cn } from "@/lib/utils"

interface VirtualKeyboardProps {
    activeKey: string | null
    pressedKey: string | null
}

const ROWS = [
    ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Backspace"],
    ["Tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
    ["Caps Lock", "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "Enter"],
    ["Shift", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "Shift"],
    ["Space"]
]

export function VirtualKeyboard({ activeKey, pressedKey }: VirtualKeyboardProps) {
    const getKeyStyle = (key: string) => {
        const isActive = activeKey?.toLowerCase() === key.toLowerCase()
        const isPressed = pressedKey?.toLowerCase() === key.toLowerCase()

        // Special handling for Space
        if (key === "Space") {
            if (activeKey === " ") return "bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]"
            if (pressedKey === " ") return "bg-slate-600 scale-95"
            return "bg-slate-800"
        }

        if (isActive) return "bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)] scale-105"
        if (isPressed) return "bg-slate-600 scale-95"

        return "bg-slate-800 text-slate-400"
    }

    const getKeyLabel = (key: string) => {
        if (key === "Space") return ""
        return key
    }

    const getKeyWidth = (key: string) => {
        switch (key) {
            case "Backspace": return "w-20"
            case "Tab": return "w-20"
            case "Caps Lock": return "w-24"
            case "Enter": return "w-24"
            case "Shift": return "w-28"
            case "Space": return "w-96"
            default: return "w-12"
        }
    }

    return (
        <div className="flex flex-col gap-2 p-6 bg-slate-900 rounded-xl border border-slate-800 select-none">
            {ROWS.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-2 justify-center">
                    {row.map((key, keyIndex) => (
                        <div
                            key={`${rowIndex}-${keyIndex}`}
                            className={cn(
                                "h-12 rounded flex items-center justify-center font-mono text-sm transition-all duration-100 uppercase",
                                getKeyWidth(key),
                                getKeyStyle(key)
                            )}
                        >
                            {getKeyLabel(key)}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    )
}
