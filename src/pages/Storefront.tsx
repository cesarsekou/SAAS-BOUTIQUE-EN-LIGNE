import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Store, ShoppingBag, Plus, Minus, Info, CheckCircle2, Loader2, ArrowLeft, Check, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { Product, StoreData } from '../types/index';
import { Helmet } from 'react-helmet-async';
import { COUNTRIES } from '../data/countries';

function isDarkColor(hex?: string) {
  if (!hex) return false;
  const c = hex.replace('#', '');
  if (c.length === 3) {
    const r = parseInt(c[0] + c[0], 16);
    const g = parseInt(c[1] + c[1], 16);
    const b = parseInt(c[2] + c[2], 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  }
  if (c.length === 6) {
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  }
  return false;
}

export default function Storefront() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const [store, setStore] = useState<StoreData | null>(null);
  const currency = store ? (COUNTRIES[store.country || 'CI']?.currency || 'FCFA') : 'FCFA';
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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const [flyingItems, setFlyingItems] = useState<{ id: number; x: number; y: number; tx: number; ty: number; imageUrl?: string }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Tout");
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [showTracking, setShowTracking] = useState(false);

  useEffect(() => {
    if (storeSlug) {
      localStorage.setItem(`omnishop_cart_${storeSlug}`, JSON.stringify(cart));
    }
  }, [cart, storeSlug]);

  const handleAddToCartWithAnimation = (product: Product, e: React.MouseEvent<HTMLButtonElement>) => {
    const existing = cart.find(item => item.product.id === product.id);
    const qtyInCart = existing ? existing.quantity : 0;
    if (product.stock !== undefined && qtyInCart >= product.stock) {
      return;
    }

    addToCart(product);

    // Calculate dynamic trajectory from click source to centered floating cart bar
    const startX = e.clientX;
    const startY = e.clientY;
    const targetX = window.innerWidth / 2;
    const targetY = window.innerHeight - 80;

    const id = Date.now() + Math.random();
    const tx = targetX - startX;
    const ty = targetY - startY;

    setFlyingItems(prev => [...prev, {
      id,
      x: startX,
      y: startY,
      tx,
      ty,
      imageUrl: product.imageUrl
    }]);

    // Haptic-style pulse feedback when orb hits bottom cart bar
    setTimeout(() => {
      setIsCartBouncing(true);
      setTimeout(() => setIsCartBouncing(false), 300);
    }, 800);

    // Dynamic cleanup of flying elements
    setTimeout(() => {
      setFlyingItems(prev => prev.filter(item => item.id !== id));
    }, 1000);
  };

  useEffect(() => {
    const fetchStore = async () => {
      if (!storeSlug) return;
      try {
        const { data: storeDoc, error: storeError } = await supabase
          .from('users')
          .select('*')
          .eq('store_url', storeSlug)
          .single();
        
        if (storeError || !storeDoc) {
          setError('Boutique introuvable');
          setLoading(false);
          return;
        }

        setStore(storeDoc as StoreData);

        // Load active order id from localStorage if present
        const savedOrderId = localStorage.getItem(`activeOrderId_${storeDoc.id}`);
        if (savedOrderId) {
          setActiveOrderId(savedOrderId);
        }

        // Fetch products
        const { data: pData, error: pError } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', storeDoc.id);
          
        if (pData) {
          setProducts(pData.map(d => ({
            id: d.id,
            name: d.name,
            price: Number(d.price),
            description: d.description,
            imageUrl: d.image,
            category: d.category,
            stock: d.stock_count,
            createdAt: d.created_at,
          })));
        }
        
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
    if (store.theme_color) document.documentElement.style.setProperty('--color-art-accent', store.theme_color);
    if (store.background_color) document.documentElement.style.setProperty('--color-art-bg', store.background_color);
    if (store.text_color) document.documentElement.style.setProperty('--color-art-text', store.text_color);
    
    // Check if background is dark to apply high-fidelity dark glassmorphism variables
    const isDark = isDarkColor(store.background_color);
    if (isDark) {
      document.documentElement.style.setProperty('--color-glass-bg', 'rgba(19, 19, 19, 0.7)');
      document.documentElement.style.setProperty('--color-glass-border', 'rgba(255, 255, 255, 0.08)');
      document.documentElement.style.setProperty('--color-glass-surface', 'rgba(255, 255, 255, 0.04)');
      document.documentElement.style.setProperty('--color-glass-shadow', 'rgba(0, 0, 0, 0.3)');
      document.documentElement.style.setProperty('--color-art-border', 'rgba(255, 255, 255, 0.08)');
      document.documentElement.style.setProperty('--color-art-muted', '#A1A1AA');
      document.documentElement.style.setProperty('--font-serif', '"Manrope", var(--font-sans)');
    } else {
      document.documentElement.style.setProperty('--color-glass-bg', 'rgba(255, 255, 255, 0.45)');
      document.documentElement.style.setProperty('--color-glass-border', 'rgba(0, 0, 0, 0.06)');
      document.documentElement.style.setProperty('--color-glass-surface', 'rgba(0, 0, 0, 0.02)');
      document.documentElement.style.setProperty('--color-glass-shadow', 'rgba(31, 38, 135, 0.03)');
      document.documentElement.style.setProperty('--color-art-border', 'rgba(229, 226, 217, 0.4)');
      document.documentElement.style.setProperty('--color-art-muted', '#8A8471');
      document.documentElement.style.setProperty('--font-serif', '"Playfair Display", ui-serif, Georgia, serif');
    }

    return () => {
      document.documentElement.style.removeProperty('--color-art-accent');
      document.documentElement.style.removeProperty('--color-art-bg');
      document.documentElement.style.removeProperty('--color-art-text');
      document.documentElement.style.removeProperty('--color-glass-bg');
      document.documentElement.style.removeProperty('--color-glass-border');
      document.documentElement.style.removeProperty('--color-glass-surface');
      document.documentElement.style.removeProperty('--color-glass-shadow');
      document.documentElement.style.removeProperty('--color-art-border');
      document.documentElement.style.removeProperty('--color-art-muted');
      document.documentElement.style.removeProperty('--font-serif');
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

  const categoriesList = store?.categories || [];
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

  const renderProducts = () => {
    const filteredCategories = selectedCategory === "Tout"
      ? orderedCategories
      : orderedCategories.filter(cat => cat === selectedCategory);

    return filteredCategories.map(categoryName => {
      const categoryProducts = grouped[categoryName];
      if (!categoryProducts || categoryProducts.length === 0) return null;

      return (
        <div key={categoryName} className="mb-12 last:mb-0">
          <h2 className="text-xl font-serif italic text-art-text mb-6 border-b border-art-border pb-2 animate-reveal-up">{categoryName}</h2>
          <div className="grid grid-cols-2 gap-4">
            {categoryProducts.map((product, pIdx) => {
              const cartItem = cart.find(c => c.product.id === product.id);
              const qty = cartItem ? cartItem.quantity : 0;
              return (
                <div 
                  key={product.id} 
                  className="flex flex-col gap-3 p-3 border border-art-border glass group shadow-sm animate-stagger-fade h-full"
                  style={{ animationDelay: `${pIdx * 0.08}s` }}
                >
                  <div 
                    onClick={() => setSelectedProduct(product)}
                    className="w-full aspect-square glass-surface overflow-hidden flex items-center justify-center relative rounded-sm cursor-zoom-in group"
                  >
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-art-muted/50" />
                    )}
                    <div className="absolute top-0 left-0 glass border-b border-r border-art-border px-2 py-0.5 font-serif font-bold text-xs z-10">
                      {product.price.toFixed(0)} F
                    </div>
                    {/* Visual hint on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 flex items-center justify-center transition-all duration-300 pointer-events-none opacity-0 group-hover:opacity-100 z-10">
                      <span className="text-[9px] text-white uppercase font-bold tracking-widest bg-black/60 px-2.5 py-1.5 border border-white/25 rounded-full flex items-center gap-1.5 backdrop-blur-xs scale-90 group-hover:scale-100 transition-all duration-300">
                        🔍 Voir en 3D
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="mb-2">
                      <h3 className="font-bold text-art-text text-sm leading-tight line-clamp-1">{product.name}</h3>
                      {product.stock > 0 && product.stock <= 3 && (
                        <div className="text-[8px] font-bold text-red-500 tracking-wider uppercase animate-pulse mt-0.5 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-red-500 inline-block animate-ping" />
                          🔥 Plus que {product.stock} exemplaires restants !
                        </div>
                      )}
                      {product.description && <p className="text-[10px] text-art-muted line-clamp-2 mt-1 italic font-serif leading-relaxed">{product.description}</p>}
                    </div>
                    <div className="mt-auto pt-2 border-t border-art-border/50">
                      {product.stock <= 0 ? (
                        <div className="w-full text-[9px] uppercase font-bold tracking-wider text-red-500 border border-red-200 bg-red-50 py-2 text-center">
                          Rupture
                        </div>
                      ) : qty > 0 ? (
                        <div className="flex items-center text-[10px] font-mono font-bold w-full justify-between border border-art-text px-1 py-0.5 glass-surface">
                          <button onClick={() => removeFromCart(product.id)} className="w-6 h-6 flex items-center justify-center text-art-text hover:glass border border-transparent hover:border-art-border transition-colors"><Minus className="w-3 h-3" /></button>
                          <span className="w-6 text-center">{qty}</span>
                          <button onClick={(e) => handleAddToCartWithAnimation(product, e)} disabled={qty >= product.stock} className="w-6 h-6 flex items-center justify-center text-art-text hover:glass border border-transparent hover:border-art-border transition-colors disabled:opacity-30"><Plus className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <button onClick={(e) => handleAddToCartWithAnimation(product, e)} className="w-full text-[9px] uppercase font-bold tracking-widest text-art-text border border-art-text py-2 hover:bg-art-text hover:text-white transition-all hover:tracking-wider active:scale-[0.98] duration-300">Ajouter</button>
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
        <title>{store.store_name} | OmniShop</title>
        <meta name="description" content={`Découvrez ${store.store_name} et commandez en ligne facilement. Livraison rapide et paiement sécurisé.`} />
        <meta property="og:title" content={store.store_name} />
        <meta property="og:description" content={`Découvrez ${store.store_name} et commandez en ligne facilement.`} />
        <meta property="og:type" content="website" />
        {/* Dynamic theme color for mobile browsers */}
        <meta name="theme-color" content={store.theme_color || '#FDFCF8'} />
      </Helmet>
      <style>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="min-h-screen font-sans text-art-text flex justify-center relative overflow-hidden bg-transparent">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-1/3 h-full glass-surface -z-10 skew-x-[-12deg] translate-x-32" style={store?.background_color ? { backgroundColor: `${store.background_color}e6` } : undefined} />

      <div className="w-full max-w-md glass border-x border-white/30 min-h-screen relative flex flex-col shadow-2xl">
        
        {/* Floating Cart Icon */}
        {!isCheckout && (
          <button
            onClick={() => setIsCartOpen(true)}
            className={cn(
              "absolute top-6 right-6 z-30 bg-art-bg/90 border border-art-border/60 hover:border-art-text text-art-text backdrop-blur-md shadow-lg active:scale-95 transition-all duration-300 flex items-center justify-center w-12 h-12 rounded-full",
              isCartBouncing ? "animate-bounce" : ""
            )}
            aria-label="Voir le panier"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="bg-art-text text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center border border-art-bg absolute -top-1 -right-1 animate-scale-in">
                {cartCount}
              </span>
            )}
          </button>
        )}

        {/* Header */}
        <header 
          className={cn(
            "px-8 py-10 border-b z-10 sticky top-0 transition-shadow relative overflow-hidden flex flex-col items-center justify-center min-h-[140px]",
            store.hero_image ? "text-white border-white/10" : "border-art-border glass text-art-text"
          )}
          style={store.hero_image ? {
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.6)), url(${store.hero_image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : undefined}
        >
          {store.hero_image && (
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] pointer-events-none" />
          )}
          <div className="flex flex-col items-center justify-center relative z-10 w-full">
            <div className="overflow-hidden py-1 w-full flex justify-center">
              <h1 className={cn(
                "text-3xl font-serif italic tracking-tight text-center leading-tight mb-2 animate-reveal-up",
                store.hero_image ? "text-white drop-shadow-md" : "text-art-text"
              )}>{store.store_name}</h1>
            </div>
            {!isCheckout && (
              <div className="overflow-hidden py-0.5 mt-1">
                <p 
                  className={cn(
                    "text-center text-[10px] uppercase font-bold tracking-widest glass-surface px-4 py-1 border animate-reveal-up",
                    store.hero_image ? "text-white/90 border-white/20 bg-white/10" : "text-art-muted border-art-border"
                  )}
                  style={{ animationDelay: '0.25s' }}
                >
                  Boutique Officielle
                </p>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Area */}
        <main className="flex-1 overflow-y-auto pb-32">
          {showTracking && activeOrderId ? (
            <OrderTracking
              orderId={activeOrderId}
              storeWhatsApp={store.whatsapp_number}
              currency={currency}
              onClose={() => setShowTracking(false)}
              onClearTracking={() => {
                setActiveOrderId(null);
                localStorage.removeItem(`activeOrderId_${store.id}`);
              }}
            />
          ) : isCheckout ? (
            <CheckoutArea 
              storeId={store.id} 
              storeWhatsApp={store.whatsapp_number}
              storeDeliveryCost={store.delivery_cost ?? 1000}
              storeCountry={store.country}
              cart={cart} 
              cartTotal={cartTotal} 
              onBack={() => setIsCheckout(false)} 
              onSuccess={(track) => { 
                setCart([]); 
                setIsCheckout(false); 
                if (track) {
                  setShowTracking(true);
                }
              }}
              onOrderCreated={(orderId) => {
                setActiveOrderId(orderId);
                localStorage.setItem(`activeOrderId_${store.id}`, orderId);
              }}
            />
          ) : (
            <div className="flex flex-col">
              {/* Horizontal Category Navigation Bar */}
              {products.length > 0 && orderedCategories.length > 0 && (
                <div className="sticky top-0 bg-art-bg/95 backdrop-blur-md z-20 border-b border-art-border/40 py-4 flex gap-6 overflow-x-auto scrollbar-none whitespace-nowrap px-6 items-center">
                  <button
                    onClick={() => setSelectedCategory("Tout")}
                    className={cn(
                      "transition-all duration-300 pb-1.5 focus:outline-none border-b-2 text-xs",
                      selectedCategory === "Tout"
                        ? "font-serif italic text-art-text border-art-text font-semibold scale-105"
                        : "font-sans text-[9px] uppercase tracking-widest text-art-muted border-transparent hover:text-art-text"
                    )}
                  >
                    Tout
                  </button>
                  {orderedCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "transition-all duration-300 pb-1.5 focus:outline-none border-b-2 text-xs",
                        selectedCategory === cat
                          ? "font-serif italic text-art-text border-art-text font-semibold scale-105"
                          : "font-sans text-[9px] uppercase tracking-widest text-art-muted border-transparent hover:text-art-text"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              <div className="p-6">
                {products.length === 0 ? (
                  <div className="text-center py-12 text-art-muted font-serif italic">Aucun produit disponible.</div>
                ) : (
                  renderProducts()
                )}
              </div>
            </div>
          )}
        </main>

        {/* Real-time Order Tracking Notification Bar */}
        {activeOrderId && !isCheckout && !showTracking && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-[360px] glass border border-art-border/80 p-4 shadow-2xl flex items-center justify-between rounded-xl animate-reveal-up bg-art-bg/95 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <div>
                <p className="text-[9px] uppercase font-bold tracking-widest text-art-muted font-sans">Suivi en direct</p>
                <p className="text-xs font-semibold text-art-text mt-0.5 font-serif italic">Commande active</p>
              </div>
            </div>
            <button
              onClick={() => setShowTracking(true)}
              className="bg-art-text text-white text-[9px] uppercase font-bold tracking-widest px-4 py-2 hover:bg-art-text/90 transition-colors shadow-md rounded-md"
            >
              Suivre
            </button>
          </div>
        )}

        {/* Footer Checkout Bar */}
        {!isCheckout && cartCount > 0 && (
          <div className={cn(
            "absolute bottom-0 w-full p-6 glass border-t border-art-border z-20 transition-all duration-300 ease-out",
            isCartBouncing ? "scale-[1.03] -translate-y-1 shadow-lg" : ""
          )}>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="w-full flex items-center justify-between bg-art-text text-white py-4 px-6 active:scale-[0.99] transition-all duration-300 shadow-[4px_4px_0px_rgba(0,0,0,0.1)] hover:translate-y-px hover:shadow-[2px_2px_0px_rgba(0,0,0,0.1)]"
            >
              <div className="flex items-center gap-3">
                <div className="border border-white/30 font-mono px-2 py-0.5 text-xs font-bold">{cartCount}</div>
                <span className="text-xs uppercase font-bold tracking-widest">Voir le panier</span>
              </div>
              <span className="font-serif italic text-lg">{cartTotal.toFixed(0)} {currency}</span>
            </button>
          </div>
        )}

        {/* Cart Drawer Overlay */}
        {isCartOpen && (
          <>
            {/* Backdrop Overlay */}
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-xs z-30 transition-opacity duration-300 animate-fade-in-backdrop"
              onClick={() => setIsCartOpen(false)}
            />
            
            {/* Drawer Sheet */}
            <div className="absolute bottom-0 left-0 w-full max-h-[82%] bg-art-bg border-t border-art-border z-40 flex flex-col rounded-t-3xl shadow-2xl transition-transform duration-300 animate-slide-up pb-6">
              {/* grabber line */}
              <div className="w-12 h-1 bg-art-muted/30 rounded-full mx-auto my-3" />
              
              {/* Header */}
              <div className="px-6 pb-4 border-b border-art-border flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-serif italic text-art-text">Votre Panier</h2>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-art-muted mt-0.5">{cartCount} {cartCount > 1 ? 'articles' : 'article'}</p>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="text-xs uppercase font-bold tracking-widest text-art-muted hover:text-art-text transition-colors border border-art-border px-3 py-1.5 glass-surface"
                >
                  Fermer
                </button>
              </div>
              
              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-art-muted font-serif italic">Votre panier est vide.</div>
                ) : (
                  cart.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="flex gap-4 border-b border-art-border/50 pb-4 last:border-0 last:pb-0 items-center animate-stagger-fade"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="w-14 h-14 glass border border-art-border flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {item.product.imageUrl ? (
                           <img src={item.product.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-5 h-5 text-art-muted/50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-sm tracking-tight block truncate">{item.product.name}</span>
                        <span className="font-mono text-xs text-art-muted mt-0.5 block">{item.product.price.toFixed(0)} {currency} / u</span>
                      </div>
                      <div className="flex items-center text-xs font-mono font-bold border border-art-text px-1 py-0.5 glass-surface">
                        <button 
                          onClick={() => removeFromCart(item.product.id)} 
                          className="w-6 h-6 flex items-center justify-center text-art-text hover:glass border border-transparent hover:border-art-border transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => addToCart(item.product)} 
                          disabled={item.product.stock !== undefined && item.quantity >= item.product.stock}
                          className="w-6 h-6 flex items-center justify-center text-art-text hover:glass border border-transparent hover:border-art-border transition-colors disabled:opacity-30"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right font-mono font-bold text-sm min-w-[80px]">
                        {(item.product.price * item.quantity).toFixed(0)} {currency}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Summary and Checkout Button */}
              {cart.length > 0 && (
                <div className="px-6 pt-4 border-t border-art-border bg-art-bg/85 backdrop-blur-md">
                  <div className="flex justify-between font-bold text-art-text text-lg font-serif italic mb-4">
                    <span>Total</span>
                    <span className="text-art-accent">{cartTotal.toFixed(0)} {currency}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckout(true);
                    }}
                    className="w-full flex items-center justify-center bg-art-text text-white py-4 font-bold text-xs uppercase tracking-widest active:scale-[0.99] transition-transform shadow-[4px_4px_0px_rgba(0,0,0,0.1)] hover:translate-y-px hover:shadow-[2px_2px_0px_rgba(0,0,0,0.1)]"
                  >
                    Passer la commande
                  </button>
                </div>
              )}
            </div>
          </>
        )}

    {/* Inline Styles for Curved Parabolic Fly-To-Cart & Fade Animations */}
    <style>{`
      @keyframes flyX {
        0% { transform: translate3d(calc(var(--startX) - 24px), 0, 0); }
        100% { transform: translate3d(calc(var(--startX) + var(--tx) - 24px), 0, 0); }
      }
      @keyframes flyY {
        0% { transform: translate3d(0, calc(var(--startY) - 24px), 0); }
        100% { transform: translate3d(0, calc(var(--startY) + var(--ty) - 24px), 0); }
      }
      @keyframes scaleDot {
        0% { transform: scale(1); opacity: 1; }
        80% { transform: scale(0.8); opacity: 0.9; }
        100% { transform: scale(0.1); opacity: 0; }
      }
      .flying-dot-wrapper {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 10000;
        pointer-events: none;
        animation: flyX 0.8s cubic-bezier(0.12, 0, 0.39, 0) forwards;
      }
      .flying-dot-inner {
        width: 48px;
        height: 48px;
        border-radius: 9999px;
        background-size: cover;
        background-position: center;
        border: 2px solid white;
        box-shadow: 0 10px 20px rgba(0,0,0,0.15), 0 0 15px var(--color-art-accent);
        animation: flyY 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards, scaleDot 0.8s linear forwards;
      }
      @keyframes slideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
      .animate-slide-up {
        animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in {
        animation: fadeIn 0.25s ease-out forwards;
      }
      @keyframes fadeInBackdrop {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .animate-fade-in-backdrop {
        animation: fadeInBackdrop 0.3s ease-out forwards;
      }
    `}</style>

    {/* Render Flying Particle Orbs */}
    {flyingItems.map(item => (
      <div
        key={item.id}
        className="flying-dot-wrapper"
        style={{
          '--startX': `${item.x}px`,
          '--startY': `${item.y}px`,
          '--tx': `${item.tx}px`,
          '--ty': `${item.ty}px`,
        } as React.CSSProperties}
      >
        <div 
          className="flying-dot-inner animate-pulse" 
          style={{ 
            backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined,
            backgroundColor: 'var(--color-art-accent)'
          }}
        />
      </div>
    ))}
        {/* Product 3D showcase detail overlay modal */}
        {selectedProduct && (
          <ProductDetailsModal
            product={selectedProduct}
            currency={currency}
            onClose={() => setSelectedProduct(null)}
            cartQty={cart.find(c => c.product.id === selectedProduct.id)?.quantity || 0}
            stock={selectedProduct.stock}
            themeColor={store.theme_color || '#FF5F1F'}
            onAddToCart={(e) => handleAddToCartWithAnimation(selectedProduct, e)}
            onRemoveFromCart={() => removeFromCart(selectedProduct.id)}
          />
        )}
      </div>
    </div>
    </>
  );
}

function Product3DShowcase({ imageUrl, name }: { imageUrl?: string; name: string }) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [autoSpin, setAutoSpin] = useState(true);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (autoSpin) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const degX = -(y / (rect.height / 2)) * 25;
    const degY = (x / (rect.width / 2)) * 25;
    setRotate({ x: degX, y: degY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-center py-6 bg-transparent select-none">
      {/* Spotlight background behind the floating item */}
      <div className="absolute w-48 h-48 rounded-full bg-radial-gradient from-white/10 to-transparent blur-xl pointer-events-none" />
      
      {/* Circular interactive area */}
      <div 
        className="w-64 h-64 relative flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{ perspective: '1000px' }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        {/* Shadow that shrinks / shifts beneath the floating item */}
        <div 
          className={cn(
            "absolute bottom-4 w-40 h-4 bg-black/30 rounded-full blur-md transition-all duration-700 ease-out",
            autoSpin ? "animate-[shadowPulse_4s_infinite_ease-in-out]" : isHovered ? "scale-90 opacity-80" : "scale-100 opacity-60"
          )} 
        />

        {/* Floating 3D Showcase viewport with transform-style */}
        <div 
          className="w-full h-full flex items-center justify-center p-4"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={name} 
              className={cn(
                "max-w-[85%] max-h-[85%] object-contain filter drop-shadow-[0_25px_35px_rgba(0,0,0,0.35)] transition-all duration-300",
                autoSpin ? "animate-[itemSpin_10s_linear_infinite]" : ""
              )}
              style={!autoSpin ? {
                transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) translateZ(40px)`,
              } : {
                transform: 'translateZ(40px)'
              }}
            />
          ) : (
            <ShoppingBag className="w-16 h-16 text-art-muted/40 animate-pulse" />
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="mt-2 flex gap-2 z-10">
        <button
          type="button"
          onClick={() => {
            setAutoSpin(true);
            setRotate({ x: 0, y: 0 });
          }}
          className={cn(
            "text-[9px] uppercase font-bold tracking-widest px-3 py-1.5 border transition-all rounded-full",
            autoSpin ? "bg-art-text text-white border-art-text shadow-sm" : "border-art-border text-art-muted hover:text-art-text hover:bg-slate-50"
          )}
        >
          🔄 Spin 3D
        </button>
        <button
          type="button"
          onClick={() => {
            setAutoSpin(false);
            setRotate({ x: 0, y: 0 });
          }}
          className={cn(
            "text-[9px] uppercase font-bold tracking-widest px-3 py-1.5 border transition-all rounded-full",
            !autoSpin ? "bg-art-text text-white border-art-text shadow-sm" : "border-art-border text-art-muted hover:text-art-text hover:bg-slate-50"
          )}
        >
          🖱️ Interactif
        </button>
      </div>

      <style>{`
        @keyframes itemSpin {
          0% {
            transform: rotateY(0deg) translateY(0px) rotateX(10deg);
          }
          25% {
            transform: rotateY(90deg) translateY(-8px) rotateX(5deg);
          }
          50% {
            transform: rotateY(180deg) translateY(0px) rotateX(-10deg);
          }
          75% {
            transform: rotateY(270deg) translateY(-8px) rotateX(5deg);
          }
          100% {
            transform: rotateY(360deg) translateY(0px) rotateX(10deg);
          }
        }
        @keyframes shadowPulse {
          0%, 100% {
            transform: scale(1) opacity-60;
            filter: blur(6px);
          }
          50% {
            transform: scale(0.85) opacity-35;
            filter: blur(4px);
          }
        }
      `}</style>
    </div>
  );
}

interface ProductDetailsModalProps {
  product: Product;
  currency: string;
  onClose: () => void;
  cartQty: number;
  stock: number;
  themeColor: string;
  onAddToCart: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onRemoveFromCart: () => void;
}

function ProductDetailsModal({
  product,
  currency,
  onClose,
  cartQty,
  stock,
  themeColor,
  onAddToCart,
  onRemoveFromCart
}: ProductDetailsModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity duration-300",
          mounted ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      
      {/* Centered Modal Content Card */}
      <div 
        className={cn(
          "absolute top-1/2 left-1/2 w-[90%] max-w-sm max-h-[85%] bg-art-bg/95 backdrop-blur-xl border border-art-border z-40 flex flex-col rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden",
          mounted ? "opacity-100 scale-100 -translate-x-1/2 -translate-y-1/2" : "opacity-0 scale-95 -translate-x-1/2 -translate-y-1/2"
        )}
      >
        {/* Header Close button */}
        <div className="px-5 pt-5 pb-2 flex justify-between items-center border-b border-art-border/50">
          <span className="text-[10px] uppercase font-bold tracking-widest text-art-muted bg-current/5 px-2.5 py-0.5 rounded-sm">
            Showcase 3D
          </span>
          <button 
            onClick={onClose}
            className="text-[10px] uppercase font-bold tracking-widest text-art-muted hover:text-art-text transition-colors border border-art-border px-3 py-1.5 glass-surface rounded-md"
          >
            Fermer
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* 3D Showcase viewport */}
          <div className="w-full bg-slate-50/30 border border-art-border rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden">
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="text-[9px] font-bold text-white bg-art-text/90 tracking-tight px-2.5 py-0.5 rounded-sm shadow-sm font-mono">
                {product.price.toFixed(0)} {currency}
              </span>
            </div>
            <Product3DShowcase imageUrl={product.imageUrl} name={product.name} />
          </div>

          {/* Product info */}
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              {product.category && (
                <span className="w-fit text-[9px] uppercase font-bold tracking-widest text-art-muted border border-art-border px-2 py-0.5 rounded-sm">
                  {product.category}
                </span>
              )}
              <h2 className="text-xl font-serif italic text-art-text leading-tight">{product.name}</h2>
            </div>

            {/* Description */}
            <div className="space-y-1 border-t border-art-border/50 pt-3">
              <span className="block text-[9px] uppercase font-bold tracking-wider text-art-muted">Description</span>
              {product.description ? (
                <p className="text-xs text-art-muted leading-relaxed italic font-serif bg-current/2 p-2.5 rounded-lg border border-art-border/30">
                  {product.description}
                </p>
              ) : (
                <p className="text-xs text-art-muted/50 italic">Aucune description disponible.</p>
              )}
            </div>

            {/* Stock indicator */}
            <div className="flex items-center gap-2 pt-1 text-[9px] uppercase font-bold tracking-widest font-mono">
              {stock <= 0 ? (
                <span className="text-red-500 bg-red-50/50 border border-red-200/50 px-2 py-0.5 rounded flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  ❌ Rupture de stock
                </span>
              ) : stock <= 3 ? (
                <span className="text-red-500 animate-pulse bg-red-50/50 border border-red-200/50 px-2 py-0.5 rounded flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  🔥 Plus que {stock} exemplaires restants !
                </span>
              ) : (
                <span className="text-emerald-600 bg-emerald-50/50 border border-emerald-200/50 px-2 py-0.5 rounded flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ✓ En stock ({stock} dispo)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer Checkout action bar */}
        <div className="p-5 border-t border-art-border bg-art-bg/80 backdrop-blur-md">
          {stock <= 0 ? (
            <div className="w-full text-xs uppercase font-bold tracking-widest text-red-500 border border-red-200 bg-red-50 py-3.5 text-center rounded-md">
              Rupture de stock
            </div>
          ) : cartQty > 0 ? (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center text-xs font-mono font-bold w-full justify-between border border-art-text p-1 glass-surface rounded-md">
                <button 
                  onClick={onRemoveFromCart} 
                  className="w-8 h-8 flex items-center justify-center text-art-text hover:glass border border-transparent hover:border-art-border transition-colors rounded-md"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold">{cartQty} dans le panier</span>
                <button 
                  onClick={(e) => onAddToCart(e)} 
                  disabled={cartQty >= stock} 
                  className="w-8 h-8 flex items-center justify-center text-art-text hover:glass border border-transparent hover:border-art-border transition-colors disabled:opacity-30 rounded-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <button 
                onClick={onClose}
                className="w-full text-xs uppercase font-bold tracking-widest text-white py-3.5 text-center rounded-md transition-all active:scale-[0.98]"
                style={{ backgroundColor: themeColor }}
              >
                Retour aux articles
              </button>
            </div>
          ) : (
            <button 
              onClick={(e) => {
                onAddToCart(e);
              }} 
              className="w-full text-xs uppercase font-bold tracking-widest text-white py-3.5 text-center transition-all hover:tracking-wider active:scale-[0.98] duration-300 shadow-lg rounded-md"
              style={{ backgroundColor: themeColor }}
            >
              Ajouter au panier • {product.price.toFixed(0)} F
            </button>
          )}
        </div>
      </div>
    </>
  );
}

const IVORY_COAST_COMMUNES: Record<string, string[]> = {
  "Cocody": [
    "Angré (8ème Tranche, 7ème Tranche, Djibi, Nouveau CHU)",
    "Riviera (Riviera 3, Riviera 4, Palmeraie, Faya, M'Pouto)",
    "Deux Plateaux (Vallons, Mobil, Aghien, Las Palmas)",
    "Blockhauss",
    "Cité des Arts",
    "Danga",
    "Sogefiha Cocody",
    "Riviera Bonoumin"
  ],
  "Yopougon": [
    "Niangon (Niangon Nord, Niangon Sud)",
    "Toits Rouges",
    "Selmer",
    "Maroc",
    "Sogefiha Yopougon",
    "Siporex",
    "Bel Air",
    "Gesco",
    "Wassakara",
    "Cité Verte",
    "Millionnaire"
  ],
  "Marcory": [
    "Zone 4 (Biétry, Rue du Canal)",
    "Marcory Résidentiel",
    "Marcory Sans Fil",
    "Zone 3",
    "Marcory Aliodan",
    "Marcory Hibiscus",
    "Marcory SICOGI"
  ],
  "Abobo": [
    "Abobo Baoulé",
    "Abobo Té",
    "Dokui (Plateau Dokui)",
    "Avocatier",
    "PK 18",
    "Sogefiha Abobo",
    "Anonkoua Kouté",
    "Samaké"
  ],
  "Koumassi": [
    "Koumassi Prodom",
    "Zone Industrielle",
    "Koumassi Remblais",
    "Koumassi Divo",
    "Koumassi 05",
    "Sogefiha Koumassi",
    "Koumassi Soweto"
  ],
  "Adjamé": [
    "Mirador",
    "Adjamé 220 Logements",
    "Marie Thérèse Houphouët-Boigny",
    "Paillet",
    "Williamsville",
    "Adjamé Marché"
  ],
  "Treichville": [
    "Zone 1",
    "Treichville Avenue (Avenue 1 à 24)",
    "Treichville Arras",
    "Cité Gendarmerie",
    "Quartier France"
  ],
  "Port-Bouët": [
    "Cité Aéroport",
    "Port-Bouët Centre",
    "Vridi (Vridi Cité, Vridi Canal)",
    "Gonzagueville",
    "Adjouffou",
    "Abattoir"
  ],
  "Plateau": [
    "Centre-ville (Avenues, Rues)",
    "Plateau Indénié",
    "Cité Esculape",
    "Plateau Sud"
  ],
  "Bingerville": [
    "Bingerville Centre",
    "Feh Kessé",
    "Cité EECI",
    "Cité Promogim",
    "Gbagba"
  ],
  "Songon": [
    "Songon Kassemblé",
    "Songon Agban",
    "Songon Dagbé",
    "Cité ADDHA"
  ],
  "Anyama": [
    "Anyama Centre",
    "Anyama Adjamé",
    "Anyama Christian"
  ]
};

function CheckoutArea({ 
  storeId, storeWhatsApp, storeDeliveryCost, storeCountry, cart, cartTotal, onBack, onSuccess, onOrderCreated 
}: { 
  storeId: string, 
  storeWhatsApp?: string,
  storeDeliveryCost: number,
  storeCountry?: string,
  cart: { product: Product, quantity: number }[], 
  cartTotal: number, 
  onBack: () => void,
  onSuccess: (track?: boolean) => void,
  onOrderCreated: (orderId: string) => void
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryNeighborhood, setDeliveryNeighborhood] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [customNeighborhood, setCustomNeighborhood] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ordered, setOrdered] = useState(false);

  const countryCode = storeCountry || 'CI';
  const currentCountryCommunes = COUNTRIES[countryCode]?.communes || {};
  const currency = COUNTRIES[countryCode]?.currency || 'FCFA';

  const deliveryCost = deliveryMethod === 'delivery' ? storeDeliveryCost : 0;
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

      const finalCity = deliveryCity === 'Autre' ? customCity : deliveryCity;
      const finalNeighborhood = deliveryNeighborhood === 'Autre' ? customNeighborhood : deliveryNeighborhood;

      // Create order document
      const { data: createdOrder, error: orderError } = await supabase.from('orders').insert({
        user_id: storeId,
        customer_name: name,
        customer_phone: phone,
        customer_address: deliveryMethod === 'delivery' ? `${deliveryAddress}, ${finalNeighborhood}, ${finalCity}` : 'Retrait en magasin',
        items,
        total: finalTotal,
        status: 'pending'
      }).select().single();
      
      if (orderError) throw orderError;

      // Decrement stock for each product atomically via PostgreSQL RPC
      for (const item of cart) {
        if (item.product.id) {
          await supabase.rpc('decrement_stock', { 
            product_id: item.product.id, 
            quantity: item.quantity 
          });
        }
      }

      if (createdOrder) {
        onOrderCreated(createdOrder.id);
      }

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
    const finalCity = deliveryCity === 'Autre' ? customCity : deliveryCity;
    const finalNeighborhood = deliveryNeighborhood === 'Autre' ? customNeighborhood : deliveryNeighborhood;

    const textMessage = `*Nouvelle Commande*\n\n*Client:* ${name}\n*Tél:* ${phone}\n*Livraison:* ${deliveryMethod === 'delivery' ? finalCity + ' - ' + finalNeighborhood : 'Retrait'}\n\n*Articles:*\n${cart.map(c => `- ${c.quantity}x ${c.product.name} (${(c.product.price * c.quantity).toFixed(0)} ${currency})`).join('\n')}\n\n*Total: ${finalTotal.toFixed(0)} ${currency}*`;
    const waLink = storeWhatsApp ? `https://wa.me/${storeWhatsApp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(textMessage)}` : '';

    return (
      <div className="p-8 flex flex-col items-center justify-center h-full text-center mt-12 glass-surface m-6 border border-art-border relative">
        <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-art-text" />
        <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-art-text" />
        
        <CheckCircle2 className="w-16 h-16 text-art-accent mb-6" />
        <h2 className="text-3xl font-serif italic text-art-text mb-4">Commande Validée.</h2>
        <p className="text-sm font-mono text-art-muted mb-8">Le vendeur prendra contact avec vous très prochainement.</p>

        {storeWhatsApp ? (
          <div className="flex flex-col gap-3 w-full">
            <a 
              href={waLink}
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] text-white py-4 font-bold text-xs uppercase tracking-widest shadow-[4px_4px_0px_rgba(0,0,0,0.1)] active:scale-[0.99] transition-transform hover:translate-y-px flex items-center justify-center gap-2 hover:bg-[#20ba5a]"
            >
              Envoyer ma commande sur WhatsApp
            </a>
            
            <button 
              onClick={() => onSuccess(true)}
              className="w-full bg-art-text text-white py-4 font-bold text-xs uppercase tracking-widest shadow-[4px_4px_0px_rgba(0,0,0,0.1)] active:scale-[0.99] transition-transform hover:translate-y-px flex items-center justify-center gap-2"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Suivre ma commande en direct
            </button>

            <button onClick={() => onSuccess(false)} className="text-xs uppercase font-bold tracking-widest text-art-muted hover:text-art-text transition-colors mt-4 border-b border-transparent hover:border-art-text w-fit mx-auto pb-1">
              Retourner à la boutique
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full">
            <button 
              onClick={() => onSuccess(true)}
              className="w-full bg-art-text text-white py-4 font-bold text-xs uppercase tracking-widest shadow-[4px_4px_0px_rgba(0,0,0,0.1)] active:scale-[0.99] transition-transform hover:translate-y-px flex items-center justify-center gap-2"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Suivre ma commande en direct
            </button>

            <button onClick={() => onSuccess(false)} className="text-xs uppercase font-bold tracking-widest text-art-muted hover:text-art-text transition-colors mt-4 border-b border-transparent hover:border-art-text w-fit mx-auto pb-1">
              Retourner à la boutique
            </button>
          </div>
        )}
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
               <span className="font-bold text-sm mb-1">{(item.product.price * item.quantity).toFixed(0)} {currency}</span>
               <span className="text-[10px] text-art-muted">{item.product.price.toFixed(0)} {currency} / u</span>
            </div>
          </div>
        ))}
        <div className="pt-2 flex justify-between font-bold text-art-text text-sm font-serif italic border-t border-art-border mt-4">
          <span>Sous-total</span>
          <span>{cartTotal.toFixed(0)} {currency}</span>
        </div>
        {deliveryMethod === 'delivery' && (
          <div className="flex justify-between font-bold text-art-text text-sm font-serif italic text-art-muted py-1">
            <span>Frais de livraison</span>
            <span>{deliveryCost.toFixed(0)} {currency}</span>
          </div>
        )}
        <div className="pt-2 flex justify-between font-bold text-art-text text-lg font-serif italic border-t border-art-border">
          <span>Total</span>
          <span className="text-art-accent">{finalTotal.toFixed(0)} {currency}</span>
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
              <span className="text-xs text-art-muted mt-1 font-mono italic font-serif">{storeDeliveryCost} {currency}</span>
            </button>
          </div>
        </div>

        {deliveryMethod === 'delivery' && (
          <div className="space-y-6 glass-surface p-4 border border-art-border">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-art-muted mb-2">Ville / Commune *</label>
              <select
                required={deliveryMethod === 'delivery'}
                value={deliveryCity}
                onChange={e => {
                  setDeliveryCity(e.target.value);
                  setDeliveryNeighborhood(''); // reset neighborhood when city changes
                }}
                className="w-full glass border border-art-border p-3 focus:outline-none focus:border-art-text text-sm transition-colors bg-art-bg text-art-text"
              >
                <option value="">Sélectionnez votre commune</option>
                {Object.keys(currentCountryCommunes).map(commune => (
                  <option key={commune} value={commune}>{commune}</option>
                ))}
                <option value="Autre">Autre (Saisir manuellement)</option>
              </select>
              {deliveryCity === 'Autre' && (
                <input
                  required
                  value={customCity}
                  onChange={e => setCustomCity(e.target.value)}
                  type="text"
                  className="w-full glass border border-art-border p-3 focus:outline-none focus:border-art-text text-sm transition-colors mt-2"
                  placeholder="Saisissez le nom de votre ville ou commune"
                />
              )}
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-art-muted mb-2">Quartier / Repère *</label>
              {deliveryCity && deliveryCity !== 'Autre' ? (
                <>
                  <select
                    required={deliveryMethod === 'delivery'}
                    value={deliveryNeighborhood}
                    onChange={e => setDeliveryNeighborhood(e.target.value)}
                    className="w-full glass border border-art-border p-3 focus:outline-none focus:border-art-text text-sm transition-colors bg-art-bg text-art-text"
                  >
                    <option value="">Sélectionnez votre quartier</option>
                    {(currentCountryCommunes[deliveryCity] || []).map(q => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                    <option value="Autre">Autre (Saisir manuellement)</option>
                  </select>
                  {deliveryNeighborhood === 'Autre' && (
                    <input
                      required
                      value={customNeighborhood}
                      onChange={e => setCustomNeighborhood(e.target.value)}
                      type="text"
                      className="w-full glass border border-art-border p-3 focus:outline-none focus:border-art-text text-sm transition-colors mt-2"
                      placeholder="Saisissez le nom de votre quartier"
                    />
                  )}
                </>
              ) : (
                <input
                  required={deliveryMethod === 'delivery'}
                  value={deliveryNeighborhood}
                  onChange={e => setDeliveryNeighborhood(e.target.value)}
                  type="text"
                  className="w-full glass border border-art-border p-3 focus:outline-none focus:border-art-text text-sm transition-colors"
                  placeholder="Ex: Angré 8ème tranche, près de la pharmacie"
                />
              )}
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-art-muted mb-2">Adresse détaillée <span className="font-normal italic font-serif lowercase text-xs">(optionnel)</span></label>
              <input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} type="text" className="w-full glass border border-art-border p-3 focus:outline-none focus:border-art-text text-sm transition-colors" placeholder="N° de rue, porte, etc. (Plus de précision)" />
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

function OrderTracking({
  orderId,
  storeWhatsApp,
  currency,
  onClose,
  onClearTracking
}: {
  orderId: string;
  storeWhatsApp?: string;
  currency: string;
  onClose: () => void;
  onClearTracking: () => void;
}) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch initial order details
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();
        if (data) {
          setOrder(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  // Real-time subscription to order updates!
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`live-tracking-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, (payload) => {
        if (payload.new) {
          setOrder(payload.new);
          toast.success("Mise à jour de commande !", {
            description: `Statut : ${
              payload.new.status === 'processing' ? 'En préparation' :
              payload.new.status === 'shipping' ? 'En cours de livraison' :
              payload.new.status === 'completed' ? 'Livrée / Prête !' :
              payload.new.status === 'cancelled' ? 'Annulée' : 'Reçue'
            }`
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-art-text mb-4" />
        <p className="text-xs uppercase font-bold tracking-widest text-art-muted animate-pulse">Connexion au suivi en direct...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
        <XCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-serif italic mb-2">Commande introuvable</h3>
        <p className="text-xs text-art-muted max-w-xs mb-6">Cette commande n'existe plus ou a été supprimée.</p>
        <button onClick={onClose} className="bg-art-text text-white text-[10px] uppercase font-bold tracking-widest px-6 py-3">
          Retour
        </button>
      </div>
    );
  }

  const steps = [
    { key: 'pending', label: 'Reçue', desc: 'Votre commande a été envoyée au vendeur.' },
    { key: 'processing', label: 'Préparation', desc: 'Le vendeur prépare avec soin vos articles.' },
    { key: 'shipping', label: 'En livraison', desc: 'Le livreur a récupéré votre commande et est en route.' },
    { key: 'completed', label: 'Livrée / Prête', desc: 'Votre commande est prête ou bien reçue !' }
  ];

  const currentStatus = order.status;
  const isCancelled = currentStatus === 'cancelled';

  // Determine active step index
  let activeStepIndex = 0;
  if (currentStatus === 'processing') activeStepIndex = 1;
  if (currentStatus === 'shipping') activeStepIndex = 2;
  if (currentStatus === 'completed') activeStepIndex = 3;

  const total = Number(order.total);

  return (
    <div className="p-6 relative max-w-2xl mx-auto">
      <button onClick={onClose} className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-art-muted mb-8 hover:text-art-text transition-colors">
        <ArrowLeft className="w-3 h-3" />
        Retour à la boutique
      </button>

      {/* Header with Live radar */}
      <div className="glass-surface border border-art-border p-5 rounded-xl mb-6 relative overflow-hidden">
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-600 px-3 py-1 rounded-full text-[9px] uppercase font-mono tracking-wider font-semibold animate-pulse">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Direct
        </div>

        <h2 className="text-2xl font-serif italic text-art-text">Suivi en direct</h2>
        <p className="text-[10px] font-mono text-art-muted mt-1 uppercase tracking-widest">N° de commande : #{order.id.slice(0, 8)}</p>
      </div>

      {/* Order Status Display */}
      {isCancelled ? (
        <div className="bg-red-500/10 border border-red-500/30 text-red-700 p-5 rounded-xl text-center mb-8">
          <XCircle className="w-12 h-12 mx-auto mb-3 text-red-600" />
          <h3 className="text-lg font-serif italic">Commande annulée</h3>
          <p className="text-xs text-red-600/80 mt-1">Désolé, cette commande a été annulée par le vendeur.</p>
        </div>
      ) : (
        <div className="space-y-6 mb-10 pl-4">
          {/* Visual scooter progress road simulator */}
          <div className="glass-surface border border-art-border p-5 rounded-xl mb-6 relative overflow-hidden bg-slate-50/20 shadow-inner">
            <span className="block text-[8px] uppercase font-bold tracking-widest text-art-muted mb-4 font-mono">
              Simulateur de livraison
            </span>
            <div className="relative w-full h-8 flex items-center">
              {/* The Road Line */}
              <div className="absolute left-0 right-0 h-0.5 border-t border-dashed border-art-border/80" />
              
              {/* Scooter Icon moving */}
              <div 
                className="absolute -top-3 w-7 h-7 flex items-center justify-center bg-white border border-art-border rounded-full shadow-md transition-all duration-1000 ease-out z-10"
                style={{ 
                  left: `calc(${activeStepIndex * 33.33}% - 14px)`,
                  borderColor: activeStepIndex >= 2 ? 'var(--color-art-accent)' : 'var(--color-art-border)'
                }}
              >
                {activeStepIndex === 3 ? (
                  <span className="text-xs">🎁</span>
                ) : (
                  <span className="text-xs animate-bounce">🛵</span>
                )}
              </div>
              
              {/* Pulsing hotspots for steps */}
              <div className="absolute inset-0 flex justify-between pointer-events-none items-center">
                {[0, 1, 2, 3].map((stepIdx) => {
                  const isPassedOrCurrent = stepIdx <= activeStepIndex;
                  return (
                    <div 
                      key={stepIdx} 
                      className={cn(
                        "w-2.5 h-2.5 rounded-full border-2 transition-all duration-500 relative bg-art-bg",
                        isPassedOrCurrent ? "border-art-text scale-110" : "border-art-border"
                      )}
                    >
                      {stepIdx === activeStepIndex && (
                        <span className="animate-ping absolute -inset-0.5 rounded-full bg-art-text/40 opacity-75"></span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-between text-[8px] uppercase tracking-wider font-bold text-art-muted mt-2">
              <span>Reçue</span>
              <span className="translate-x-1.5">Préparation</span>
              <span className="-translate-x-1.5">En Livraison</span>
              <span>Livrée</span>
            </div>
          </div>

          <div className="relative pl-8 border-l-2 border-art-border/40 ml-4 space-y-12 py-2">
            {steps.map((step, idx) => {
              const isPast = idx < activeStepIndex;
              const isCurrent = idx === activeStepIndex;
              const isFuture = idx > activeStepIndex;

              return (
                <div key={step.key} className="relative">
                  {/* Step Dot */}
                  <div className={cn(
                    "absolute -left-[41px] top-0 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-500 z-10",
                    isPast ? "bg-art-text border-art-text text-white" :
                    isCurrent ? "bg-art-bg border-art-text text-art-text scale-110 shadow-md" :
                    "bg-art-bg border-art-border text-art-muted"
                  )}>
                    {isPast ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <span className="text-[9px] font-bold font-mono">{idx + 1}</span>
                    )}
                    {isCurrent && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-art-text/20 opacity-75"></span>
                    )}
                  </div>

                  {/* Step Text */}
                  <div className={cn(
                    "transition-all duration-300",
                    isFuture ? "opacity-40" : "opacity-100"
                  )}>
                    <h3 className={cn(
                      "text-sm uppercase font-bold tracking-wider",
                      isCurrent ? "text-art-text font-extrabold" : "text-art-muted"
                    )}>
                      {step.label}
                    </h3>
                    <p className="text-xs text-art-muted mt-1">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recap details */}
      <div className="glass-surface border border-art-border p-5 rounded-xl mb-6">
        <h3 className="text-xs uppercase font-bold tracking-widest text-art-muted mb-4">Récapitulatif de livraison</h3>
        <div className="space-y-3 text-xs text-art-text">
          <div className="flex justify-between border-b border-art-border/30 pb-2">
            <span className="text-art-muted">Client :</span>
            <span className="font-semibold">{order.customer_name}</span>
          </div>
          <div className="flex justify-between border-b border-art-border/30 pb-2">
            <span className="text-art-muted">Téléphone :</span>
            <span className="font-semibold font-mono">{order.customer_phone}</span>
          </div>
          <div className="flex justify-between border-b border-art-border/30 pb-2">
            <span className="text-art-muted">Adresse :</span>
            <span className="font-semibold text-right max-w-[200px]">{order.customer_address}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-art-muted font-bold">Total réglé :</span>
            <span className="font-bold text-art-accent">{total.toFixed(0)} {currency}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 mt-8">
        {storeWhatsApp && (
          <a
            href={`https://wa.me/${storeWhatsApp.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] text-white py-4 font-bold text-xs uppercase tracking-widest text-center shadow-lg active:scale-[0.99] transition-transform flex items-center justify-center gap-2 hover:bg-[#20ba5a]"
          >
            Contacter le vendeur
          </a>
        )}
        <button
          onClick={() => {
            onClearTracking();
            onClose();
          }}
          className="text-xs uppercase font-bold tracking-widest text-art-muted hover:text-red-500 transition-colors mt-6 border-b border-transparent hover:border-red-500 w-fit mx-auto pb-1"
        >
          Effacer le suivi de cette commande
        </button>
      </div>
    </div>
  );
}
