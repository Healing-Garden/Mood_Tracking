import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { dailyCheckInApi, type WordCloudWord } from '../../api/dailyCheckInApi'

type Period = 'week' | 'month' | 'year'
type FilterTag = 'all' | 'positive' | 'negative' | 'neutral'

interface WordCloudProps {
    defaultPeriod?: Period
}

export default function WordCloud({ defaultPeriod = 'month' }: WordCloudProps) {
    const [period, setPeriod] = useState<Period>(defaultPeriod)
    const [words, setWords] = useState<WordCloudWord[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [hoveredWord, setHoveredWord] = useState<string | null>(null)

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

    // Word cloud layout: size based on frequency
    const maxValue = Math.max(...words.map((w) => w.value), 1)
    const minFontSize = 13
    const maxFontSize = 44

    const getWordStyle = (word: WordCloudWord) => {
        const ratio = word.value / maxValue
        const fontSize = minFontSize + ratio * (maxFontSize - minFontSize)
        const opacity = 0.6 + ratio * 0.4

        return {
            fontSize: `${fontSize}px`,
            opacity,
            fontWeight: ratio > 0.5 ? 600 : ratio > 0.3 ? 500 : 400,
        }
    }

    return (
        <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="border-b border-border/30">
                <div className="space-y-4">
                    {/* Title and Description */}
                    <div>
                        <CardTitle className="text-xl text-primary">Emotional Vocabulary</CardTitle>
                        <CardDescription className="mt-2 text-sm">
                            Most frequent words and phrases from your journal entries. Larger words appear more often.
                        </CardDescription>
                    </div>

                    {/* Period Selector - Segmented Control */}
                    <div className="flex items-center gap-3 pt-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Time Period
                        </span>
                        <div className="inline-flex gap-2 p-1 rounded-lg bg-secondary/40">
                            {(['week', 'month', 'year'] as Period[]).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPeriod(p)}
                                    className={`
                                        px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                                        ${period === p
                                            ? 'bg-primary text-white shadow-md'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                                        }
                                    `}
                                >
                                    {p === 'week' ? '7 days' : p === 'month' ? '30 days' : '1 year'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-8">
                {loading && (
                    <div className="flex h-80 items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-8 w-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-sm text-muted-foreground">Analyzing your words…</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                {!loading && !error && words.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border/50 bg-secondary/20 px-6 py-16 text-center">
                        <div className="text-3xl mb-3">📓</div>
                        <p className="font-medium text-foreground mb-2">No journal entries yet</p>
                        <p className="text-sm text-muted-foreground">
                            Start writing in your journal to discover your emotional vocabulary patterns.
                        </p>
                    </div>
                )}

                {!loading && !error && words.length > 0 && (
                    <div className="space-y-6">
                        {/* Word Cloud Container - Centered */}
                        <div className="min-h-96 flex flex-wrap items-center justify-center gap-3 p-8 rounded-2xl bg-gradient-to-br from-secondary/20 via-background to-secondary/10 border border-border/20">
                            {words.map((word, idx) => {
                                const isHovered = hoveredWord === `${word.text}-${idx}`
                                const wordStyle = getWordStyle(word)
                                
                                return (
                                    <div
                                        key={`${word.text}-${idx}`}
                                        className="relative"
                                        onMouseEnter={() => setHoveredWord(`${word.text}-${idx}`)}
                                        onMouseLeave={() => setHoveredWord(null)}
                                    >
                                        <span
                                            style={wordStyle}
                                            className={`
                                                inline-block
                                                px-3 py-2
                                                rounded-lg
                                                text-primary
                                                cursor-default
                                                select-none
                                                transition-all duration-200
                                                ${isHovered 
                                                    ? 'scale-125 bg-primary/10 shadow-md' 
                                                    : 'hover:scale-110 hover:bg-primary/5'
                                                }
                                            `}
                                            title={`"${word.text}" appears ${word.value} time${word.value > 1 ? 's' : ''}`}
                                        >
                                            {word.text}
                                        </span>
                                        
                                        {/* Frequency Badge on Hover */}
                                        {isHovered && (
                                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md font-medium whitespace-nowrap pointer-events-none">
                                                {word.value} mentions
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Stats Footer */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/30">
                            <div>
                                📊 <span className="ml-1">{words.length} unique words</span>
                            </div>
                            <div>
                                💬 Total mentions: <span className="font-medium text-foreground ml-1">{words.reduce((sum, w) => sum + w.value, 0)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
