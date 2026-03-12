import React from 'react';
import { Activity, BookOpen, Brain, Calendar, TrendingUp } from 'lucide-react';
import type { SummaryResponse } from '../../api/dailyCheckInApi';
import MoodFlow from './MoodFlow';
import TriggerHeatmap from './TriggerHeatmap';
import WordCloud from './WordCloud';

interface ReportTemplateProps {
    summary: SummaryResponse | null;
    timeRange: string;
    userName: string;
    dateRange: string;
    moodFlowImg?: string;
    heatmapImg?: string;
    wordCloudImg?: string;
    isPreview?: boolean;
    exportConfig?: {
        moodFlowRange: any;
        heatmapRange: any;
        wordCloudRange: any;
    };
}

const ReportTemplate = React.forwardRef<HTMLDivElement, ReportTemplateProps>((props, ref) => {
    const {
        summary,
        timeRange,
        userName,
        dateRange,
        moodFlowImg,
        heatmapImg,
        wordCloudImg,
        isPreview = false,
        exportConfig
    } = props;

    if (!summary) return null;

    const A4_PAGE_STYLE = {
        height: '1123px', // Exactly A4 height
        width: '794px',
        padding: '3rem',
        paddingBottom: '3.5rem',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1.25rem',
        backgroundColor: 'white',
        boxSizing: 'border-box' as const,
        position: 'relative' as const,
    };

    return (
        <div ref={ref} id="report-pdf-container" className="flex flex-col bg-slate-100 shadow-2xl overflow-visible">
            {/* PAGE 1: Overview & Mood Flow */}
            <div style={A4_PAGE_STYLE} className="border-b-2 border-slate-200">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-primary/20 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-primary mb-1">Healing Garden</h1>
                        <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Mental Health Progress Report</p>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold text-sm text-slate-800">{userName}</p>
                        <p className="text-sm text-slate-500">{dateRange}</p>
                        <p className="text-sm text-slate-500 capitalize">Analysis: {timeRange}</p>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { label: 'Avg Mood', value: summary.current.avgMood, icon: <Activity className="text-blue-500" size={18} />, suffix: '/5' },
                        { label: 'Consistency', value: `${summary.current.consistency}%`, icon: <Calendar className="text-green-500" size={18} /> },
                        { label: 'Journal Entries', value: summary.current.journalEntries, icon: <BookOpen className="text-purple-500" size={18} /> },
                        { label: 'AI Insights', value: summary.current.insightCount, icon: <Brain className="text-amber-500" size={18} /> },
                    ].map((metric) => (
                        <div key={metric.label} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2 mb-1">
                                {metric.icon}
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{metric.label}</span>
                            </div>
                            <div className="text-xl font-bold text-slate-800">{metric.value}{metric.suffix}</div>
                        </div>
                    ))}
                </div>

                {/* Comparative Table */}
                <div className="mt-1">
                    <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <TrendingUp size={20} className="text-primary" />
                        Comparative Analysis
                    </h3>
                    <table className="w-full h-full text-xs rounded-xl border border-slate-200">
                        <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                            <tr>
                                <th className="px-3 py-2 text-left">Metric</th>
                                <th className="px-3 py-2 text-center">Prev {timeRange}</th>
                                <th className="px-3 py-2 text-center">Curr {timeRange}</th>
                                <th className="px-3 py-2 text-center">Change</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-[11px]">
                            {[
                                { label: 'Avg Mood', key: 'avgMood', suffix: '/5' },
                                { label: 'Consistency', key: 'consistency', suffix: '%' },
                                { label: 'Journal Entries', key: 'journalEntries', suffix: '' },
                                { label: 'AI Insights', key: 'insightCount', suffix: '' },
                            ].map((item) => {
                                const curr = summary.current[item.key as keyof typeof summary.current] || 0;
                                const prev = summary.previous[item.key as keyof typeof summary.previous] || 0;
                                const diff = curr - prev;
                                const isPositive = diff > 0;

                                return (
                                    <tr key={item.label} className="bg-white">
                                        <td className="px-3 py-2 font-bold text-slate-700">{item.label}</td>
                                        <td className="px-3 py-2 text-center text-slate-500">{prev}{item.suffix}</td>
                                        <td className="px-3 py-2 text-center font-bold text-slate-900">{curr}{item.suffix}</td>
                                        <td className="px-3 py-2 text-center">
                                            <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                {diff > 0 ? '+' : ''}{Number(diff.toFixed(1))}{item.suffix}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mood Flow Trend */}
                <div className="flex flex-col gap-3 mt-8">
                    <h3 className="text-sm font-bold text-slate-800 border-l-4 border-primary pl-3 uppercase tracking-tight">Mood Flow Trend</h3>
                    <div id="pdf-mood-flow" className="bg-slate-50 rounded-xl border border-slate-200 min-h-[380px] flex items-stretch justify-center p-4">
                        {isPreview && exportConfig ? (
                            <div className="w-full h-full">
                                <MoodFlow defaultPeriod={exportConfig.moodFlowRange} />
                            </div>
                        ) : moodFlowImg ? (
                            <img src={moodFlowImg} alt="Mood Flow" className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-slate-400 italic text-sm">Visual data not available</span>
                        )}
                    </div>
                </div>

                <div className="mt-auto text-right text-[10px] text-slate-400 font-medium italic">
                    Healing Garden | Page 1 / 2
                </div>
            </div>

            {/* PAGE 2: Trigger Heatmap & Word Cloud */}
            <div style={A4_PAGE_STYLE}>
                {/* Header for Page 2 (Compact) */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                    <span className="text-primary font-bold text-sm tracking-widest uppercase">Deep Insights Analysis</span>
                    <span className="text-slate-400 text-[10px] italic font-medium uppercase">{userName} • {dateRange}</span>
                </div>

                {/* Trigger Factors */}
                <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-bold text-slate-800 border-l-4 border-primary pl-3 uppercase tracking-tight">Emotional Trigger Patterns</h3>
                    <div id="pdf-heatmap" className="bg-slate-50 rounded-xl border border-slate-200 min-h-[380px] p-4 flex items-center justify-center overflow-hidden font-sans">
                        {isPreview && exportConfig ? (
                            <div className="w-full h-full">
                                <TriggerHeatmap defaultPeriod={exportConfig.heatmapRange} />
                            </div>
                        ) : heatmapImg ? (
                            <img src={heatmapImg} alt="Heatmap" className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-slate-400 italic text-sm text-center px-8">Identifying trigger correlations...</span>
                        )}
                    </div>
                </div>

                {/* Word Cloud */}
                <div className="flex flex-col gap-3 mt-4 flex-1">
                    <h3 className="text-sm font-bold text-slate-800 border-l-4 border-primary pl-3 uppercase tracking-tight">Common Themes & Expressions</h3>
                    <div id="pdf-word-cloud" className="bg-slate-50 rounded-xl border border-slate-200 min-h-[340px] p-4 flex items-center justify-center flex items-center justify-center">
                        {isPreview && exportConfig ? (
                            <div className="w-full h-full scale-[1] origin-center"><WordCloud defaultPeriod={exportConfig.wordCloudRange} /></div>
                        ) : wordCloudImg ? (
                            <img src={wordCloudImg} alt="Word Cloud" className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-slate-400 italic text-sm flex items-center gap-2">
                                <Brain size={18} /> Processing semantic data...
                            </span>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-6 border-t border-slate-100 italic text-slate-400 text-[10px] text-center flex justify-between items-center font-bold tracking-widest uppercase">
                    <p>Generated by Healing Garden AI • Professional Mental Tracking</p>
                    <p className="text-slate-800">Page 2 / 2</p>
                </div>
            </div>
        </div>
    );
});

ReportTemplate.displayName = 'ReportTemplate';

export default ReportTemplate;
