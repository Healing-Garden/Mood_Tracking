import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/Card"
import { dailyCheckInApi, type WordCloudWord } from "../../api/dailyCheckInApi"

type Period = "week" | "month" | "year"

interface WordCloudProps {
    defaultPeriod?: Period
}

export default function WordCloud({ defaultPeriod = "month" }: WordCloudProps) {
    const [period, setPeriod] = useState<Period>(defaultPeriod)
    const [words, setWords] = useState<WordCloudWord[]>([])
    const [layoutWords, setLayoutWords] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Sync period
    useEffect(() => {
        setPeriod(defaultPeriod)
    }, [defaultPeriod])

    // Fetch words
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
                if (!cancelled) setError(err?.message || "Failed to load word cloud")
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [period])

    // Calculate layout using d3-cloud
    useEffect(() => {
        if (words.length === 0) {
            setLayoutWords([])
            return
        }

        const width = 1400
        const height = 350
        const maxValue = Math.max(...words.map((w) => w.value), 1)

        const preparedWords = [...words]
            .sort((a, b) => b.value - a.value)
            .slice(0, 22)
            .map((w) => {
                const size = 20 + (w.value / maxValue) * 45
                return {
                    text: w.text,
                    size,
                    value: w.value
                }
            })

        // Deterministic Pseudo-Random based on current words so layout doesn't jump on accidental re-renders
        let seed = preparedWords.reduce((acc, w) => acc + w.text.length + w.value, 1)
        const random = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        }

        const placedWords: any[] = []
        const maxAttempts = 500

        // Boundaries for center (0,0) based on 800x500 svg, factoring in padding
        const boundX = width / 2
        const boundY = height / 2

        preparedWords.forEach((word) => {
            const padding = word.size * 0.4;
            // Larger cloud foundations for "fluffy" look matching reference image
            const cw = word.text.length * (word.size * 0.6) + padding * 3.5;
            const ch = word.size * 2.5;

            // Collision radius (add 12px extra spacing cushion)
            const halfW = cw / 2 + 12
            const halfH = ch / 2 + 10

            const maxX = boundX - halfW - 20; // Full utilization of 1400px width
            const maxY = boundY - halfH - 10;

            let placed = false;

            for (let i = 0; i < maxAttempts; i++) {
                // Extremely aggressive X bias (0.2) to push to edges
                const bx = (r: number) => Math.sign(r) * Math.pow(Math.abs(r), 0.2)
                const by = (r: number) => Math.sign(r) * Math.pow(Math.abs(r), 0.75)

                const rx = random() * 2 - 1
                const ry = random() * 2 - 1

                const x = bx(rx) * maxX
                const y = by(ry) * maxY

                const left = x - halfW
                const right = x + halfW
                const top = y - halfH
                const bottom = y + halfH

                let collision = false;
                for (const pw of placedWords) {
                    if (
                        left < pw.x + pw.halfW &&
                        right > pw.x - pw.halfW &&
                        top < pw.y + pw.halfH &&
                        bottom > pw.y - pw.halfH
                    ) {
                        collision = true;
                        break;
                    }
                }

                if (!collision) {
                    placedWords.push({ ...word, x, y, cw, ch, halfW, halfH });
                    placed = true;
                    break;
                }
            }

            if (!placed) {
                placedWords.push({
                    ...word,
                    x: (random() * 2 - 1) * maxX * 0.95,
                    y: (random() * 2 - 1) * maxY * 0.9,
                    cw,
                    ch,
                    halfW,
                    halfH
                });
            }
        })

        setLayoutWords(placedWords)
    }, [words])

    // Get color based on relative frequency
    const getWordColor = (size: number) => {
        const ratio = size / (20 + 50)
        if (ratio > 0.8) return "fill-indigo-700 font-extrabold"
        if (ratio > 0.6) return "fill-indigo-600 font-bold"
        if (ratio > 0.4) return "fill-violet-500 font-semibold"
        return "fill-slate-700 font-medium"
    }

    return (
        <Card id="word-cloud-chart" className="border-border w-full shadow-md overflow-hidden h-[380px] group">
            <CardHeader className="relative z-10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-primary flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            Mindful Themes
                        </CardTitle>
                        <CardDescription>
                            A visual landscape of your emotional vocabulary
                        </CardDescription>
                    </div>

                    <div className="flex gap-2">
                        {(["week", "month", "year"] as Period[]).map((p) => (
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

            <CardContent className="relative w-full h-[340px] p-0 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center gap-4 animate-in">
                        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Cultivating concepts...</p>
                    </div>
                ) : error ? (
                    <div className="p-6 bg-red-50 border-2 border-red-100 rounded-3xl text-red-700 font-bold text-sm">
                        {error}
                    </div>
                ) : words.length === 0 ? (
                    <div className="flex flex-col items-center text-center gap-4 py-20">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-dashed border-slate-200">
                            <span className="text-2xl text-slate-300 opacity-50">☁️</span>
                        </div>
                        <p className="text-sm font-medium text-slate-400 max-w-[200px]">
                            Your emotional sky is clear. Start journaling to see your themes!
                        </p>
                    </div>
                ) : (
                    <div className="relative w-full h-full">
                        {/* Interactive Word Cloud */}
                        <svg
                            className="relative z-10 w-full h-full"
                            viewBox="-700 -170 1400 340"
                            preserveAspectRatio="xMidYMid meet"
                        >
                            <defs>
                                <filter id="cloud-shadow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#bab7f4ff" floodOpacity="0.1" />
                                </filter>
                            </defs>

                            <g>
                                <AnimatePresence mode="popLayout">
                                    {layoutWords.map((word, i) => {
                                        const { cw, ch } = word;
                                        const driftY = i % 2 === 0 ? 12 : -12;
                                        const durationY = 4 + (i % 5);

                                        // Precise 7-lobe "clover/bubbly" path using Arcs
                                        // This creates individual semicircular lobes like the reference image
                                        const lw = cw * 0.42;
                                        const lh = ch * 0.42;
                                        
                                        const path = `
                                            M ${-cw/2} 0
                                            A ${lw/2} ${lh/2} 0 0 1 ${-cw/3} ${-ch/3}
                                            A ${lw/1.5} ${lh/1.5} 0 0 1 0 ${-ch/1.8}
                                            A ${lw/1.5} ${lh/1.5} 0 0 1 ${cw/3} ${-ch/3}
                                            A ${lw/2} ${lh/2} 0 0 1 ${cw/2} 0
                                            A ${lw/2.5} ${lh/2.5} 0 0 1 ${cw/3} ${ch/3.5}
                                            A ${lw/2} ${lh/2} 0 0 1 ${-cw/3} ${ch/3.5}
                                            A ${lw/2.5} ${lh/2.5} 0 0 1 ${-cw/2} 0
                                            Z
                                        `;

                                        return (
                                            <motion.g
                                                key={`${word.text}-${period}`}
                                                initial={{ opacity: 0, scale: 0.6, x: word.x, y: word.y }}
                                                animate={{ 
                                                    opacity: 1, 
                                                    scale: 1,
                                                    y: [word.y, word.y + driftY, word.y]
                                                }}
                                                transition={{
                                                    opacity: { duration: 0.8 },
                                                    scale: { duration: 0.8, type: "spring", damping: 12 },
                                                    y: { duration: durationY, repeat: Infinity, ease: "easeInOut" }
                                                }}
                                            >
                                                <g filter="url(#cloud-shadow)">
                                                    <path
                                                        d={path}
                                                        fill="#e6e2f9ff"
                                                        stroke="#e8e4f6ff"
                                                        strokeWidth="1"
                                                    />
                                                </g>

                                                {/* Centered Word Text */}
                                                <text
                                                    className={`cursor-default select-none ${getWordColor(word.size)} font-lexend`}
                                                    style={{
                                                        fontSize: `${word.size}px`,
                                                        textAnchor: "middle",
                                                        dominantBaseline: "central"
                                                    }}
                                                >
                                                    {word.text}
                                                </text>
                                            </motion.g>
                                        );
                                    })}
                                </AnimatePresence>
                            </g>
                        </svg>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}