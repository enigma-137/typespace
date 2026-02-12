"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { VirtualKeyboard } from "@/components/practice/virtual-keyboard"
import { WORD_GROUPS } from "@/lib/word-groups"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, RotateCcw, Trophy } from "lucide-react"
import Link from "next/link"

const LETTER_STATUS = {
    PENDING: "pending",
    CORRECT: "correct",
    INCORRECT: "incorrect",
}

export function PracticeMode() {
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
    const [currentWordIndex, setCurrentWordIndex] = useState(0)
    const [inputValue, setInputValue] = useState("")
    const [gameState, setGameState] = useState<"menu" | "playing" | "results">("menu")
    const [startTime, setStartTime] = useState<number | null>(null)

    // Stats
    const [correctChars, setCorrectChars] = useState(0)
    const [totalChars, setTotalChars] = useState(0)
    const [wpm, setWpm] = useState(0)
    const [accuracy, setAccuracy] = useState(100)

    // Keyboard State
    const [activeKey, setActiveKey] = useState<string | null>(null)
    const [pressedKey, setPressedKey] = useState<string | null>(null)

    const inputRef = useRef<HTMLInputElement>(null)

    // Load High Scores from LocalStorage
    const [highScores, setHighScores] = useState<Record<string, { wpm: number, accuracy: number }>>({})

    useEffect(() => {
        const saved = localStorage.getItem("type_practice_scores")
        if (saved) {
            setHighScores(JSON.parse(saved))
        }
    }, [])

    const currentGroup = WORD_GROUPS.find(g => g.id === selectedGroupId)
    const currentWord = currentGroup?.words[currentWordIndex] || ""

    const startGame = (groupId: string) => {
        setSelectedGroupId(groupId)
        setGameState("playing")
        setCurrentWordIndex(0)
        setInputValue("")
        setCorrectChars(0)
        setTotalChars(0)
        setWpm(0)
        setAccuracy(100)
        setStartTime(null)

        // Focus input
        setTimeout(() => inputRef.current?.focus(), 100)
    }

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (gameState !== "playing") return

        const value = e.target.value
        if (!startTime) setStartTime(Date.now())

        const lastChar = value.slice(-1)
        const expectedChar = currentWord[inputValue.length]

        setPressedKey(lastChar)
        setTimeout(() => setPressedKey(null), 100)

        // Check if word is complete (space pressed)
        if (lastChar === " " && inputValue.length === currentWord.length) {
            // Only allow space if word is fully typed correctly?
            // Let's keep it simple: if space is pressed, move to next word.
            // Actually, standard typing tests just verify word against input on space or completion.

            if (inputValue === currentWord) {
                setCorrectChars(prev => prev + inputValue.length + 1) // +1 for space
            }
            setTotalChars(prev => prev + inputValue.length + 1)

            if (currentWordIndex < (currentGroup?.words.length || 0) - 1) {
                setCurrentWordIndex(prev => prev + 1)
                setInputValue("")
            } else {
                finishGame()
            }
            return
        }

        // Prevent typing more than word length
        if (value.length > currentWord.length) return

        setInputValue(value)

        // Update active key for visual keyboard
        const nextChar = currentWord[value.length]
        setActiveKey(nextChar || "Space")
    }

    const finishGame = () => {
        setGameState("results")
        const endTime = Date.now()
        const durationMinutes = (endTime - (startTime || endTime)) / 60000

        // Calculate final stats
        // Note: This is an estimation. A better way would be to track every keystroke.
        const finalWpm = Math.round((correctChars / 5) / (durationMinutes || 0.01))
        const finalAccuracy = Math.round((correctChars / totalChars) * 100) || 0

        setWpm(finalWpm)
        setAccuracy(finalAccuracy)

        // Save Score
        if (selectedGroupId) {
            const prevBest = highScores[selectedGroupId]
            if (!prevBest || finalWpm > prevBest.wpm) {
                const newScores = {
                    ...highScores,
                    [selectedGroupId]: { wpm: finalWpm, accuracy: finalAccuracy }
                }
                setHighScores(newScores)
                localStorage.setItem("type_practice_scores", JSON.stringify(newScores))
            }
        }
    }

    // Render Logic

    if (gameState === "menu") {
        return (
            <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center">
                <div className="max-w-4xl w-full space-y-8">
                    <div className="flex items-center justify-between">
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                            Practice Typing
                        </h1>
                        <Link href="/">
                            <Button variant="ghost" className="text-slate-400 hover:text-white">
                                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Game
                            </Button>
                        </Link>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {WORD_GROUPS.map(group => (
                            <Card
                                key={group.id}
                                className="bg-slate-900 border-slate-800 hover:border-cyan-500/50 transition-colors cursor-pointer group"
                                onClick={() => startGame(group.id)}
                            >
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-slate-100 group-hover:text-cyan-400 transition-colors">
                                        {group.name}
                                    </CardTitle>
                                    {highScores[group.id] && (
                                        <div className="flex items-center gap-2 text-sm text-yellow-500">
                                            <Trophy className="h-4 w-4" />
                                            <span>{highScores[group.id].wpm} WPM</span>
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-400 text-sm">
                                        {group.words.slice(0, 5).join(", ")}...
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-100">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                Personal Bests
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-slate-800 hover:bg-transparent">
                                        <TableHead className="text-slate-400">Group</TableHead>
                                        <TableHead className="text-slate-400 text-right">WPM</TableHead>
                                        <TableHead className="text-slate-400 text-right">Accuracy</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {WORD_GROUPS.map(group => {
                                        const score = highScores[group.id]
                                        return (
                                            <TableRow key={group.id} className="border-slate-800 hover:bg-slate-800/50">
                                                <TableCell className="font-medium text-slate-200">{group.name}</TableCell>
                                                <TableCell className="text-right text-cyan-400">
                                                    {score ? score.wpm : "-"}
                                                </TableCell>
                                                <TableCell className="text-right text-emerald-400">
                                                    {score ? `${score.accuracy}%` : "-"}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (gameState === "results") {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-slate-900 border-slate-800">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl text-cyan-400">Session Complete!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 text-center">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-800 rounded-lg">
                                <div className="text-4xl font-bold text-white mb-1">{wpm}</div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">WPM</div>
                            </div>
                            <div className="p-4 bg-slate-800 rounded-lg">
                                <div className="text-4xl font-bold text-emerald-400 mb-1">{accuracy}%</div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">Accuracy</div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => setGameState("menu")}
                                variant="outline"
                                className="flex-1 border-slate-700 text-slate-300"
                            >
                                Change Group
                            </Button>
                            <Button
                                onClick={() => startGame(selectedGroupId!)}
                                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                            >
                                <RotateCcw className="mr-2 h-4 w-4" /> Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Playing State
    return (
        <div className="min-h-screen bg-slate-950 p-4 flex flex-col items-center justify-center space-y-8" onClick={() => inputRef.current?.focus()}>
            <div className="w-full max-w-4xl space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between text-slate-400">
                    <Button variant="ghost" size="sm" onClick={() => setGameState("menu")}>
                        <ChevronLeft className="mr-2 h-4 w-4" /> Quit
                    </Button>
                    <div className="text-sm font-mono">
                        {currentWordIndex + 1} / {currentGroup?.words.length} Words
                    </div>
                </div>

                {/* Word Display */}
                <div className="text-center space-y-2 min-h-[120px] flex flex-col items-center justify-center">
                    <div className="text-6xl font-mono relative">
                        {/* Letters */}
                        {currentWord.split('').map((char, idx) => {
                            let color = "text-slate-600"
                            if (idx < inputValue.length) {
                                color = inputValue[idx] === char ? "text-cyan-400" : "text-red-500"
                            } else if (idx === inputValue.length) {
                                color = "text-slate-200 underline decoration-cyan-500 decoration-4 underline-offset-8"
                            }

                            return (
                                <span key={idx} className={color}>{char}</span>
                            )
                        })}
                    </div>
                    <p className="text-slate-500 text-lg mt-4">Type the word and press Space</p>
                </div>

                {/* Keyboard */}
                <div className="flex justify-center">
                    <VirtualKeyboard
                        activeKey={currentWord[inputValue.length] || "Space"}
                        pressedKey={pressedKey}
                    />
                </div>

                {/* Hidden Input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInput}
                    className="opacity-0 absolute pointer-events-none"
                    autoFocus
                />
            </div>
        </div>
    )
}
