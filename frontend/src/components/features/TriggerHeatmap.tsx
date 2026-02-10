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

  return (
    <Card className="border-border shadow-md">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-primary">Trigger × Mood Heatmap</CardTitle>
            <CardDescription>
              Correlation between trigger tags and negative / neutral / positive moods. Add triggers when you check in to see patterns.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  period === p
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
        {!loading && !error && !hasData && (
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-8 text-center text-muted-foreground">
            No trigger data yet. When you check in, optionally select triggers (e.g. Work, Family) to see correlations here.
          </div>
        )}
        {!loading && !error && hasData && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-border bg-muted/50 px-3 py-2 text-left font-semibold text-foreground">
                    Trigger
                  </th>
                  <th className="border border-border bg-red-50 px-3 py-2 text-center font-semibold text-red-800">
                    Negative
                  </th>
                  <th className="border border-border bg-gray-100 px-3 py-2 text-center font-semibold text-gray-700">
                    Neutral
                  </th>
                  <th className="border border-border bg-green-50 px-3 py-2 text-center font-semibold text-green-800">
                    Positive
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.trigger}>
                    <td className="border border-border px-3 py-2 font-medium text-foreground">
                      {row.trigger}
                    </td>
                    <td
                      className="border border-border px-3 py-2 text-center transition-colors"
                      style={{
                        backgroundColor: getHeatColor(row.negative, maxNegative, 'negative'),
                        color: row.negative > maxNegative / 2 ? 'white' : 'inherit',
                      }}
                      title={`Negative: ${row.negative}`}
                    >
                      {row.negative}
                    </td>
                    <td
                      className="border border-border px-3 py-2 text-center transition-colors"
                      style={{
                        backgroundColor: getHeatColor(row.neutral, maxNeutral, 'neutral'),
                        color: row.neutral > maxNeutral / 2 ? 'white' : 'inherit',
                      }}
                      title={`Neutral: ${row.neutral}`}
                    >
                      {row.neutral}
                    </td>
                    <td
                      className="border border-border px-3 py-2 text-center transition-colors"
                      style={{
                        backgroundColor: getHeatColor(row.positive, maxPositive, 'positive'),
                        color: row.positive > maxPositive / 2 ? 'white' : 'inherit',
                      }}
                      title={`Positive: ${row.positive}`}
                    >
                      {row.positive}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-muted-foreground">
              Darker cells = higher count. Compare across columns to see which triggers tend to go with negative vs positive moods.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
