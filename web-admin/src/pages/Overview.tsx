import React, { useEffect, useState } from 'react';
import { api } from '@/api/axios';
import { Users, Utensils, ReceiptText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export default function Overview() {
  const { user } = useAuth();
  
  // This would typically fetch from a dashboard endpoint.
  // For now, let's mock the stats or attempt to fetch tables/orders count.
  const [stats, setStats] = useState({
    tablesActive: 0,
    ordersToday: 0,
    revenueToday: 0,
  });

  useEffect(() => {
    // Attempting to fetch real data
    const fetchDashboardData = async () => {
      try {
        const tablesRes = await api.get('/tables/');
        const occupied = tablesRes.data.filter((t: any) => t.status === 'Occupied').length;
        
        // In a real app we'd fetch orders and billing for the day
        setStats(prev => ({ ...prev, tablesActive: occupied }));
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      }
    };
    fetchDashboardData();
  }, []);

  const statCards = [
    {
      name: 'Active Tables',
      value: stats.tablesActive.toString(),
      icon: Users,
      change: '+2',
      changeType: 'positive',
    },
    {
      name: 'Orders Today',
      value: '24', // Mocked
      icon: Utensils,
      change: '+12.5%',
      changeType: 'positive',
    },
    {
      name: 'Revenue Today',
      value: '$1,240.00', // Mocked
      icon: ReceiptText,
      change: '-2.4%',
      changeType: 'negative',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Dashboard Overview</h2>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back, {user?.username}. Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Kitchen Online
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((item) => (
          <div
            key={item.name}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{item.name}</p>
            <p className="text-2xl font-bold text-slate-900">{item.value}</p>
            
            <p className={cn(
              "text-xs mt-2 font-medium flex items-center",
              item.changeType === 'positive' ? "text-emerald-500" : "text-rose-500"
            )}>
              {item.changeType === 'positive' ? (
                <ArrowUpRight className="flex-shrink-0 h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="flex-shrink-0 h-3 w-3 mr-1" />
              )}
              {item.change} <span className="text-slate-400 font-normal ml-1">vs yesterday</span>
            </p>
          </div>
        ))}
      </div>

      {/* Recent Activity Mock */}
      <div className="bg-white shadow-sm rounded-2xl border border-slate-200 mt-8 flex flex-col">
        <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Recent Orders</h2>
        </div>
        <div className="p-6 text-center text-slate-500 text-sm">
          Select Menu Management or Billing to see active data.
        </div>
      </div>
    </div>
  );
}
