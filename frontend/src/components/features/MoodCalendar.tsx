import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { dailyCheckInApi, type MoodHistoryItem } from '../../api/dailyCheckInApi'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

const MOOD_COLORS = {
    negative: 'bg-gradient-to-br from-red-100 to-red-200 border-red-300 text-red-700',
    neutral: 'bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300 text-orange-700',
    positive: 'bg-gradient-to-br from-green-100 to-green-200 border-green-300 text-green-700',
    none: 'bg-muted/30 border-dashed border-border text-muted-foreground'
}

const MOOD_EMOJI: Record<number, string> = {
    1: "😢",
    2: "😔",
    3: "😐",
    4: "🙂",
    5: "😄",
}

export default function MoodCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [history, setHistory] = useState<MoodHistoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const month = currentDate.getMonth() + 1
    const year = currentDate.getFullYear()

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError(null)
        dailyCheckInApi
            .getMoodHistory(month, year)
            .then((res) => {
                if (!cancelled) setHistory(res.items || [])
            })
            .catch((err) => {
                if (!cancelled) setError(err?.message || 'Failed to load mood history')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [month, year])

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 2, 1))
    }

    const nextMonth = () => {
        const next = new Date(year, month, 1)
        if (next <= new Date()) {
            setCurrentDate(next)
        }
    }

    const daysInMonth = new Date(year, month, 0).getDate()
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay() // 0 = Sunday

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i)

    const getMoodForDay = (day: number) => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        return history.find(item => item.date === dateStr)
    }

    const monthName = currentDate.toLocaleString('default', { month: 'long' })

    return (
        <Card className="border-border shadow-md">
            <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <CalendarIcon size={20} className="text-primary" />
                        <div>
                            <CardTitle className="text-primary">Mood Calendar</CardTitle>
                            <CardDescription>Daily mood overview for {monthName} {year}</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={prevMonth}
                            className="p-2 hover:bg-muted rounded-full transition-colors"
                            title="Previous Month"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex items-center gap-1">
                            <select
                                value={month - 1}
                                onChange={(e) => setCurrentDate(new Date(year, parseInt(e.target.value), 1))}
                                className="bg-transparent font-semibold text-sm cursor-pointer hover:text-primary outline-none focus:ring-0 appearance-none px-1"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i} value={i}>
                                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={year}
                                onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), month - 1, 1))}
                                className="bg-transparent font-semibold text-sm cursor-pointer hover:text-primary outline-none focus:ring-0 appearance-none px-1"
                            >
                                {Array.from({ length: 10 }, (_, i) => {
                                    const y = new Date().getFullYear() - 5 + i;
                                    return (
                                        <option key={y} value={y}>
                                            {y}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <button
                            onClick={nextMonth}
                            disabled={new Date(year, month, 1) > new Date()}
                            className="p-2 hover:bg-muted rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Next Month"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading && (
                    <div className="flex h-64 items-center justify-center text-muted-foreground">
                        Loading…
                    </div>
                )}
                {error && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                )}
                {!loading && !error && (
                    <div className="grid grid-cols-7 gap-2 transition-all duration-200">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="text-center text-xs font-bold text-muted-foreground py-2 uppercase tracking-wider">
                                {d}
                            </div>
                        ))}
                        {blanks.map(i => (
                            <div key={`blank-${i}`} className="aspect-square w-full" />
                        ))}
                        {days.map(day => {
                            const today = new Date()
                            const isToday =
                                today.getFullYear() === year &&
                                today.getMonth() + 1 === month &&
                                today.getDate() === day
                            const moodItem = getMoodForDay(day)
                            const colorClass = moodItem ? MOOD_COLORS[moodItem.theme] : MOOD_COLORS.none

                            return (
                                <div
                                    key={day}
                                    title={
                                        moodItem
                                            ? `${moodItem.date} • Mood ${moodItem.mood}`
                                            : `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} • No check-in`
                                    }
                                    className={`
                                        aspect-square
                                        w-full
                                        rounded-xl
                                        border
                                        flex items-center justify-center
                                        transition-all duration-200 ease-out
                                        hover:scale-[1.05] hover:shadow-md
                                        cursor-default
                                        group
                                        relative
                                        ${colorClass}
                                        ${isToday ? "ring-2 ring-primary" : ""}
                                    `}
                                >
                                    <span className="absolute top-2 left-2 text-xs font-medium opacity-60">
                                        {day}
                                    </span>
                                    {moodItem && (
                                        <span className="text-3xl">
                                            {MOOD_EMOJI[moodItem.mood]}
                                        </span>
                                    )}
                                    {moodItem && (
                                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-sm bg-white shadow-sm border border-border group-hover:scale-125 transition-transform" />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
                <div className="mt-8 flex flex-wrap gap-4 items-center justify-center text-xs text-muted-foreground border-t border-border/50 pt-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-green-200 border border-green-300" />
                        <span>Positive</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-gray-200 border border-gray-300" />
                        <span>Neutral</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-red-200 border border-red-300" />
                        <span>Negative</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-muted/30 border border-dashed border-border" />
                        <span>No Check-in</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
