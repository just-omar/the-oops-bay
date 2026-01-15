import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Activity, LayoutGrid, BarChart2 } from 'lucide-react';

export function Navigation() {
    const location = useLocation();

    // Увеличили text-sm -> text-base
    // Заменили blue -> orange
    // Сделали неактивный текст ярче (text-gray-300)
    const navLinkClass = ({ isActive }) =>
        `flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all duration-300 font-medium text-base ${isActive
            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.15)]'
            : 'text-gray-300 hover:text-white hover:bg-gray-800/50 border border-transparent'
        }`;

    return (
        <nav className="border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl fixed top-0 w-full z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20"> {/* Увеличили высоту хедера h-16 -> h-20 */}
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-4">
                            {/* Логотип теперь Оранжевый */}
                            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2.5 rounded-xl shadow-lg shadow-orange-900/20">
                                <Activity className="h-7 w-7 text-white" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200">
                                the-oops-bay
                            </span>
                        </div>

                        <div className="hidden md:flex items-center space-x-2">
                            <NavLink to="/" className={navLinkClass}>
                                <LayoutGrid className="h-5 w-5" />
                                <span>Containers</span>
                            </NavLink>
                            <NavLink to="/analytics" className={navLinkClass}>
                                <BarChart2 className="h-5 w-5" />
                                <span>Analytics</span>
                            </NavLink>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* <div className="text-sm text-gray-400 font-mono font-medium">v1.2.0</div> */}
                    </div>
                </div>
            </div>
        </nav>
    );
}