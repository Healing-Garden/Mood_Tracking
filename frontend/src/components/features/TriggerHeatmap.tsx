import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { dailyCheckInApi, type TriggerHeatmapRow } from '../../api/dailyCheckInApi'

type Period = 'week' | 'month' | 'year'

const MOOD_COLORS = {
  negative: { light: 'rgb(254 226 226)', mid: 'rgb(248 113 113)', dark: 'rgb(220 38 38)' },
  neutral: { light: 'rgb(229 231 235)', mid: 'rgb(156 163 175)', dark: 'rgb(75 85 99)' },
  positive: { light: 'rgb(220 252 231)', mid: 'rgb(74 222 128)', dark: 'rgb(22 163 74)' },
} as const

function getHeatColor(
  value: number,
  max: number,
  kind: 'negative' | 'neutral' | 'positive'
): string {
  if (max === 0) return MOOD_COLORS[kind].light
  const ratio = value / max
  if (ratio <= 0) return MOOD_COLORS[kind].light
  if (ratio >= 1) return MOOD_COLORS[kind].dark
  return MOOD_COLORS[kind].mid
}

export default function TriggerHeatmap() {
  const [period, setPeriod] = useState<Period>('month')
  const [rows, setRows] = useState<TriggerHeatmapRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    dailyCheckInApi
      .getTriggerHeatmap(period)
      .then((res) => {
        if (!cancelled) setRows(res.rows || [])
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Failed to load heatmap')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [period])

  const maxNegative = Math.max(1, ...rows.map((r) => r.negative))
  const maxNeutral = Math.max(1, ...rows.map((r) => r.neutral))
  const maxPositive = Math.max(1, ...rows.map((r) => r.positive))
  const hasData = rows.some((r) => r.negative + r.neutral + r.positive > 0)
  const triggers = rows.map((r) => r.trigger)

  const moodRows = [
    {
      label: 'Negative',
      kind: 'negative' as const,
      values: rows.map((r) => r.negative),
      max: maxNegative,
      emoji: '😔'
    },
    {
      label: 'Neutral',
      kind: 'neutral' as const,
      values: rows.map((r) => r.neutral),
      max: maxNeutral,
      emoji: '😐'
    },
    {
      label: 'Positive',
      kind: 'positive' as const,
      values: rows.map((r) => r.positive),
      max: maxPositive,
      emoji: '😊'
    },
  ]

  return (
    <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="border-b border-border/30">
        <div className="space-y-4">
          {/* Title and Description */}
          <div>
            <CardTitle className="text-xl text-primary">Trigger Heatmap</CardTitle>
            <CardDescription className="mt-2 text-sm">
              Visualize how different triggers affect your mood intensity over time.
            </CardDescription>
          </div>

          {/* Period Selector - Segmented Control Style */}
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

      <CardContent className="pt-6">
        {loading && (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading heatmap…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && !hasData && (
          <div className="rounded-xl border border-dashed border-border/50 bg-secondary/20 px-6 py-12 text-center">
            <div className="text-3xl mb-3">📊</div>
            <p className="font-medium text-foreground mb-2">No trigger data yet</p>
            <p className="text-sm text-muted-foreground">
              When you check in, select triggers (e.g., Work, Family, Exercise) to see correlations here.
            </p>
          </div>
        )}

        {!loading && !error && hasData && (
          <div className="space-y-6">
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-6 pb-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase">Intensity</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Low</span>
                <div className="flex gap-1">
                  {[0, 0.3, 0.6, 1].map((ratio, i) => {
                    const color = ratio === 0 
                      ? 'rgb(220 252 231)' 
                      : ratio < 0.5 
                      ? 'rgb(134 239 172)' 
                      : 'rgb(34 197 94)'
                    return (
                      <div
                        key={i}
                        className="h-3 w-3 rounded"
                        style={{ backgroundColor: color }}
                      />
                    )
                  })}
                </div>
                <span className="text-xs text-muted-foreground">High</span>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto -mx-6 px-6">
              <div
                className="grid gap-3 min-w-min"
                style={{
                  gridTemplateColumns: `120px repeat(${triggers.length}, minmax(56px, 1fr))`,
                }}
              >
                {/* Header: Trigger Names */}
                <div className="font-medium text-sm text-muted-foreground uppercase text-xs tracking-wider" />
                {triggers.map((t) => (
                  <div
                    key={t}
                    className="text-xs font-medium text-muted-foreground text-center truncate py-2 px-1"
                    title={t}
                  >
                    {t}
                  </div>
                ))}

                {/* Rows: Mood */}
                {moodRows.map((row) => (
                  <div key={row.label} className="contents">
                    {/* Mood label with emoji */}
                    <div className="flex items-center gap-2 font-medium text-sm pr-3">
                      <span className="text-lg">{row.emoji}</span>
                      <span className="text-muted-foreground">{row.label}</span>
                    </div>

                    {/* Cells */}
                    {row.values.map((value, idx) => (
                      <div
                        key={idx}
                        className="
                          flex items-center justify-center
                          rounded-lg
                          text-[10px] font-bold
                          transition-all duration-200
                          hover:ring-2 hover:ring-primary/30 hover:scale-105 cursor-pointer
                          relative group
                        "
                        style={{
                          backgroundColor: getHeatColor(value, row.max, row.kind),
                          color: value > row.max / 2 ? 'white' : 'rgb(51 65 85)',
                          aspectRatio: '1 / 1',
                          minHeight: '56px'
                        }}
                        title={`${row.label} • ${triggers[idx]}: ${value}`}
                      >
                        {value > 0 && <span>{value}</span>}
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {row.label}: {value}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Info Text */}
            <div className="text-xs text-muted-foreground pt-4 border-t border-border/30">
              📌 Darker cells indicate higher frequency of that mood-trigger combination.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
