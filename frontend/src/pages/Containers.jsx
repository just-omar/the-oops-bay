import React, { useState, useEffect } from 'react';
import { LayoutGrid, List, Search, Layers, AlertCircle, Network } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

import { ContainerCard } from '../components/ContainerCard';
import { PublicPortsList } from '../components/PublicPortsList';
import { Dashboard } from '../components/Dashboard';
import { EditModal, DeleteConfirmationModal } from '../components/Modals';

export function ContainersPage() {
    const [containers, setContainers] = useState([]);
    const [hostStats, setHostStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [search, setSearch] = useState('');
    const [selectedContainer, setSelectedContainer] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');

    // NEW: Состояние для отслеживания, какой контейнер сейчас обрабатывается
    const [processingId, setProcessingId] = useState(null);

    const fetchData = async () => {
        try {
            const [contRes, statsRes] = await Promise.all([
                fetch('/api/containers'),
                fetch('/api/stats/host')
            ]);

            if (!contRes.ok) throw new Error(`API Error: ${contRes.status}`);
            const contData = await contRes.json();
            if (Array.isArray(contData)) {
                setContainers(contData);
                setError(null);
            }

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setHostStats(statsData);
            }

            setLoading(false);
        } catch (err) {
            if (loading) setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleUpdate = (updatedContainer) => {
        setContainers(prev => prev.map(c => c.id === updatedContainer.id ? { ...c, ...updatedContainer } : c));
        fetchData();
    };

    const handleControl = async (id, action) => {
        // Включаем индикатор загрузки для конкретной карточки
        setProcessingId(id);

        try {
            if (action === 'remove') {
                // Для удаления убираем сразу
                setContainers(prev => prev.filter(c => c.id !== id));
            } else {
                // Оптимистичное обновление
                // FIX: Если action = restart, мы считаем, что он будет 'running'
                const nextState = (action === 'start' || action === 'restart') ? 'running' : 'exited';

                setContainers(prev => prev.map(c => {
                    if (c.id === id) {
                        return { ...c, state: nextState };
                    }
                    return c;
                }));
            }

            // Ждем выполнения команды на бэкенде
            await fetch(`/api/containers/${id}/${action}`, { method: 'POST' });

            // FIX: Убрали setTimeout. Обновляем данные сразу же после ответа.
            await fetchData();

        } catch (err) {
            alert("Action failed: " + err.message);
            fetchData();
        } finally {
            // Выключаем индикатор загрузки
            setProcessingId(null);
        }
    };

    const hasPublicPorts = (c) => (c.ports || []).some(p => p.split('->').length > 1 && p.split('->')[0] !== '0');

    const filteredContainers = containers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.image.toLowerCase().includes(search.toLowerCase());
        let matchesStatus = true;
        if (statusFilter === 'running') matchesStatus = c.state === 'running';
        else if (statusFilter === 'stopped') matchesStatus = c.state !== 'running';
        return matchesSearch && matchesStatus;
    });

    const groupedContainers = filteredContainers.reduce((groups, container) => {
        const groupName = container.group || 'Ungrouped';
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(container);
        return groups;
    }, {});

    const sortedGroupKeys = Object.keys(groupedContainers).sort((a, b) => {
        if (a === 'Ungrouped') return 1;
        if (b === 'Ungrouped') return -1;
        return a.localeCompare(b);
    });

    const statsCount = {
        total: containers.length,
        running: containers.filter(c => c.state === 'running').length,
        stopped: containers.filter(c => c.state !== 'running').length,
        forwarded: containers.filter(c => hasPublicPorts(c)).length,
    };

    return (
        <div className="pt-24 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            <Dashboard stats={hostStats} simpleMode={true} />

            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 mt-8">
                <div className="flex items-center space-x-2 text-sm font-medium overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    <FilterButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} icon={<Layers className="h-4 w-4" />} label={`All (${statsCount.total})`} />
                    <FilterButton active={statusFilter === 'running'} onClick={() => setStatusFilter('running')} color="green" icon={<div className={`w-2 h-2 rounded-full bg-green-500 ${statusFilter === 'running' ? 'animate-pulse' : ''}`} />} label={`Running (${statsCount.running})`} />
                    <FilterButton active={statusFilter === 'stopped'} onClick={() => setStatusFilter('stopped')} color="red" icon={<div className="w-2 h-2 rounded-full bg-red-500" />} label={`Stopped (${statsCount.stopped})`} />
                    <div className="w-px h-6 bg-gray-800 mx-1"></div>
                    <FilterButton active={statusFilter === 'forwarded'} onClick={() => setStatusFilter('forwarded')} color="blue" icon={<Network className="h-4 w-4" />} label={`Public Ports (${statsCount.forwarded})`} />
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex bg-gray-900/50 p-1 rounded-lg border border-gray-800/50">
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-gray-800 text-orange-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}><LayoutGrid className="h-4 w-4" /></button>
                        <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-gray-800 text-orange-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}><List className="h-4 w-4" /></button>
                    </div>
                    <div className="relative group flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-orange-400 transition-colors" />
                        <input type="text" placeholder="Search..." className="bg-gray-900/50 border border-gray-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent w-full md:w-48 transition-all hover:bg-gray-800" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>
            </div>

            {loading && !containers.length ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
                    <p className="text-gray-500 text-sm animate-pulse">Scanning dockers...</p>
                </div>
            ) : error && containers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="bg-red-900/20 p-4 rounded-full mb-4 text-red-500"><AlertCircle className="h-10 w-10" /></div>
                    <h2 className="text-xl font-bold text-white mb-2">Connection Failed</h2>
                    <p className="text-gray-400 max-w-md">{error}</p>
                    <button onClick={fetchData} className="mt-6 px-6 py-2 bg-orange-600 rounded-lg hover:bg-orange-500 transition-colors text-white font-medium">Retry</button>
                </div>
            ) : (
                <div className="space-y-12">
                    {statusFilter === 'forwarded' ? (
                        <PublicPortsList containers={filteredContainers} />
                    ) : (
                        sortedGroupKeys.map(groupName => (
                            <div key={groupName}>
                                {(groupName !== 'Ungrouped' || sortedGroupKeys.length > 1) && (
                                    <h2 className="text-xl font-bold text-gray-200 mb-6 flex items-center gap-3">
                                        <span className="w-1.5 h-6 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></span>
                                        {groupName} <span className="text-sm font-mono text-gray-400 bg-gray-900 px-2.5 py-0.5 rounded-lg border border-gray-800">{groupedContainers[groupName].length}</span>
                                    </h2>
                                )}
                                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                                    {groupedContainers[groupName].map((container) => (
                                        <ContainerCard
                                            key={container.id}
                                            container={container}
                                            viewMode={viewMode}
                                            // Передаем статус обработки
                                            isProcessing={processingId === container.id}
                                            onEdit={() => setSelectedContainer(container)}
                                            onAction={handleControl}
                                            onDelete={() => setDeleteTarget(container)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <AnimatePresence>
                {selectedContainer && <EditModal container={selectedContainer} onClose={() => setSelectedContainer(null)} onUpdate={handleUpdate} />}
                {deleteTarget && <DeleteConfirmationModal container={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { handleControl(deleteTarget.id, 'remove'); setDeleteTarget(null); }} />}
            </AnimatePresence>
        </div>
    );
}

function FilterButton({ active, onClick, icon, label, color = "gray" }) {
    const baseClass = "flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300 border text-sm font-medium whitespace-nowrap cursor-pointer";
    let activeClass = "bg-gray-800 text-white border-gray-600";
    if (color === "green") activeClass = "bg-green-900/20 text-green-400 border-green-500/30";
    if (color === "red") activeClass = "bg-red-900/20 text-red-400 border-red-500/30";
    if (color === "blue") activeClass = "bg-blue-900/20 text-blue-400 border-blue-500/30";
    const inactiveClass = "bg-transparent text-gray-500 border-transparent hover:bg-gray-900 hover:text-gray-300";
    return <button onClick={onClick} className={`${baseClass} ${active ? activeClass : inactiveClass}`}>{icon} <span>{label}</span></button>;
}