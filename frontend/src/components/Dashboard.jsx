import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, HardDrive, Database, Server, Activity, Eye, EyeOff } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const Widget = ({ label, value, sub, icon, color, footer, isIp }) => {
    const [revealed, setRevealed] = useState(false);

    // Логика для скрытия IP
    const displayValue = isIp && !revealed ? '•••.•••.•••.•••' : value;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/60 border border-gray-800 backdrop-blur-md p-5 rounded-2xl relative overflow-hidden group hover:border-gray-700 transition-colors"
        >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50`} />

            <div className="flex justify-between items-start mb-2 relative z-10">
                <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <h3 className={`text-2xl font-bold text-gray-100 ${isIp ? 'font-mono tracking-tighter' : ''}`}>
                            {displayValue}
                        </h3>

                        {/* Кнопка "Глаз" для IP */}
                        {isIp && (
                            <button
                                onClick={() => setRevealed(!revealed)}
                                className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                            >
                                {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        )}
                    </div>
                    {/* Подпись снизу стала понятнее */}
                    {sub && <span className="text-xs text-gray-400 font-medium block mt-1">{sub}</span>}
                </div>

                <div className={`p-2.5 rounded-xl bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
                    {icon}
                </div>
            </div>
            {footer && <div className="mt-3 relative z-10">{footer}</div>}
        </motion.div>
    );
};

export function Dashboard({ stats, history, containerStats, simpleMode = false }) {
    if (!stats) return null;

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatUptime = (seconds) => {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        return `Up: ${days}d ${hours}h`;
    };

    const pieData = containerStats ? [
        { name: 'Running', value: containerStats.running, color: '#22c55e' },
        { name: 'Stopped', value: containerStats.stopped, color: '#ef4444' },
    ] : [];

    return (
        <div className={simpleMode ? "mb-8" : "space-y-6 mb-10"}>
            {/* --- WIDGETS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Widget
                    label="CPU Load"
                    value={`${stats.cpu_percent.toFixed(1)}%`}
                    sub={`${stats.cpu_cores} Cores detected`}
                    color="blue"
                    icon={<Cpu className="h-5 w-5" />}
                    footer={
                        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div style={{ width: `${stats.cpu_percent}%` }} className="h-full bg-blue-500 rounded-full transition-all duration-500" />
                        </div>
                    }
                />
                <Widget
                    label="RAM Usage"
                    value={formatBytes(stats.memory_used)}
                    sub={`of ${formatBytes(stats.memory_total)} Total`}
                    color="purple"
                    icon={<Database className="h-5 w-5" />}
                    footer={
                        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div style={{ width: `${(stats.memory_used / stats.memory_total) * 100}%` }} className="h-full bg-purple-500 rounded-full transition-all duration-500" />
                        </div>
                    }
                />
                <Widget
                    label="Disk Usage"
                    value={formatBytes(stats.disk_used)}
                    sub={`Free: ${formatBytes(stats.disk_total - stats.disk_used)}`}
                    color="green"
                    icon={<HardDrive className="h-5 w-5" />}
                    footer={
                        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div style={{ width: `${stats.disk_percent}%` }} className="h-full bg-green-500 rounded-full transition-all duration-500" />
                        </div>
                    }
                />
                <Widget
                    label="Server IP"
                    value={stats.host_ip}
                    isIp={true} // Включаем режим скрытия
                    sub={formatUptime(stats.uptime)}
                    color="orange"
                    icon={<Server className="h-5 w-5" />}
                    footer={
                        <div className="text-[10px] text-gray-500 truncate mt-1" title={stats.host_os}>
                            {stats.host_os}
                        </div>
                    }
                />
            </div>

            {/* --- CHARTS (Скрыты в simpleMode) --- */}
            {!simpleMode && history && containerStats && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="lg:col-span-2 bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md min-h-[300px]"
                    >
                        <div className="flex items-center gap-2 mb-6">
                            <Activity className="h-5 w-5 text-blue-400" />
                            <h3 className="font-bold text-gray-200">System Load History</h3>
                        </div>
                        <div className="h-[240px] w-full relative">
                            <div className="absolute inset-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={history}>
                                        <defs>
                                            <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                        <XAxis dataKey="timeLabel" hide />

                                        {/* УВЕЛИЧЕННЫЙ И ЯРКИЙ ШРИФТ */}
                                        <YAxis
                                            stroke="#9ca3af"
                                            fontSize={12}
                                            tick={{ fill: '#e5e7eb' }} // Ярко-белый цвет (gray-200)
                                            tickFormatter={(v) => `${v}%`}
                                            domain={[0, 100]}
                                        />

                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                                            itemStyle={{ color: '#60a5fa' }}
                                        />
                                        <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} fill="url(#colorCpu)" isAnimationActive={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md flex flex-col items-center justify-center min-h-[300px]"
                    >
                        <h3 className="font-bold text-gray-200 mb-4 w-full text-left flex items-center gap-2">
                            <Server className="h-5 w-5 text-purple-400" /> Containers Health
                        </h3>
                        <div className="relative w-[200px] h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-bold text-white">{containerStats.total}</span>
                                <span className="text-xs text-gray-500 uppercase">Total</span>
                            </div>
                        </div>
                        <div className="flex gap-4 mt-6 w-full justify-center">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-sm text-gray-400">Running ({containerStats.running})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span className="text-sm text-gray-400">Stopped ({containerStats.stopped})</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}