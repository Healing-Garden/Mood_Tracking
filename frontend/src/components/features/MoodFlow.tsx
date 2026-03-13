import { useState, useEffect } from 'react'
import { Line, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { TrendingUp } from 'lucide-react'
import { dailyCheckInApi, type MoodFlowResponse } from '../../api/dailyCheckInApi'
import { useDailyCheckInStore } from '../../store/dailyCheckInStore'

type MoodFlowPeriod = 'week' | 'month' | 'year'

type MoodTrendPoint = {
    label: string
    mood: number
    energy: number
}

interface MoodFlowProps {
    defaultPeriod?: MoodFlowPeriod
    onDataChange?: (data: MoodTrendPoint[]) => void
}

export default function MoodFlow({ defaultPeriod = 'week', onDataChange }: MoodFlowProps) {
    const { lastCheckInDate } = useDailyCheckInStore()
    const [period, setPeriod] = useState<MoodFlowPeriod>(defaultPeriod)
    const [moodTrendData, setMoodTrendData] = useState<MoodTrendPoint[]>([])

    // Sync state if prop changes (needed for export capture)
    useEffect(() => {
        setPeriod(defaultPeriod);
    }, [defaultPeriod]);
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadMoodFlow = async () => {
            try {
                setLoading(true)
                const res: MoodFlowResponse = await dailyCheckInApi.getFlow(period)

                const points: MoodTrendPoint[] = res.items.map((item) => ({
                    label: item.date,
                    mood: item.mood,
                    energy: item.energy,
                }))

                setMoodTrendData(points)
                onDataChange?.(points)
            } catch (error) {
                console.error('[MoodFlow] Failed to load mood flow:', error)
                if (error instanceof Error) {
                    console.error('[MoodFlow] Error message:', error.message)
                }
                setMoodTrendData([])
            } finally {
                setLoading(false)
            }
        }

        void loadMoodFlow()
    }, [period, lastCheckInDate, onDataChange])

    return (
        <Card id="mood-flow-chart" className="border-border/50 shadow-md">
            <CardHeader>
                <div className="flex items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp size={20} className="text-primary" />
                        Mood Flow
                    </CardTitle>
                    <div className="flex gap-2 text-xs">
                        <button
                            type="button"
                            onClick={() => setPeriod('week')}
                            className={`px-3 py-1 rounded-full border ${period === 'week'
                                ? 'bg-primary text-white border-primary'
                                : 'bg-transparent text-foreground border-border hover:bg-muted'
                                }`}
                        >
                            7 days
                        </button>
                        <button
                            type="button"
                            onClick={() => setPeriod('month')}
                            className={`px-3 py-1 rounded-full border ${period === 'month'
                                ? 'bg-primary text-white border-primary'
                                : 'bg-transparent text-foreground border-border hover:bg-muted'
                                }`}
                        >
                            30 days
                        </button>
                        <button
                            type="button"
                            onClick={() => setPeriod('year')}
                            className={`px-3 py-1 rounded-full border ${period === 'year'
                                ? 'bg-primary text-white border-primary'
                                : 'bg-transparent text-foreground border-border hover:bg-muted'
                                }`}
                        >
                            1 year
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                        Loading...
                    </div>
                ) : moodTrendData.length === 0 ? (
                    <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                        No mood data available for this period
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={moodTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis dataKey="label" stroke="var(--color-muted-foreground)" />
                            <YAxis 
                                yAxisId="mood" 
                                domain={[0, 5]} 
                                stroke="var(--color-chart-1)" 
                                label={{ value: 'Mood', angle: -90, position: 'insideLeft', offset: 10 }}
                            />
                            <YAxis 
                                yAxisId="energy" 
                                orientation="right" 
                                domain={[0, 10]} 
                                stroke="var(--color-chart-2)" 
                                label={{ value: 'Energy', angle: 90, position: 'insideRight', offset: 10 }}
                            />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid var(--color-border)' }} />
                            <Legend />
                            <Line 
                                yAxisId="mood"
                                type="monotone" 
                                dataKey="mood" 
                                stroke="var(--color-chart-1)" 
                                strokeWidth={2} 
                                dot={{ r: 4 }} 
                                name="Mood (1-5)" 
                            />
                            <Line 
                                yAxisId="energy"
                                type="monotone" 
                                dataKey="energy" 
                                stroke="var(--color-chart-2)" 
                                strokeWidth={2} 
                                dot={{ r: 4 }} 
                                name="Energy (1-10)" 
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    )
}
