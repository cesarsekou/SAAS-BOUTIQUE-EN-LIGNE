import React, { useEffect, useState, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { COUNTRIES } from '../../data/countries';
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line,
} from 'recharts';

interface StatsProps {
  user: User;
}

export function Stats({ user }: StatsProps) {
  const { storeData } = useAuth();
  const currency = COUNTRIES[storeData?.country || 'CI']?.currency || 'FCFA';
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id);
    
    if (data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('public:orders:stats')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders', 
        filter: `user_id=eq.${user.id}` 
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const periodStart = new Date();
    if (period === 'week') periodStart.setDate(now.getDate() - 7);
    if (period === 'month') periodStart.setMonth(now.getMonth() - 1);
    if (period === 'year') periodStart.setFullYear(now.getFullYear() - 1);
    
    return orders.filter(o => {
      if (!o.created_at) return false;
      const d = new Date(o.created_at);
      return d >= periodStart;
    });
  }, [orders, period]);

  const completedOrders = useMemo(() => filteredOrders.filter(o => o.status === 'completed'), [filteredOrders]);
  const pendingOrders = useMemo(() => filteredOrders.filter(o => o.status === 'pending' || o.status === 'processing'), [filteredOrders]);
  const totalSales = useMemo(() => completedOrders.reduce((sum, o) => sum + Number(o.total || 0), 0), [completedOrders]);
  const numOrders = completedOrders.length;
  const numPending = pendingOrders.length;

  const chartData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const d = new Date(o.created_at);
      const key = period === 'year'
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dataMap[key] = (dataMap[key] || 0) + Number(o.total || 0);
    });
    return Object.entries(dataMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, total]) => ({ date, total }));
  }, [filteredOrders, period]);

  const topProducts = useMemo(() => {
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    filteredOrders.forEach(o => {
      o.items?.forEach((item: any) => {
        const pId = item.productId || 'unknown';
        if (!productSales[pId]) {
          productSales[pId] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSales[pId].quantity += item.quantity;
        productSales[pId].revenue += item.quantity * Number(item.price || 0);
      });
    });
    return Object.values(productSales).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [filteredOrders]);

  if (loading) return <div className="h-full flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-art-muted" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <header className="flex justify-between items-end border-b border-art-border pb-6">
        <h1 className="text-4xl font-serif italic tracking-tight text-art-text">Statistiques</h1>
        <div className="flex glass-surface border border-art-border p-1">
          {(['week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-4 py-1 text-sm font-medium transition-colors cursor-pointer rounded-full',
                period === p ? 'glass shadow-sm' : 'text-art-muted hover:text-art-text border border-transparent'
              )}
            >
              {p === 'week' ? '7 derniers jours' : p === 'month' ? '30 derniers jours' : '12 derniers mois'}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass p-8">
          <h2 className="text-sm uppercase tracking-widest text-art-muted mb-4">Ventes Totales</h2>
          <p className="text-4xl font-serif italic text-art-text">{totalSales.toFixed(0)} {currency}</p>
          <p className="text-xs text-art-muted mt-2">Pour la période sélectionnée</p>
        </div>
        <div className="glass p-8">
          <h2 className="text-sm uppercase tracking-widest text-art-muted mb-4">Commandes Terminées</h2>
          <p className="text-4xl font-serif italic text-art-text">{numOrders}</p>
          <p className="text-xs text-art-muted mt-2">Pour la période sélectionnée</p>
        </div>
        <div className="glass p-8 border-l-4 border-l-orange-400">
          <h2 className="text-sm uppercase tracking-widest text-art-muted mb-4">En Attente / Préparation</h2>
          <p className="text-4xl font-serif italic text-orange-500">{numPending}</p>
          <p className="text-xs text-art-muted mt-2">Commandes à traiter</p>
        </div>
      </div>

      <div className="glass p-8">
        <h2 className="text-xl font-medium tracking-tight mb-8">Évolution des ventes</h2>
        <div className="h-72">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {period === 'year' ? (
                <RechartsBarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} dx={-10} tickFormatter={(val) => `${val}`} />
                  <Tooltip cursor={{ fill: '#FDFCF8' }} contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E5E5', borderRadius: '0', fontSize: '12px', padding: '10px' }} />
                  <Bar dataKey="total" fill="#1A1A1A" radius={[2, 2, 0, 0]} barSize={40} />
                </RechartsBarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} dx={-10} tickFormatter={(val) => `${val}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E5E5', borderRadius: '0', fontSize: '12px', padding: '10px' }} />
                  <Line type="monotone" dataKey="total" stroke="#1A1A1A" strokeWidth={2} dot={{ r: 4, fill: '#1A1A1A' }} activeDot={{ r: 6 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm font-serif italic text-art-muted">
              Aucune donnée pour cette période.
            </div>
          )}
        </div>
      </div>

      <div className="glass p-8">
        <h2 className="text-xl font-medium tracking-tight mb-6">Top Produits Vendus</h2>
        {topProducts.length > 0 ? (
          <div className="space-y-4">
            {topProducts.map((p, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 border border-art-border glass-surface">
                <div className="flex items-center gap-4">
                  <span className="text-xl font-serif italic text-art-muted w-6">{idx + 1}.</span>
                  <span className="font-medium text-art-text">{p.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-mono text-art-text">{p.quantity} <span className="text-xs text-art-muted uppercase">vendus</span></p>
                  <p className="text-sm font-serif italic text-art-muted">{p.revenue.toFixed(2)} {currency}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm font-serif italic text-art-muted">Aucune vente enregistrée.</div>
        )}
      </div>
    </div>
  );
}
