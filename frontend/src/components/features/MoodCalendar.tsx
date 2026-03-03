import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { dailyCheckInApi, type MoodHistoryItem } from '../../api/dailyCheckInApi'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

const MOOD_COLORS = {
    low: 'bg-red-200 border-red-300 text-red-700',
    neutral: 'bg-gray-200 border-gray-300 text-gray-700',
    positive: 'bg-green-200 border-green-300 text-green-700',
    none: 'bg-muted/30 border-dashed border-border text-muted-foreground'
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
                        <span className="text-sm font-semibold min-w-[100px] text-center">
                            {monthName} {year}
                        </span>
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
                    <div className="grid grid-cols-7 gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="text-center text-xs font-bold text-muted-foreground py-2 uppercase tracking-wider">
                                {d}
                            </div>
                        ))}
                        {blanks.map(i => (
                            <div key={`blank-${i}`} className="aspect-square w-full" />
                        ))}
                        {days.map(day => {
                            const moodItem = getMoodForDay(day)
                            const colorClass = moodItem ? MOOD_COLORS[moodItem.theme] : MOOD_COLORS.none

                            return (
                                <div
                                    key={day}
                                    className={`
                                        aspect-square
                                        w-full
                                        rounded-xl
                                        border
                                        flex flex-col items-center justify-center
                                        transition-all
                                        hover:scale-105
                                        cursor-default
                                        group
                                        relative
                                        ${colorClass}
                                    `}
                                >
                                    <span className="text-xs font-medium opacity-60">{day}</span>
                                    {moodItem && (
                                        <span className="text-lg font-bold">{moodItem.mood}</span>
                                    )}
                                    {moodItem && (
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-white shadow-sm border border-border group-hover:scale-125 transition-transform" />
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
                        <span>Low</span>
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
