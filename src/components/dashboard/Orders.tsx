import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { Loader2, X, Package, FileText, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { COUNTRIES } from '../../data/countries';

interface OrdersProps {
  user: User;
}

export function Orders({ user }: OrdersProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const { storeData } = useAuth();
  const storeSlug = storeData?.store_url || '';
  const currency = COUNTRIES[storeData?.country || 'CI']?.currency || 'FCFA';

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      toast.error('Erreur lors du chargement des commandes');
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('orders:list-updates')
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

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      const order = orders.find(o => o.id === orderId) || selectedOrder;
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status }));
      }
      
      if (order?.customer_phone) {
        const link = getWhatsAppLink({ ...order, status });
        toast.success('Statut mis à jour', {
          description: 'Voulez-vous informer le client ?',
          action: { label: 'Envoyer WhatsApp', onClick: () => window.open(link, '_blank') },
          duration: 8000,
        });
      } else {
        toast.success('Statut de la commande mis à jour');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getWhatsAppLink = (order: any) => {
    const phone = order.customer_phone?.replace(/\D/g, '') || '';
    const total = Number(order.total)?.toFixed(0) || '0';
    const trackingLink = storeSlug ? `${window.location.origin}/${storeSlug}?track=${order.id}` : '';
    let msg = '';
    if (order.status === 'pending') {
      msg = `👋 *Bonjour ${order.customer_name} !*\n\n✨ *Bonne nouvelle !* Nous avons bien reçu votre commande d'un montant de *${total} ${currency}*. Notre équipe la valide dès à présent.\n\n📱 *Suivez sa préparation en direct ici :*\n🔗 ${trackingLink}\n\nMerci pour votre confiance ! 🙏`;
    } else if (order.status === 'processing') {
      msg = `👨‍🍳 *Votre commande de ${total} ${currency} est en cours de préparation !*\n\nNous préparons vos articles avec le plus grand soin. Nous faisons le maximum pour que votre colis soit prêt au plus vite.\n\n📍 *Découvrez l'avancement en direct ici :*\n🔗 ${trackingLink}`;
    } else if (order.status === 'shipping') {
      msg = `🛵 *Bonne nouvelle, votre commande est en cours de livraison !*\n\nLe livreur a récupéré votre colis d'un montant de *${total} ${currency}* et fait route vers vous.\n\n🗺️ *Suivez le livreur en temps réel :*\n🔗 ${trackingLink}`;
    } else if (order.status === 'completed') {
      msg = `🎉 *Votre commande de ${total} ${currency} est prête ou livrée !*\n\nNous espérons que vos articles vous plairont. Merci pour votre achat et à très bientôt chez nous ! 💖\n\n🔗 ${trackingLink}`;
    } else if (order.status === 'cancelled') {
      msg = `✉️ *Votre commande d'un montant de ${total} ${currency} a été annulée.*\n\nSi vous pensez qu'il s'agit d'une erreur ou si vous souhaitez en connaître la raison, n'hésitez pas à nous recontacter.`;
    }
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <header className="flex justify-between items-end border-b border-art-border pb-6">
        <h1 className="text-4xl font-serif italic tracking-tight text-art-text">
          Commandes{' '}
          <span className="text-sm font-sans not-italic text-art-muted glass-surface px-2 py-1 ml-2 border border-art-border rounded-full animate-pulse">
            En direct
          </span>
        </h1>
      </header>

      <div className="glass shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-art-muted" /></div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-art-muted text-sm italic font-serif">Aucune commande pour le moment.</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-art-border">
              <thead className="bg-art-bg/50">
                <tr>
                  <th className="px-4 md:px-8 py-4 text-left text-[10px] uppercase tracking-widest font-bold text-art-muted">Date</th>
                  <th className="px-4 md:px-8 py-4 text-left text-[10px] uppercase tracking-widest font-bold text-art-muted">Client</th>
                  <th className="px-4 md:px-8 py-4 text-left text-[10px] uppercase tracking-widest font-bold text-art-muted">Total</th>
                  <th className="px-4 md:px-8 py-4 text-left text-[10px] uppercase tracking-widest font-bold text-art-muted">Statut</th>
                  <th className="px-4 md:px-8 py-4 text-right text-[10px] uppercase tracking-widest font-bold text-art-muted">Détails</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-art-border">
                {orders.map(order => (
                  <tr key={order.id} onClick={() => setSelectedOrder(order)} className="hover:glass-surface/50 transition-colors cursor-pointer group">
                    <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap text-xs md:text-sm text-art-muted font-mono group-hover:text-art-text">
                      {new Date(order.created_at).toLocaleDateString()}{' '}
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 text-xs md:text-sm text-art-text">
                      <div className="font-medium tracking-tight mb-1">{order.customer_name}</div>
                      <div className="text-art-muted text-[10px] md:text-xs font-mono">
                        {order.customer_phone}
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap font-serif text-base md:text-lg text-art-text">
                      {Number(order.total).toFixed(2)} {currency}
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <select
                        value={order.status}
                        onChange={e => updateStatus(order.id, e.target.value)}
                        className={cn(
                          'text-[10px] md:text-xs uppercase font-bold tracking-widest p-1.5 md:p-2 border border-art-border focus:outline-none focus:border-art-text transition-colors cursor-pointer',
                          order.status === 'completed' ? 'bg-green-50 text-green-900 border-green-200' :
                          order.status === 'processing' ? 'bg-blue-50 text-blue-900 border-blue-200' :
                          order.status === 'shipping' ? 'bg-amber-50 text-amber-900 border-amber-200' :
                          order.status === 'cancelled' ? 'bg-red-50 text-red-900 border-red-200' :
                          'bg-white text-art-text'
                        )}
                      >
                        <option value="pending">En attente</option>
                        <option value="processing">En préparation</option>
                        <option value="shipping">En livraison</option>
                        <option value="completed">Terminée</option>
                        <option value="cancelled">Annulée</option>
                      </select>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 text-right text-[10px] md:text-xs uppercase tracking-widest text-art-muted group-hover:text-art-text">
                      <div className="flex items-center justify-end h-full">
                        <span className="mr-3">{order.items?.length || 0} art.</span>
                        <FileText className="w-4 h-4" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-art-text/20 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="glass p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 text-art-muted hover:text-art-text">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-serif italic text-art-text mb-6">Détails de la commande</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-[10px] uppercase font-bold tracking-widest text-art-muted mb-2">Informations Client</h3>
                <div className="glass-surface border border-art-border p-4 text-sm font-mono space-y-2 mb-4">
                  <p><span className="text-art-muted">Nom:</span> {selectedOrder.customer_name}</p>
                  <p><span className="text-art-muted">Tel:</span> {selectedOrder.customer_phone}</p>
                </div>
                <h3 className="text-[10px] uppercase font-bold tracking-widest text-art-muted mb-2">Livraison</h3>
                <div className="glass-surface border border-art-border p-4 text-sm font-mono space-y-2">
                  <p><span className="text-art-muted">Adresse:</span> {selectedOrder.customer_address}</p>
                </div>
              </div>
              <div>
                <h3 className="text-[10px] uppercase font-bold tracking-widest text-art-muted mb-2">Statut & Date</h3>
                <div className="glass-surface border border-art-border p-4 text-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-art-muted">Date:</span>
                    <span className="font-mono">{new Date(selectedOrder.created_at).toLocaleDateString()} {new Date(selectedOrder.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-art-muted">Statut:</span>
                    <select
                      value={selectedOrder.status}
                      onChange={e => updateStatus(selectedOrder.id, e.target.value)}
                      className={cn(
                        'text-xs uppercase font-bold tracking-widest p-1.5 border border-art-border focus:outline-none cursor-pointer',
                        selectedOrder.status === 'completed' ? 'bg-green-50 text-green-900 border-green-200' :
                        selectedOrder.status === 'processing' ? 'bg-blue-50 text-blue-900 border-blue-200' :
                        selectedOrder.status === 'shipping' ? 'bg-amber-50 text-amber-900 border-amber-200' :
                        selectedOrder.status === 'cancelled' ? 'bg-red-50 text-red-900 border-red-200' :
                        'bg-white text-art-text'
                      )}
                    >
                      <option value="pending">En attente</option>
                      <option value="processing">En préparation</option>
                      <option value="shipping">En livraison</option>
                      <option value="completed">Terminée</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                  </div>
                  {selectedOrder.customer_phone && (
                    <div className="pt-2 border-t border-art-border/50">
                      <a
                        href={getWhatsAppLink(selectedOrder)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full p-2.5 bg-[#25D366]/10 text-[#075E54] border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors text-xs font-bold uppercase tracking-widest"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Envoyer un message WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <h3 className="text-[10px] uppercase font-bold tracking-widest text-art-muted mb-4 pt-4 border-t border-art-border">Articles commandés</h3>
            <div className="space-y-4">
              {selectedOrder.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-4 border-b border-art-border/50 pb-4 last:border-0 last:pb-0">
                  <div className="w-16 h-16 glass-surface border border-art-border flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-art-muted/50" />
                    )}
                  </div>
                  <div className="flex-1 flex justify-center flex-col">
                    <span className="font-bold text-sm tracking-tight">{item.name}</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-art-muted mt-1">Qté: {item.quantity}</span>
                  </div>
                  <div className="flex flex-col justify-center text-right font-mono">
                    <span className="font-bold text-sm mb-1">{((item.price || 0) * item.quantity).toFixed(2)} {currency}</span>
                    <span className="text-[10px] text-art-muted">{item.price?.toFixed(2)} {currency} / u</span>
                  </div>
                </div>
              ))}
              <div className="pt-4 flex justify-between font-bold text-art-text text-xl font-serif italic border-t border-art-border">
                <span>Total</span>
                <span>{Number(selectedOrder.total)?.toFixed(2)} {currency}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
