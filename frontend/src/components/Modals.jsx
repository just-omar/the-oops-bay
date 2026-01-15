import React, { useState } from 'react';
import { X, Save, Edit2, AlertTriangle, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function DeleteConfirmationModal({ container, onClose, onConfirm }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#111] border border-red-900/40 rounded-3xl w-full max-w-sm shadow-2xl p-0 overflow-hidden">
                <div className="h-36 bg-gradient-to-br from-red-900/30 to-black flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                        <AlertTriangle className="h-10 w-10" />
                    </div>
                </div>
                <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-3">Delete Container?</h2>
                    <p className="text-gray-300 text-base mb-8 leading-relaxed">
                        You are about to forcefully remove <br />
                        <span className="text-white font-mono bg-gray-800 px-3 py-1 rounded-lg mx-1 text-sm border border-gray-700">{container.name}</span>.
                        <br />This action is irreversible.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={onClose} className="px-5 py-3 rounded-xl bg-gray-800 text-gray-200 hover:bg-gray-700 font-bold transition-colors text-sm">
                            Cancel
                        </button>
                        <button onClick={onConfirm} className="px-5 py-3 rounded-xl bg-red-600 text-white hover:bg-red-500 font-bold transition-colors shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 text-sm">
                            <Trash2 className="h-5 w-5" /> Confirm
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export function EditModal({ container, onClose, onUpdate }) {
    const [alias, setAlias] = useState(container.alias || container.name);
    const [group, setGroup] = useState(container.group || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/settings/container', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: container.id, alias: alias, group_name: group })
            });
            if (res.ok) {
                onUpdate({ id: container.id, alias: alias, group: group, name: alias });
                onClose();
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#111] border border-gray-800 rounded-3xl w-full max-w-md shadow-2xl p-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
                        {/* Иконка Оранжевая */}
                        <Edit2 className="h-6 w-6 text-orange-500" />
                        Edit Container
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-gray-800/50 p-2 rounded-full hover:bg-gray-700">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Display Name</label>
                        <input type="text" value={alias} onChange={(e) => setAlias(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 text-white text-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder-gray-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Group</label>
                        <input type="text" value={group} onChange={(e) => setGroup(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 text-white text-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder-gray-600" />
                    </div>
                    <div className="flex gap-4 mt-10 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 px-6 py-3.5 rounded-xl bg-gray-800 text-gray-200 hover:bg-gray-700 font-bold transition-colors text-base">Cancel</button>

                        {/* Кнопка Save Оранжевая */}
                        <button type="submit" disabled={loading} className="flex-1 px-6 py-3.5 rounded-xl bg-orange-600 text-white hover:bg-orange-500 font-bold flex justify-center items-center gap-2 disabled:opacity-50 shadow-lg shadow-orange-900/20 text-base">
                            {loading ? 'Saving...' : <><Save className="h-5 w-5" /> Save</>}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}