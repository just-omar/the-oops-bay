import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Cpu, HardDrive, Database, Server, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

export function AnalyticsPage() {
    const [period, setPeriod] = useState('live');
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Состояние для скрытия IP в заголовке
    const [showIp, setShowIp] = useState(false);

    const formatBytes = (bytes, decimals = 1) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    };

    useEffect(() => {
        let interval;

        const fetchData = async () => {
            try {
                if (period === 'live') {
                    const res = await fetch('/api/stats/host');
                    const data = await res.json();
                    setStats(data);

                    setHistory(prev => {
                        const timePoint = data.timestamp ? new Date(data.timestamp) : new Date();
                        const newPoint = {
                            timestamp: timePoint.toISOString(),
                            timeLabel: format(timePoint, 'HH:mm:ss'),
                            cpu: data.cpu_percent,
                            memory: data.memory_used,
                            disk: data.disk_used
                        };
                        const newHist = [...prev, newPoint];
                        if (newHist.length > 60) newHist.shift();
                        return newHist;
                    });
                    setLoading(false);
                } else {
                    const res = await fetch(`/api/stats/history?period=${period}`);
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        const processed = data.map(d => ({
                            ...d,
                            timeLabel: period === '1h' ? format(new Date(d.timestamp), 'HH:mm') :
                                format(new Date(d.timestamp), 'dd MMM HH:mm')
                        }));
                        setHistory(processed);

                        if (processed.length > 0) {
                            const hostRes = await fetch('/api/stats/host');
                            if (hostRes.ok) {
                                const hostData = await hostRes.json();
                                setStats(prev => ({ ...hostData, ...prev }));
                            }
                        }
                    }
                    setLoading(false);
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchData();

        if (period === 'live') {
            interval = setInterval(fetchData, 2000);
        } else {
            interval = setInterval(fetchData, 60000);
        }

        return () => clearInterval(interval);
    }, [period]);

    useEffect(() => {
        if (period === 'live') setHistory([]);
    }, [period]);

    const periods = [
        { id: 'live', label: 'Live' },
        { id: '1h', label: '1 Hour' },
        { id: '24h', label: '24 Hours' },
    ];

    return (
        <div className="pt-24 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

            {/* HEADER */}
            {/* TOP NAVIGATION & SERVER INFO */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div className="flex flex-wrap items-center gap-3">
                    {/* HOSTNAME BLOCK */}
                    <div className="flex items-center gap-3 bg-gray-900/40 border border-gray-800/50 px-4 py-2 rounded-2xl backdrop-blur-md shadow-sm group hover:border-blue-500/30 transition-all">
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase text-blue-500 font-black tracking-[0.15em] mb-1">Hostname</span>
                            <div className="flex items-center gap-2">
                                <Server className="h-4 w-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                                <span className="text-gray-100 font-bold tracking-wide text-sm">
                                    {stats?.host_name || 'Detecting...'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* SEPARATOR (Desktop only) */}
                    <div className="h-10 w-px bg-gradient-to-b from-transparent via-gray-800 to-transparent hidden md:block mx-1" />

                    {/* PUBLIC IP BLOCK */}
                    <div className="flex items-center gap-3 bg-gray-900/40 border border-gray-800/50 px-4 py-2 rounded-2xl backdrop-blur-md shadow-sm group hover:border-blue-500/30 transition-all">
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase text-purple-500 font-black tracking-[0.15em] mb-1">Public Address</span>
                            <div
                                className="flex items-center gap-2 cursor-pointer"
                                onClick={() => setShowIp(!showIp)}
                            >
                                <span className={`font-mono text-sm font-bold ${showIp ? "text-gray-100" : "text-gray-600"}`}>
                                    {showIp ? (stats?.host_ip || '0.0.0.0') : '•••.•••.•••.•••'}
                                </span>
                                {showIp ? (
                                    <EyeOff className="h-3.5 w-3.5 text-gray-500 hover:text-white transition-colors" />
                                ) : (
                                    <Eye className="h-3.5 w-3.5 text-gray-500 hover:text-white transition-colors" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* PERIOD SELECTOR */}
                <div className="bg-gray-900/80 p-1.5 rounded-2xl border border-gray-800 flex items-center shadow-2xl backdrop-blur-xl">
                    {periods.map(p => (
                        <button
                            key={p.id}
                            onClick={() => { setPeriod(p.id); setLoading(true); }}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${period === p.id
                                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-105'
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading && history.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* CPU CHART */}
                    <ChartCard
                        title="CPU Usage"
                        icon={<Cpu className="h-5 w-5 text-blue-400" />}
                        color="#3b82f6"
                        currentValue={`${stats?.cpu_percent?.toFixed(1) || 0}%`}
                        maxValue="100%"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history}>
                                <defs>
                                    <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis
                                    dataKey="timeLabel"
                                    stroke="#9ca3af"
                                    fontSize={12} // Шрифт крупнее
                                    tick={{ fill: '#e5e7eb' }} // Цвет ярче (белый)
                                    tickMargin={10}
                                    minTickGap={30}
                                />
                                <YAxis
                                    stroke="#9ca3af"
                                    fontSize={12}
                                    domain={[0, 100]}
                                    tickFormatter={v => `${v}%`}
                                    tick={{ fill: '#e5e7eb' }}
                                />
                                <Tooltip content={<CustomTooltip unit="%" />} />
                                <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} fill="url(#cpuGrad)" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* MEMORY CHART */}
                    <ChartCard
                        title="Memory Usage"
                        icon={<Database className="h-5 w-5 text-purple-400" />}
                        color="#a855f7"
                        currentValue={formatBytes(stats?.memory_used || 0)}
                        maxValue={formatBytes(stats?.memory_total || 0)}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history}>
                                <defs>
                                    <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis
                                    dataKey="timeLabel"
                                    stroke="#9ca3af"
                                    fontSize={12}
                                    tick={{ fill: '#e5e7eb' }}
                                    tickMargin={10}
                                    minTickGap={30}
                                />
                                <YAxis
                                    stroke="#9ca3af"
                                    fontSize={12}
                                    domain={[0, stats?.memory_total || 'auto']}
                                    tickFormatter={v => formatBytes(v, 0)}
                                    tick={{ fill: '#e5e7eb' }}
                                />

                                <Tooltip content={<CustomTooltip formatter={formatBytes} total={stats?.memory_total} />} />
                                <Area type="monotone" dataKey="memory" stroke="#a855f7" strokeWidth={2} fill="url(#memGrad)" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* DISK CHART */}
                    <ChartCard
                        title="Disk Usage"
                        icon={<HardDrive className="h-5 w-5 text-green-400" />}
                        color="#22c55e"
                        currentValue={formatBytes(stats?.disk_used || 0)}
                        maxValue={formatBytes(stats?.disk_total || 0)}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history}>
                                <defs>
                                    <linearGradient id="diskGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis
                                    dataKey="timeLabel"
                                    stroke="#9ca3af"
                                    fontSize={12}
                                    tick={{ fill: '#e5e7eb' }}
                                    tickMargin={10}
                                    minTickGap={30}
                                />
                                <YAxis
                                    stroke="#9ca3af"
                                    fontSize={12}
                                    domain={[0, stats?.disk_total || 'auto']}
                                    tickFormatter={v => formatBytes(v, 0)}
                                    tick={{ fill: '#e5e7eb' }}
                                />

                                <Tooltip content={<CustomTooltip formatter={formatBytes} total={stats?.disk_total} />} />
                                <Area type="monotone" dataKey="disk" stroke="#22c55e" strokeWidth={2} fill="url(#diskGrad)" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            )}
        </div>
    );
}

function ChartCard({ title, icon, children, currentValue, maxValue, color }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md flex flex-col h-[350px]"
        >
            <div className="flex justify-between items-start mb-6 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-800/50 border border-gray-700">{icon}</div>
                    <div>
                        <h3 className="font-bold text-gray-200">{title}</h3>
                        <p className="text-xs text-gray-500">History Trend</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xl font-bold text-white" style={{ color }}>{currentValue}</div>
                    <div className="text-xs text-gray-500">of {maxValue}</div>
                </div>
            </div>
            <div className="flex-1 w-full min-h-0 relative">
                <div className="absolute inset-0">
                    {children}
                </div>
            </div>
        </motion.div>
    )
}

const CustomTooltip = ({ active, payload, label, unit, formatter, total }) => {
    if (active && payload && payload.length) {
        const val = payload[0].value;
        return (
            <div className="bg-gray-900 border border-gray-700 p-3 rounded-xl shadow-xl z-50">
                <p className="text-gray-400 text-xs mb-1">{label}</p>
                <div className="text-white font-bold font-mono">
                    <span className="text-lg">{formatter ? formatter(val) : `${val.toFixed(1)}${unit || ''}`}</span>
                    {total && (
                        <span className="text-gray-500 text-xs ml-2">
                            / {formatter(total)}
                        </span>
                    )}
                </div>
            </div>
        );
    }
    return null;
};