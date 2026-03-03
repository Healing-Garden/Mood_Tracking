import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { dailyCheckInApi, type WordCloudWord } from '../../api/dailyCheckInApi'

type Period = 'week' | 'month' | 'year'

interface WordCloudProps {
    defaultPeriod?: Period
}

export default function WordCloud({ defaultPeriod = 'month' }: WordCloudProps) {
    const [period, setPeriod] = useState<Period>(defaultPeriod)
    const [words, setWords] = useState<WordCloudWord[]>([])

    // Sync state if prop changes (needed for export capture)
    useEffect(() => {
        setPeriod(defaultPeriod);
    }, [defaultPeriod]);
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError(null)
        dailyCheckInApi
            .getWordCloud(period)
            .then((res) => {
                if (!cancelled) setWords(res.words || [])
            })
            .catch((err) => {
                if (!cancelled) setError(err?.message || 'Failed to load word cloud')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [period])

    // Simple word cloud layout: size based on frequency
    const maxValue = Math.max(...words.map((w) => w.value), 1)
    const minFontSize = 14
    const maxFontSize = 48

    const getWordStyle = (word: WordCloudWord) => {
        const ratio = word.value / maxValue
        const fontSize = minFontSize + ratio * (maxFontSize - minFontSize)

        // Color gradient from muted to primary based on frequency
        const opacity = 0.5 + ratio * 0.5

        return {
            fontSize: `${fontSize}px`,
            opacity,
            padding: '4px 8px',
            margin: '4px',
            display: 'inline-block',
            fontWeight: ratio > 0.6 ? 600 : 400,
            color: 'var(--color-primary)',
            transition: 'all 0.2s ease',
        }
    }

    return (
        <Card id="word-cloud-chart" className="border-border shadow-md">
            <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-primary">Word Cloud</CardTitle>
                        <CardDescription>Most frequent words from your journal notes</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {(['week', 'month', 'year'] as Period[]).map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPeriod(p)}
                                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${period === p
                                    ? 'bg-primary text-white'
                                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                                    }`}
                            >
                                {p === 'week' ? '7 days' : p === 'month' ? '30 days' : '1 year'}
                            </button>
                        ))}
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
                {!loading && !error && words.length === 0 && (
                    <div className="rounded-lg border border-border bg-muted/30 px-4 py-8 text-center text-muted-foreground">
                        No journal notes yet. Start writing to see your word cloud!
                    </div>
                )}
                {!loading && !error && words.length > 0 && (
                    <div className="min-h-[300px] flex flex-wrap items-center justify-center p-4 bg-gradient-to-br from-muted/20 to-muted/5 rounded-lg">
                        {words.map((word, idx) => (
                            <span
                                key={`${word.text}-${idx}`}
                                style={getWordStyle(word)}
                                className="hover:scale-110 cursor-default select-none"
                                title={`"${word.text}" appears ${word.value} time${word.value > 1 ? 's' : ''}`}
                            >
                                {word.text}
                            </span>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
