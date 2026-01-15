import React from 'react';
import { motion } from 'framer-motion';
import { Globe, ExternalLink, Box, ArrowRight } from 'lucide-react';

export function PublicPortsList({ containers }) {
    // Функция для извлечения уникальных публичных портов
    const getUniquePublicPorts = (ports) => {
        if (!ports) return [];
        const seen = new Set();
        const uniquePorts = [];

        ports.forEach(p => {
            const parts = p.split('->');
            if (parts.length > 1) {
                const publicPort = parts[0];
                // Игнорируем порт "0" и дубликаты
                if (publicPort !== '0' && !seen.has(publicPort)) {
                    seen.add(publicPort);
                    uniquePorts.push(publicPort);
                }
            }
        });
        return uniquePorts;
    };

    const containersWithPorts = containers.filter(c => getUniquePublicPorts(c.ports).length > 0);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
        >
            <div className="grid grid-cols-1 gap-4">
                {containersWithPorts.map((container) => {
                    const publicPorts = getUniquePublicPorts(container.ports);

                    return (
                        <motion.div
                            key={container.id}
                            className="bg-gray-900/40 border border-gray-800/50 rounded-2xl p-5 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-500/30 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                    <Box className="h-6 w-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-100 text-lg">{container.name}</h3>
                                    <p className="text-xs text-gray-500 font-mono">{container.image}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {publicPorts.map((port, idx) => (
                                    <a
                                        key={idx}
                                        href={`http://${window.location.hostname}:${port}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center gap-3 bg-gray-800/50 hover:bg-blue-600/20 border border-gray-700 hover:border-blue-500/50 px-4 py-2 rounded-xl transition-all"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
                                            <span className="text-sm font-mono font-bold text-gray-200">{port}</span>
                                        </div>
                                        <ArrowRight className="h-3 w-3 text-gray-600 group-hover:text-blue-400" />
                                        <ExternalLink className="h-3.5 w-3.5 text-gray-500 group-hover:text-blue-400" />
                                    </a>
                                ))}
                            </div>
                        </motion.div>
                    );
                })}

                {containersWithPorts.length === 0 && (
                    <div className="py-20 text-center border-2 border-dashed border-gray-800 rounded-3xl">
                        <Globe className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                        <p className="text-gray-500">No public ports exposed</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}