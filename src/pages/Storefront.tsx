import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Store, ShoppingBag, Plus, Minus, Info, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { Product, StoreData } from '../types/index';
import { Helmet } from 'react-helmet-async';

export default function Storefront() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cart
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>(() => {
    const saved = localStorage.getItem(`omnishop_cart_${storeSlug}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });
  const [isCheckout, setIsCheckout] = useState(false);

  useEffect(() => {
    if (storeSlug) {
      localStorage.setItem(`omnishop_cart_${storeSlug}`, JSON.stringify(cart));
    }
  }, [cart, storeSlug]);

  useEffect(() => {
    const fetchStore = async () => {
      if (!storeSlug) return;
      try {
        const q = query(collection(db, 'users'), where('storeSlug', '==', storeSlug));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          setError('Boutique introuvable');
          setLoading(false);
          return;
        }

        const storeDoc = snap.docs[0];
        const storeData = storeDoc.data();
        setStore({ id: storeDoc.id, ...storeData });

        // Fetch products
        const pQ = query(collection(db, 'products'), where('storeId', '==', storeDoc.id));
        const pSnap = await getDocs(pQ);
        setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement de la boutique");
      }
      setLoading(false);
    };
    fetchStore();
  }, [storeSlug]);

  // Theme: apply store CSS custom properties — must be before any conditional return
  useEffect(() => {
    if (!store) return;
    if (store.themeColor) document.documentElement.style.setProperty('--color-art-accent', store.themeColor);
    if (store.backgroundColor) document.documentElement.style.setProperty('--color-art-bg', store.backgroundColor);
    if (store.textColor) document.documentElement.style.setProperty('--color-art-text', store.textColor);
    return () => {
      document.documentElement.style.removeProperty('--color-art-accent');
      document.documentElement.style.removeProperty('--color-art-bg');
      document.documentElement.style.removeProperty('--color-art-text');
    };
  }, [store]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      if (product.stock !== undefined && currentQty >= product.stock) {
        toast.error("Stock maximum atteint");
        return prev;
      }
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
      }
      return prev.filter(item => item.product.id !== productId);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const renderProducts = () => {
    const categoriesList = store.categories || [];
    const hasAnyCategory = products.some(p => p.category);

    const grouped = products.reduce((acc, p) => {
      const cat = p.category || (hasAnyCategory ? 'Autres' : 'Tous les produits');
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    }, {} as Record<string, any[]>);

    const orderedCategories = [...categoriesList];
    Object.keys(grouped).forEach(cat => {
      if (!orderedCategories.includes(cat) && cat !== 'Autres' && cat !== 'Tous les produits') {
        orderedCategories.push(cat);
      }
    });
    if (grouped['Autres']) orderedCategories.push('Autres');
    if (grouped['Tous les produits']) orderedCategories.push('Tous les produits');

    return orderedCategories.map(categoryName => {
      const categoryProducts = grouped[categoryName];
      if (!categoryProducts || categoryProducts.length === 0) return null;

      return (
        <div key={categoryName} className="mb-12 last:mb-0">
          <h2 className="text-xl font-serif italic text-art-text mb-6 border-b border-art-border pb-2">{categoryName}</h2>
          <div className="space-y-6">
            {categoryProducts.map(product => {
              const cartItem = cart.find(c => c.product.id === product.id);
              const qty = cartItem ? cartItem.quantity : 0;
              return (
                <div key={product.id} className="flex flex-col gap-4 p-5 border border-art-border glass group shadow-sm">
                  <div className="w-full h-48 glass-surface overflow-hidden flex items-center justify-center relative">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <ShoppingBag className="w-8 h-8 text-art-muted/50" />
                    )}
                    <div className="absolute top-0 left-0 glass border-b border-r border-art-border px-3 py-1 font-serif font-bold text-lg">
                      €{product.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-art-text text-lg leading-tight">{product.name}</h3>
                    </div>
                    {product.description && <p className="text-xs text-art-muted line-clamp-2 mb-4 italic font-serif leading-relaxed">{product.description}</p>}
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-art-border/50">
                      {product.stock <= 0 ? (
                        <div className="w-full text-xs uppercase font-bold tracking-widest text-red-500 border border-red-200 bg-red-50 py-3 text-center">
                          Rupture de stock
                        </div>
                      ) : qty > 0 ? (
                        <div className="flex items-center text-xs font-mono font-bold w-full justify-between border border-art-text px-1 py-1 glass-surface">
                          <button onClick={() => removeFromCart(product.id)} className="w-8 h-8 flex items-center justify-center text-art-text hover:glass border border-transparent hover:border-art-border transition-colors"><Minus className="w-4 h-4" /></button>
                          <span className="w-8 text-center">{qty}</span>
                          <button onClick={() => addToCart(product)} disabled={qty >= product.stock} className="w-8 h-8 flex items-center justify-center text-art-text hover:glass border border-transparent hover:border-art-border transition-colors disabled:opacity-30"><Plus className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(product)} className="w-full text-xs uppercase font-bold tracking-widest text-art-text border border-art-text py-3 hover:bg-art-text hover:text-white transition-colors">Ajouter au panier</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  if (loading) return <div className="h-screen bg-art-bg flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-art-text" /></div>;
  if (!store || error) return <div className="h-screen bg-art-bg flex items-center justify-center text-art-muted flex-col gap-4 font-serif italic"><Info className="w-12 h-12" /><p>{error || "Boutique introuvable"}</p></div>;

  return (
    <>
      <Helmet>
        <title>{store.storeName} | OmniShop</title>
        <meta name="description" content={`Découvrez ${store.storeName} et commandez en ligne facilement. Livraison rapide et paiement sécurisé.`} />
        <meta property="og:title" content={store.storeName} />
        <meta property="og:description" content={`Découvrez ${store.storeName} et commandez en ligne facilement.`} />
        <meta property="og:type" content="website" />
        {/* Dynamic theme color for mobile browsers */}
        <meta name="theme-color" content={store.themeColor || '#FDFCF8'} />
      </Helmet>
      <div className="min-h-screen font-sans text-art-text flex justify-center relative overflow-hidden bg-transparent">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-1/3 h-full glass-surface -z-10 skew-x-[-12deg] translate-x-32" style={store?.backgroundColor ? { backgroundColor: `${store.backgroundColor}e6` } : undefined} />

      <div className="w-full max-w-md glass border-x border-white/30 min-h-screen relative flex flex-col shadow-2xl">
        
        {/* Header */}
        <header className="px-8 py-8 border-b border-art-border glass sticky top-0 z-10 transition-shadow">
          <div className="flex flex-col items-center justify-center text-art-text">
            <h1 className="text-3xl font-serif italic tracking-tight text-center leading-tight mb-2">{store.storeName}</h1>
            {!isCheckout && (
              <p className="text-center text-[10px] uppercase font-bold tracking-widest text-art-muted glass-surface px-4 py-1 border border-art-border">Boutique Officielle</p>
            )}
          </div>
        </header>

        {/* Dynamic Area */}
        <main className="flex-1 overflow-y-auto pb-32">
          {isCheckout ? (
            <CheckoutArea 
              storeId={store.id} 
              storeWhatsApp={store.whatsappNumber}
              cart={cart} 
              cartTotal={cartTotal} 
              onBack={() => setIsCheckout(false)} 
              onSuccess={() => { setCart([]); setIsCheckout(false); }}
            />
          ) : (
            <div className="p-6">
              {products.length === 0 ? (
                <div className="text-center py-12 text-art-muted font-serif italic">Aucun produit disponible.</div>
              ) : (
                renderProducts()
              )}
            </div>
          )}
        </main>

        {/* Footer Checkout Bar */}
        {!isCheckout && cartCount > 0 && (
          <div className="absolute bottom-0 w-full p-6 glass border-t border-art-border z-20">
            <button 
              onClick={() => setIsCheckout(true)}
              className="w-full flex items-center justify-between bg-art-text text-white py-4 px-6 active:scale-[0.99] transition-transform shadow-[4px_4px_0px_rgba(0,0,0,0.1)] hover:translate-y-px hover:shadow-[2px_2px_0px_rgba(0,0,0,0.1)]"
            >
              <div className="flex items-center gap-3">
                <div className="border border-white/30 font-mono px-2 py-0.5 text-xs font-bold">{cartCount}</div>
                <span className="text-xs uppercase font-bold tracking-widest">Voir le panier</span>
              </div>
              <span className="font-serif italic text-lg">{cartTotal.toFixed(2)} €</span>
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

function CheckoutArea({ 
  storeId, storeWhatsApp, cart, cartTotal, onBack, onSuccess 
}: { 
  storeId: string, 
  storeWhatsApp?: string,
  cart: { product: Product, quantity: number }[], 
  cartTotal: number, 
  onBack: () => void,
  onSuccess: () => void
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryNeighborhood, setDeliveryNeighborhood] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ordered, setOrdered] = useState(false);

  const deliveryCost = deliveryMethod === 'delivery' ? 5 : 0;
  const finalTotal = cartTotal + deliveryCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const items = cart.map(c => ({
        productId: c.product.id,
        name: c.product.name,
        price: c.product.price,
        quantity: c.quantity
      }));

      const batch = writeBatch(db);

      // Create order document
      const orderRef = doc(collection(db, 'orders'));
      batch.set(orderRef, {
        storeId,
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : '',
        deliveryCity: deliveryMethod === 'delivery' ? deliveryCity : '',
        deliveryNeighborhood: deliveryMethod === 'delivery' ? deliveryNeighborhood : '',
        deliveryCost,
        totalAmount: finalTotal,
        status: 'pending',
        items,
        createdAt: serverTimestamp()
      });

      // Decrement stock for each product
      cart.forEach((item) => {
        if (item.product.id) {
          const productRef = doc(db, 'products', item.product.id);
          const currentStock = item.product.stock || 0;
          const newStock = Math.max(0, currentStock - item.quantity);
          batch.update(productRef, { stock: newStock });
        }
      });

      await batch.commit();

      setOrdered(true);
      // We don't automatically close the checkout if WhatsApp is available so they can click the button
      if (!storeWhatsApp) {
        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la commande.");
      setSubmitting(false);
    }
  };

  if (ordered) {
    const textMessage = `*Nouvelle Commande*\n\n*Client:* ${name}\n*Tél:* ${phone}\n*Livraison:* ${deliveryMethod === 'delivery' ? deliveryCity + ' - ' + deliveryNeighborhood : 'Retrait'}\n\n*Articles:*\n${cart.map(c => `- ${c.quantity}x ${c.product.name} (${(c.product.price * c.quantity).toFixed(2)} €)`).join('\n')}\n\n*Total: ${finalTotal.toFixed(2)} €*`;
    const waLink = storeWhatsApp ? `https://wa.me/${storeWhatsApp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(textMessage)}` : '';

    return (
      <div className="p-8 flex flex-col items-center justify-center h-full text-center mt-12 glass-surface m-6 border border-art-border relative">
        <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-art-text" />
        <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-art-text" />
        
        <CheckCircle2 className="w-16 h-16 text-art-accent mb-6" />
        <h2 className="text-3xl font-serif italic text-art-text mb-4">Commande Validée.</h2>
        <p className="text-sm font-mono text-art-muted mb-8">Le vendeur prendra contact avec vous très prochainement.</p>

        {storeWhatsApp ? (
          <div className="flex flex-col gap-4 w-full">
            <a 
              href={waLink}
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] text-white py-4 font-bold text-xs uppercase tracking-widest shadow-[4px_4px_0px_rgba(0,0,0,0.1)] active:scale-[0.99] transition-transform hover:translate-y-px"
            >
              Envoyer ma commande sur WhatsApp
            </a>
            <button onClick={onSuccess} className="text-xs uppercase font-bold tracking-widest text-art-muted hover:text-art-text transition-colors mt-4 border-b border-transparent hover:border-art-text w-fit mx-auto pb-1">
              Fermer et retourner à la boutique
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="p-6">
      <button onClick={onBack} className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-art-muted mb-8 hover:text-art-text transition-colors">
        <ArrowLeft className="w-3 h-3" />
        Retour
      </button>

      <h2 className="text-2xl font-serif italic text-art-text mb-6">Récapitulatif</h2>
      <div className="glass-surface border border-art-border p-5 mb-10 space-y-4">
        {cart.map((item, idx) => (
          <div key={idx} className="flex gap-4 border-b border-art-border/50 pb-4 last:border-0 last:pb-0">
            <div className="w-16 h-16 glass border border-art-border flex-shrink-0 flex items-center justify-center overflow-hidden">
              {item.product.imageUrl ? (
                <img src={item.product.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag className="w-6 h-6 text-art-muted/50" />
              )}
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <span className="font-bold text-sm tracking-tight">{item.product.name}</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-art-muted mt-1">Qté: {item.quantity}</span>
            </div>
            <div className="flex flex-col justify-center text-right font-mono">
               <span className="font-bold text-sm mb-1">{(item.product.price * item.quantity).toFixed(2)} €</span>
               <span className="text-[10px] text-art-muted">{item.product.price.toFixed(2)} € / u</span>
            </div>
          </div>
        ))}
        <div className="pt-2 flex justify-between font-bold text-art-text text-sm font-serif italic border-t border-art-border mt-4">
          <span>Sous-total</span>
          <span>{cartTotal.toFixed(2)} €</span>
        </div>
        {deliveryMethod === 'delivery' && (
          <div className="flex justify-between font-bold text-art-text text-sm font-serif italic text-art-muted py-1">
            <span>Frais de livraison</span>
            <span>{deliveryCost.toFixed(2)} €</span>
          </div>
        )}
        <div className="pt-2 flex justify-between font-bold text-art-text text-lg font-serif italic border-t border-art-border">
          <span>Total</span>
          <span className="text-art-accent">{finalTotal.toFixed(2)} €</span>
        </div>
      </div>

      <h2 className="text-2xl font-serif italic text-art-text mb-6">Livraison & Coordonnées</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[10px] uppercase font-bold tracking-widest text-art-muted mb-3">Mode de réception</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setDeliveryMethod('pickup')}
              className={`p-3 border text-sm font-medium flex flex-col items-center justify-center transition-colors ${deliveryMethod === 'pickup' ? 'border-art-text glass-surface' : 'border-art-border hover:border-art-text/50'}`}
            >
              <span>Retrait en magasin</span>
              <span className="text-xs text-art-muted mt-1 font-mono italic font-serif">Gratuit</span>
            </button>
            <button
              type="button"
              onClick={() => setDeliveryMethod('delivery')}
              className={`p-3 border text-sm font-medium flex flex-col items-center justify-center transition-colors ${deliveryMethod === 'delivery' ? 'border-art-text glass-surface' : 'border-art-border hover:border-art-text/50'}`}
            >
              <span>Livraison à domicile</span>
              <span className="text-xs text-art-muted mt-1 font-mono italic font-serif">5.00 €</span>
            </button>
          </div>
        </div>

        {deliveryMethod === 'delivery' && (
          <div className="space-y-6 glass-surface p-4 border border-art-border">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-art-muted mb-2">Ville / Commune *</label>
              <input required={deliveryMethod === 'delivery'} value={deliveryCity} onChange={e => setDeliveryCity(e.target.value)} type="text" className="w-full glass border border-art-border p-3 focus:outline-none focus:border-art-text text-sm transition-colors" placeholder="Ex: Abidjan, Cocody" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-art-muted mb-2">Quartier / Repère *</label>
              <input required={deliveryMethod === 'delivery'} value={deliveryNeighborhood} onChange={e => setDeliveryNeighborhood(e.target.value)} type="text" className="w-full glass border border-art-border p-3 focus:outline-none focus:border-art-text text-sm transition-colors" placeholder="Ex: Angré 8ème tranche, près de la pharmacie" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-art-muted mb-2">Adresse détaillée <span className="font-normal italic font-serif lowercase text-xs">(optionnel)</span></label>
              <input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} type="text" className="w-full glass border border-art-border p-3 focus:outline-none focus:border-art-text text-sm transition-colors" placeholder="N° de rue, porte, etc." />
            </div>
          </div>
        )}

        <div className="border-t border-art-border pt-6">
          <label className="block text-[10px] uppercase font-bold tracking-widest text-art-muted mb-2">Nom complet *</label>
          <input required autoFocus value={name} onChange={e => setName(e.target.value)} type="text" className="w-full glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text text-sm transition-colors" />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold tracking-widest text-art-muted mb-2">Téléphone *</label>
          <input required value={phone} onChange={e => setPhone(e.target.value)} type="tel" className="w-full glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text text-sm transition-colors font-mono" placeholder="+33 6 00 00 00 00" />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold tracking-widest text-art-muted mb-2">Email <span className="font-normal italic font-serif lowercase text-xs">(optionnel)</span></label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text text-sm transition-colors" />
        </div>
        
        <button disabled={submitting} type="submit" className="w-full flex items-center justify-center gap-2 bg-art-text text-white py-4 mt-12 font-bold text-xs uppercase tracking-widest active:scale-[0.99] transition-transform shadow-[4px_4px_0px_rgba(0,0,0,0.1)] hover:translate-y-px hover:shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmer l'achat"}
        </button>
      </form>
    </div>
  );
}
