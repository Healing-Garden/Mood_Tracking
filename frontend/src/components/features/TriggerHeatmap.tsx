import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { dailyCheckInApi, type TriggerHeatmapRow } from '../../api/dailyCheckInApi'
import { Flame, Info } from 'lucide-react'

type HeatmapPeriod = 'week' | 'month' | 'year'

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

interface HeatmapProps {
  defaultPeriod?: HeatmapPeriod
  compact?: boolean
}

export default function TriggerHeatmap({ defaultPeriod = 'week', compact = false }: HeatmapProps) {
  const [period, setPeriod] = useState<HeatmapPeriod>(defaultPeriod)
  const [rows, setRows] = useState<TriggerHeatmapRow[]>([])

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
    },
    {
      label: 'Neutral',
      kind: 'neutral' as const,
      values: rows.map((r) => r.neutral),
      max: maxNeutral,
    },
    {
      label: 'Positive',
      kind: 'positive' as const,
      values: rows.map((r) => r.positive),
      max: maxPositive,
    },
  ]

  return (
    <Card id="trigger-heatmap-chart" className={`border-border shadow-md ${compact ? 'h-full' : ''}`}>
      <CardHeader className={compact ? 'pb-3' : ''}>
        <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${compact ? 'gap-2' : ''}`}>
          <div>
            <CardTitle className={`text-primary flex items-center gap-2 ${compact ? 'text-sm' : ''}`}>
              <Flame size={compact ? 16 : 20} />
              Trigger Heatmap
            </CardTitle>
            {!compact && (
              <CardDescription className="flex items-center gap-1">
                <Info size={14} />
                Emotional frequency by trigger and mood quality.
              </CardDescription>
            )}
          </div>
          {!compact && (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Rare</span>
                <div className="flex gap-1">
                  <span className="h-3 w-3 rounded-md bg-green-50" />
                  <span className="h-3 w-3 rounded-md bg-green-200" />
                  <span className="h-3 w-3 rounded-md bg-green-400" />
                  <span className="h-3 w-3 rounded-md bg-green-600" />
                </div>
                <span>Frequent</span>
              </div>
              <div className="flex gap-2">
                {(['week', 'month', 'year'] as HeatmapPeriod[]).map((p) => (
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
          )}
        </div>
      </CardHeader>
      <CardContent className={compact ? 'p-2' : ''}>
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
        {!loading && !error && !hasData && (
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-8 text-center text-muted-foreground">
            No trigger data yet. When you check in, optionally select triggers (e.g. Work, Family) to see correlations here.
          </div>
        )}
        {!loading && !error && hasData && (
          <div className={compact ? "overflow-hidden" : "overflow-x-auto"}>
            <div
              className={`grid ${compact ? 'gap-1' : 'gap-2'}`}
              style={{
                gridTemplateColumns: compact 
                  ? `60px repeat(${triggers.length}, minmax(32px, 1fr))`
                  : `96px repeat(${triggers.length}, minmax(48px, 1fr))`,
              }}
            >
              {/* Header: Trigger */}
              <div />
              {triggers.map((t) => (
                <div
                  key={t}
                  className={`${compact ? 'text-[10px]' : 'text-xs'} text-muted-foreground text-center truncate`}
                  title={t}
                >
                  {t}
                </div>
              ))}

              {/* Rows: Mood */}
              {moodRows.map((row) => (
                <div key={row.label} className="contents">
                  {/* Mood label */}
                  <div className={`flex items-center ${compact ? 'text-[11px] font-medium' : 'text-sm font-medium'}`}>
                    {row.label}
                  </div>

                  {/* Cells */}
                  {row.values.map((value, idx) => (
                    <div
                      key={idx}
                      className={`
                        aspect-square
                        w-full
                        rounded-full
                        flex items-center justify-center
                        ${compact ? 'text-[8px]' : 'text-[11px]'} font-semibold
                        shadow-sm
                      `}
                      style={{
                        backgroundColor: getHeatColor(value, row.max, row.kind),
                        color: value > row.max / 2 ? 'white' : 'inherit',
                      }}
                      title={`${row.label} • ${triggers[idx]}: ${value}`}
                    >
                      {compact && value > 0 ? '●' : value || ''}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
