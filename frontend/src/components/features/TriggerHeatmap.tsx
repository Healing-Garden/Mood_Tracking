import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/Card"
import { dailyCheckInApi, type TriggerHeatmapRow } from "../../api/dailyCheckInApi"
import { Flame, Info } from "lucide-react"

type HeatmapPeriod = "week" | "month" | "year"

const COLOR_SCALE = {
  negative: [
    "rgb(254 226 226)",
    "rgb(252 165 165)",
    "rgb(248 113 113)",
    "rgb(239 68 68)",
    "rgb(220 38 38)",
  ],
  neutral: [
    "rgb(255 237 213)",
    "rgb(253 186 116)",
    "rgb(251 146 60)",
    "rgb(249 115 22)",
    "rgb(194 65 12)",
  ],
  positive: [
    "rgb(220 252 231)",
    "rgb(134 239 172)",
    "rgb(74 222 128)",
    "rgb(34 197 94)",
    "rgb(22 163 74)",
  ],
} as const

function getHeatColor(value: number, max: number, kind: keyof typeof COLOR_SCALE) {
  if (max === 0) return COLOR_SCALE[kind][0]

  const ratio = value / max
  const index = Math.min(4, Math.floor(ratio * 5))

  return COLOR_SCALE[kind][index]
}

interface HeatmapProps {
  defaultPeriod?: HeatmapPeriod
  compact?: boolean
}

export default function TriggerHeatmap({
  defaultPeriod = "week",
}: HeatmapProps) {
  const [period, setPeriod] = useState<HeatmapPeriod>(defaultPeriod)
  const [rows, setRows] = useState<TriggerHeatmapRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [hoverRow, setHoverRow] = useState<number | null>(null)
  const [hoverCol, setHoverCol] = useState<number | null>(null)

  useEffect(() => {
    setPeriod(defaultPeriod)
  }, [defaultPeriod])

  useEffect(() => {
    let cancelled = false

    setLoading(true)

    dailyCheckInApi
      .getTriggerHeatmap(period)
      .then((res) => {
        if (!cancelled) setRows(res.rows || [])
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Failed to load heatmap")
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

  const triggers = rows.map((r) => r.trigger)

  const moodRows = [
    { label: "Negative", values: rows.map((r) => r.negative), max: maxNegative, kind: "negative" },
    { label: "Neutral", values: rows.map((r) => r.neutral), max: maxNeutral, kind: "neutral" },
    { label: "Positive", values: rows.map((r) => r.positive), max: maxPositive, kind: "positive" },
  ] as const

  const hasData = rows.some((r) => r.negative + r.neutral + r.positive > 0)

  return (
    <Card className="border-border shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Flame size={20} />
              Trigger Heatmap
            </CardTitle>

            <CardDescription className="flex items-center gap-1">
              <Info size={14} />
              Emotional frequency by trigger and mood quality.
            </CardDescription>
          </div>

          <div className="flex gap-2">
            {(["week", "month", "year"] as HeatmapPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${period === p
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
              >
                {p === "week" ? "7 days" : p === "month" ? "30 days" : "1 year"}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading && (
          <div className="flex justify-center items-center h-64 text-muted-foreground">
            Loading heatmap...
          </div>
        )}

        {error && (
          <div className="text-destructive text-sm border border-destructive/30 p-3 rounded-lg">
            {error}
          </div>
        )}

        {!loading && hasData && (
          <div className="relative overflow-x-auto">
            <div
              className="grid relative rounded-2xl overflow-hidden"
              style={{
                gridTemplateColumns: `100px repeat(${triggers.length}, minmax(44px, 1fr))`,
              }}
            >
              <div />

              {triggers.map((t, col) => (
                <div
                  key={t}
                  className={`text-xs text-center truncate py-1 transition ${hoverCol === col ? "text-primary font-semibold" : "text-muted-foreground"
                    }`}
                >
                  {t}
                </div>
              ))}

              {moodRows.map((row, rowIndex) => (
                <div key={row.label} className="contents">
                  <div className="flex items-center text-sm font-medium">
                    {row.label}
                  </div>

                  {row.values.map((value, colIndex) => {
                    const isTop = rowIndex === 0
                    const isBottom = rowIndex === moodRows.length - 1
                    const isLeft = colIndex === 0
                    const isRight = colIndex === row.values.length - 1

                    const cornerRadius = `
                      ${isTop && isLeft ? "rounded-tl-xl" : ""}
                      ${isTop && isRight ? "rounded-tr-xl" : ""}
                      ${isBottom && isLeft ? "rounded-bl-xl" : ""}
                      ${isBottom && isRight ? "rounded-br-xl" : ""}
                    `

                    return (
                      <div
                        key={colIndex}
                        onMouseEnter={() => {
                          setHoverRow(rowIndex)
                          setHoverCol(colIndex)
                        }}
                        onMouseLeave={() => {
                          setHoverRow(null)
                          setHoverCol(null)
                        }}
                        className={`
                          aspect-square
                          flex items-center justify-center
                          text-[11px] font-semibold
                          transition-transform duration-200
                          ${hoverRow === rowIndex || hoverCol === colIndex ? "scale-[1.03]" : ""}
                          ${cornerRadius}
                        `}
                        style={{
                          backgroundColor: getHeatColor(value, row.max, row.kind),
                          color: value > row.max / 2 ? "white" : "inherit",
                        }}
                      >
                        {value || ""}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* overlay smoothing */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(255,255,255,0.03), transparent 70%)",
                mixBlendMode: "overlay",
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}