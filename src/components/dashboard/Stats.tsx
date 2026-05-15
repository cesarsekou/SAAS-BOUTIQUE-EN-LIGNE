import React, { useEffect, useState, useMemo } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line,
} from 'recharts';

interface StatsProps {
  user: User;
}

export function Stats({ user }: StatsProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      where('storeId', '==', user.uid),
      where('status', '==', 'completed')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const o = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(o);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
    });
    return () => unsubscribe();
  }, [user.uid]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const periodStart = new Date();
    if (period === 'week') periodStart.setDate(now.getDate() - 7);
    if (period === 'month') periodStart.setMonth(now.getMonth() - 1);
    if (period === 'year') periodStart.setFullYear(now.getFullYear() - 1);
    return orders.filter(o => o.createdAt && o.createdAt.toDate() >= periodStart);
  }, [orders, period]);

  const totalSales = useMemo(() => filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0), [filteredOrders]);
  const numOrders = filteredOrders.length;

  const chartData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const d = o.createdAt.toDate();
      const key = period === 'year'
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dataMap[key] = (dataMap[key] || 0) + o.totalAmount;
    });
    return Object.entries(dataMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, total]) => ({ date, total }));
  }, [filteredOrders, period]);

  const topProducts = useMemo(() => {
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    filteredOrders.forEach(o => {
      o.items?.forEach((item: any) => {
        if (!productSales[item.product?.id]) {
          productSales[item.product?.id] = { name: item.product?.name, quantity: 0, revenue: 0 };
        }
        productSales[item.product?.id].quantity += item.quantity;
        productSales[item.product?.id].revenue += item.quantity * (item.product?.price || 0);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass p-8">
          <h2 className="text-sm uppercase tracking-widest text-art-muted mb-4">Ventes Totales</h2>
          <p className="text-4xl font-serif italic text-art-text">€{totalSales.toFixed(2)}</p>
          <p className="text-xs text-art-muted mt-2">Pour la période sélectionnée</p>
        </div>
        <div className="glass p-8">
          <h2 className="text-sm uppercase tracking-widest text-art-muted mb-4">Commandes Terminées</h2>
          <p className="text-4xl font-serif italic text-art-text">{numOrders}</p>
          <p className="text-xs text-art-muted mt-2">Pour la période sélectionnée</p>
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
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} dx={-10} tickFormatter={(val) => `€${val}`} />
                  <Tooltip cursor={{ fill: '#FDFCF8' }} contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E5E5', borderRadius: '0', fontSize: '12px', padding: '10px' }} />
                  <Bar dataKey="total" fill="#1A1A1A" radius={[2, 2, 0, 0]} barSize={40} />
                </RechartsBarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} dx={-10} tickFormatter={(val) => `€${val}`} />
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
                  <p className="text-sm font-serif italic text-art-muted">€{p.revenue.toFixed(2)}</p>
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
