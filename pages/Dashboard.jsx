import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
    const { profile } = useAuth();

    if (!profile) return <div>Loading...</div>;

    return (
        <div className="p-6 bg-omd-brown bg-opacity-20">
            <h1 className="text-3xl font-bold text-omd-text mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <DashboardCard title="Total Revenue" value="$10,000" />
                <DashboardCard title="New Leads" value="5" />
                <DashboardCard title="Upcoming Events" value="3" />
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-omd-text mb-4">Recent Activity</h2>
                <ul className="space-y-2">
                    <li>New lead: John Doe - Wedding inquiry</li>
                    <li>Invoice paid: #1234 - $500</li>
                    <li>Menu updated: Summer Specials</li>
                    <li>New event booked: Corporate Lunch (50 pax)</li>
                </ul>
            </div>
        </div>
    );
}

function DashboardCard({ title, value }) {
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-omd-text mb-2">{title}</h2>
            <p className="text-3xl font-bold text-omd-pink">{value}</p>
        </div>
    );
}