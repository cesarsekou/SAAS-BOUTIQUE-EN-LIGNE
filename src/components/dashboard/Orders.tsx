import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Loader2, X, Package, FileText, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface OrdersProps {
  user: User;
}

export function Orders({ user }: OrdersProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'orders'), where('storeId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const o = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      o.sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setOrders(o);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
    });
    return () => unsubscribe();
  }, [user.uid]);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      const order = orders.find(o => o.id === orderId) || selectedOrder;
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status }));
      }
      if (order?.customerPhone) {
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
    const phone = order.customerPhone?.replace(/\D/g, '') || '';
    const total = order.totalAmount?.toFixed(2) || '0.00';
    let msg = '';
    if (order.status === 'pending') {
      msg = `Bonjour ${order.customerName},\n\nNous avons bien reçu votre commande d'un montant de ${total} €. Elle est en attente de traitement.`;
    } else if (order.status === 'completed') {
      msg = order.deliveryMethod === 'delivery'
        ? `Bonjour ${order.customerName},\n\nVotre commande de ${total} € est en cours de préparation pour la livraison. Merci !`
        : `Bonjour ${order.customerName},\n\nVotre commande de ${total} € est prête pour le retrait. Merci !`;
    } else if (order.status === 'cancelled') {
      msg = `Bonjour ${order.customerName},\n\nVotre commande de ${total} € a été annulée.`;
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
                      {order.createdAt?.toDate().toLocaleDateString()}{' '}
                      {order.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 text-xs md:text-sm text-art-text">
                      <div className="font-medium tracking-tight mb-1">{order.customerName}</div>
                      <div className="text-art-muted text-[10px] md:text-xs font-mono">
                        {order.customerPhone}{order.customerEmail ? ` · ${order.customerEmail}` : ''}
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap font-serif text-base md:text-lg text-art-text">
                      €{order.totalAmount?.toFixed(2)}
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <select
                        value={order.status}
                        onChange={e => updateStatus(order.id, e.target.value)}
                        className={cn(
                          'text-[10px] md:text-xs uppercase font-bold tracking-widest p-1.5 md:p-2 border border-art-border focus:outline-none focus:border-art-text transition-colors cursor-pointer',
                          order.status === 'completed' ? 'bg-green-50 text-green-900 border-green-200' :
                          order.status === 'cancelled' ? 'bg-red-50 text-red-900 border-red-200' :
                          'bg-white text-art-text'
                        )}
                      >
                        <option value="pending">En attente</option>
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
                  <p><span className="text-art-muted">Nom:</span> {selectedOrder.customerName}</p>
                  <p><span className="text-art-muted">Tel:</span> {selectedOrder.customerPhone}</p>
                  {selectedOrder.customerEmail && <p><span className="text-art-muted">Email:</span> {selectedOrder.customerEmail}</p>}
                </div>
                <h3 className="text-[10px] uppercase font-bold tracking-widest text-art-muted mb-2">Livraison</h3>
                <div className="glass-surface border border-art-border p-4 text-sm font-mono space-y-2">
                  <p><span className="text-art-muted">Mode:</span> {selectedOrder.deliveryMethod === 'delivery' ? 'Livraison à domicile' : 'Retrait en magasin'}</p>
                  {selectedOrder.deliveryMethod === 'delivery' && (
                    <>
                      <p><span className="text-art-muted">Ville:</span> {selectedOrder.deliveryCity}</p>
                      <p><span className="text-art-muted">Quartier:</span> {selectedOrder.deliveryNeighborhood}</p>
                      {selectedOrder.deliveryAddress && <p><span className="text-art-muted">Adresse:</span> {selectedOrder.deliveryAddress}</p>}
                      <p><span className="text-art-muted">Frais:</span> {selectedOrder.deliveryCost?.toFixed(2) || '0.00'} €</p>
                    </>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] uppercase font-bold tracking-widest text-art-muted mb-2">Statut & Date</h3>
                <div className="glass-surface border border-art-border p-4 text-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-art-muted">Date:</span>
                    <span className="font-mono">{selectedOrder.createdAt?.toDate().toLocaleDateString()} {selectedOrder.createdAt?.toDate().toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-art-muted">Statut:</span>
                    <select
                      value={selectedOrder.status}
                      onChange={e => updateStatus(selectedOrder.id, e.target.value)}
                      className={cn(
                        'text-xs uppercase font-bold tracking-widest p-1.5 border border-art-border focus:outline-none cursor-pointer',
                        selectedOrder.status === 'completed' ? 'bg-green-50 text-green-900 border-green-200' :
                        selectedOrder.status === 'cancelled' ? 'bg-red-50 text-red-900 border-red-200' :
                        'bg-white text-art-text'
                      )}
                    >
                      <option value="pending">En attente</option>
                      <option value="completed">Terminée</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                  </div>
                  {selectedOrder.customerPhone && (
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
                    {item.product?.imageUrl ? (
                      <img src={item.product.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-art-muted/50" />
                    )}
                  </div>
                  <div className="flex-1 flex justify-center flex-col">
                    <span className="font-bold text-sm tracking-tight">{item.product?.name}</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-art-muted mt-1">Qté: {item.quantity}</span>
                  </div>
                  <div className="flex flex-col justify-center text-right font-mono">
                    <span className="font-bold text-sm mb-1">{((item.product?.price || 0) * item.quantity).toFixed(2)} €</span>
                    <span className="text-[10px] text-art-muted">{item.product?.price?.toFixed(2)} € / u</span>
                  </div>
                </div>
              ))}
              <div className="pt-4 flex justify-between font-bold text-art-text text-xl font-serif italic border-t border-art-border">
                <span>Total</span>
                <span>€{selectedOrder.totalAmount?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
