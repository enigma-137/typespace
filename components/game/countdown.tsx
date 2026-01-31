"use client"

interface CountdownProps {
  count: number
}

export function Countdown({ count }: CountdownProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center space-y-4">
        <p className="text-slate-400 text-lg">Game starting in</p>
        <div 
          className="text-9xl font-bold text-cyan-400 animate-pulse font-mono"
          style={{
            textShadow: "0 0 40px rgba(34, 211, 238, 0.5)"
          }}
        >
          {count}
        </div>
        <p className="text-slate-500">Get ready to type!</p>
      </div>
    </div>
  )
}
