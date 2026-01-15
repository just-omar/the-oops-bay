import React, { useState, useEffect } from 'react';
import { Box, Globe, Play, Square, RotateCw, Trash2, Cpu, Network, ExternalLink, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function ContainerCard({ container, viewMode, onEdit, onAction, onDelete, isProcessing }) {
    const isRunning = container.state === 'running';
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (!isRunning) {
            setStats(null);
            return;
        }

        const fetchStats = async () => {
            try {
                const res = await fetch(`/api/containers/${container.id}/stats`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.memory_usage) setStats(data);
                }
            } catch (e) { }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, [container.id, isRunning]);

    const formatBytes = (bytes) => {
        if (!bytes) return '0B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
    };

    const processPorts = (rawPorts) => {
        if (!rawPorts) return [];
        const unique = new Set();
        const result = [];
        rawPorts.forEach(p => {
            const parts = p.split('->');
            if (parts.length < 2) return;
            const pubPort = parseInt(parts[0], 10);
            const privPart = parts[1].split('/')[0];
            if (pubPort !== 0 && !unique.has(pubPort)) {
                unique.add(pubPort);
                result.push({ port: pubPort, type: 'public' });
            } else if (privPart && !unique.has(privPart)) {
                unique.add(privPart);
                result.push({ port: privPart, type: 'internal' });
            }
        });
        return result.sort((a, b) => a.type === 'public' ? -1 : 1);
    };

    const displayPorts = processPorts(container.ports);

    const statusColor = isRunning
        ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]'
        : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]';

    const renderPort = (item, idx) => {
        const isPublic = item.type === 'public';
        const classes = `relative group/port px-3 py-1.5 rounded-lg border text-sm font-mono flex items-center gap-2 transition-all shadow-sm ${isPublic
            ? 'bg-orange-500/10 border-orange-500/30 text-orange-300 hover:bg-orange-500/20 hover:border-orange-400 cursor-pointer'
            : 'bg-gray-800/80 border-gray-700 text-gray-300 cursor-default'
            }`;

        const content = (
            <>
                {isPublic ? <Globe className="h-4 w-4 text-orange-400" /> : <Network className="h-4 w-4" />}
                {item.port}
                {isPublic && <ExternalLink className="h-3.5 w-3.5 opacity-50 ml-1" />}
            </>
        );

        if (isPublic) {
            return (
                <a key={idx} href={`http://localhost:${item.port}`} target="_blank" rel="noopener noreferrer" className={classes} onClick={(e) => e.stopPropagation()}>
                    {content}
                </a>
            );
        }
        return <div key={idx} className={classes}>{content}</div>;
    };

    // --- GRID VIEW ---
    if (viewMode === 'grid') {
        return (
            <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={onEdit}
                className="group relative flex flex-col justify-between bg-gray-900/60 border border-gray-800 rounded-2xl p-7 hover:border-orange-500/40 transition-all hover:shadow-2xl hover:shadow-orange-900/10 backdrop-blur-sm cursor-pointer overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity group-hover:opacity-100 opacity-0" />

                <div className="flex justify-between items-start mb-6 z-10">
                    <div className="relative w-14 h-14">
                        <div className="absolute -top-1 -right-1 z-20">
                            {/* Если процессинг, показываем желтый индикатор, иначе статус */}
                            {isProcessing ? (
                                <span className="relative flex h-3.5 w-3.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-yellow-500"></span>
                                </span>
                            ) : (
                                <span className={`relative flex h-3.5 w-3.5`}>
                                    {isRunning && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                                    <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${isRunning ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                </span>
                            )}
                        </div>
                        <div className="w-full h-full bg-gray-800/80 rounded-2xl flex items-center justify-center border border-gray-700 group-hover:scale-105 transition-transform duration-300 shadow-inner">
                            <Box className="h-7 w-7 text-orange-400" />
                        </div>
                    </div>

                    <div className="flex gap-2 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0" onClick={(e) => e.stopPropagation()}>
                        {/* Если идет процесс - показываем спиннер, иначе кнопки */}
                        {isProcessing ? (
                            <div className="p-2.5">
                                <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
                            </div>
                        ) : (
                            // Кнопки управления появляются при ховере
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {isRunning ? (
                                    <>
                                        <ControlButton onClick={() => onAction(container.id, 'restart')} icon={<RotateCw className="h-5 w-5" />} color="yellow" />
                                        <ControlButton onClick={() => onAction(container.id, 'stop')} icon={<Square className="h-5 w-5 fill-current" />} color="red" />
                                    </>
                                ) : (
                                    <ControlButton onClick={() => onAction(container.id, 'start')} icon={<Play className="h-5 w-5 fill-current" />} color="green" />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mb-5 z-10">
                    <h3 className="text-2xl font-bold text-gray-100 mb-1.5 group-hover:text-orange-400 transition-colors truncate tracking-tight">{container.name}</h3>
                    <p className="text-sm text-gray-400 font-mono truncate flex items-center gap-2">
                        <Cpu className="h-4 w-4" /> {container.image}
                    </p>
                </div>

                {/* STATS BAR */}
                {isRunning && stats && !isProcessing && (
                    <div className="mb-5 z-10">
                        <div className="flex justify-between text-xs text-gray-300 mb-1.5 font-mono">
                            <span>RAM Usage</span>
                            <span className="text-white">{formatBytes(stats.memory_usage)} / {formatBytes(stats.memory_limit)}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(stats.memory_percent, 100)}%` }}
                                className={`h-full rounded-full ${stats.memory_percent > 80 ? 'bg-red-500' : 'bg-orange-500'}`}
                            />
                        </div>
                    </div>
                )}
                {/* Плейсхолдер для статов, если контейнер выключается/перезагружается */}
                {isProcessing && (
                    <div className="mb-5 z-10">
                        <div className="flex justify-between text-xs text-gray-500 mb-1.5 font-mono">
                            <span>Status</span>
                            <span>Updating...</span>
                        </div>
                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden animate-pulse">
                            <div className="h-full w-1/2 bg-gray-700 rounded-full" />
                        </div>
                    </div>
                )}

                <div className="mt-auto space-y-4 pt-5 border-t border-gray-800 z-10">
                    <div className="flex flex-wrap gap-2">
                        {displayPorts.length > 0 ? displayPorts.map((item, idx) => renderPort(item, idx)) : <span className="text-sm text-gray-500 italic">No exposed ports</span>}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 font-medium capitalize">
                            {isProcessing ? 'Processing...' : container.status}
                        </span>
                        {!isProcessing && (
                            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white">
                                <Trash2 className="h-4 w-4" /> <span>Delete</span>
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    }

    // --- LIST VIEW ---
    return (
        <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={onEdit} className="group bg-gray-900/60 border border-gray-800 rounded-xl p-5 flex items-center gap-5 hover:border-orange-500/40 transition-all cursor-pointer">
            {isProcessing ? (
                <Loader2 className="h-4 w-4 text-yellow-500 animate-spin shrink-0" />
            ) : (
                <div className={`w-3 h-3 rounded-full shrink-0 ${statusColor}`} />
            )}

            <div className="flex-1 min-w-0 mr-4">
                <h3 className="font-bold text-gray-100 text-xl group-hover:text-orange-400 transition-colors truncate">{container.name}</h3>
                <div className="flex items-center gap-6 mt-1">
                    <p className="text-sm text-gray-400 font-mono truncate">{container.image}</p>
                    {isRunning && stats && !isProcessing && (
                        <div className="flex items-center gap-3 w-40">
                            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div style={{ width: `${stats.memory_percent}%` }} className="h-full bg-orange-500 rounded-full" />
                            </div>
                            <span className="text-xs text-gray-300 font-mono whitespace-nowrap">{formatBytes(stats.memory_usage)}</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-3">
                {displayPorts.length > 0 ? displayPorts.map((item, idx) => renderPort(item, idx)) : null}
            </div>
        </motion.div>
    );
}

function ControlButton({ onClick, icon, color }) {
    const colors = {
        yellow: "hover:bg-yellow-500 hover:text-black text-yellow-500 bg-yellow-500/10",
        red: "hover:bg-red-500 hover:text-white text-red-500 bg-red-500/10",
        green: "hover:bg-green-500 hover:text-white text-green-500 bg-green-500/10",
    };
    return (
        <button onClick={onClick} className={`p-2.5 rounded-xl transition-all ${colors[color] || "text-gray-400 hover:bg-gray-800"}`}>
            {icon}
        </button>
    )
}