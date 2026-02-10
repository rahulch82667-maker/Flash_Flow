"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [showProfile, setShowProfile] = useState(false);

    useEffect(() => {
        fetch('/api/user/me')
            .then(res => res.json())
            .then(data => setUser(data));
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Dashboard Navbar */}
            <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-3 flex items-center justify-between sticky top-0 z-50">
                {/* Brand Section with Hover Effect */}
                <div className="flex items-center gap-2 group cursor-default">
                    <div className="bg-black rounded-full p-1 overflow-hidden flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
                        <Image
                            src="/Finance_logo.png"
                            alt="Logo"
                            width={32}
                            height={32}
                            className="invert object-contain"
                        />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                        Finance Tracker
                    </span>
                </div>

                {/* Profile Toggle Button */}
                <button
                    onClick={() => setShowProfile(!showProfile)}
                    className="relative w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border-2 border-blue-200 hover:border-blue-400 hover:shadow-md hover:scale-110 active:scale-95 transition-all duration-300 overflow-hidden group/btn"
                >
                    <span className="relative z-10">
                        {user?.email?.charAt(0).toUpperCase() || "U"}
                    </span>
                    {/* Subtle inner glow on hover */}
                    <div className="absolute inset-0 bg-blue-200 opacity-0 group-hover/btn:opacity-40 transition-opacity duration-300" />
                </button>
            </nav>
            {/* Main Content */}
            <main className="p-8 max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="text-gray-500">Welcome back, {user?.email}</p>
                </header>

                {/* Placeholder Grid for Finance Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 font-medium">Total Balance</p>
                        <h2 className="text-2xl font-bold text-green-600">$12,450.00</h2>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 font-medium">Monthly Spending</p>
                        <h2 className="text-2xl font-bold text-red-500">$3,200.50</h2>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 font-medium">Savings Goal</p>
                        <h2 className="text-2xl font-bold text-blue-600">85%</h2>
                    </div>
                </div>
            </main>

            {/* Profile Modal */}
            {showProfile && user && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-black p-6 text-center text-white relative">
                            <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 text-white/70 hover:text-white">✕</button>
                            <div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold">
                                {user.email.charAt(0).toUpperCase()}
                            </div>
                            <h3 className="text-xl font-bold">{user.email}</h3>
                            <p className="text-sm text-white/60 capitalize">{user.gender} • {user.age} years old</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><p className="text-gray-400">Location</p><p className="font-semibold">{user.city}, {user.state}</p></div>
                                <div><p className="text-gray-400">Pincode</p><p className="font-semibold">{user.pincode}</p></div>
                            </div>
                            <hr className="border-gray-100" />
                            <div className="flex gap-3">
                                <button className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors">Edit Profile</button>
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-semibold transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}