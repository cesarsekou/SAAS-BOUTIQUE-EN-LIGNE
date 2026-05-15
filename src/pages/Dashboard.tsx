/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import {
  collection, query, where, getDocs, doc, getDoc,
  updateDoc, addDoc, deleteDoc, serverTimestamp, orderBy, onSnapshot, limit,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../lib/firebase';
import { Package, ShoppingCart, Settings, LogOut, Plus, Trash2, Loader2, Search, BarChart, Edit2, CreditCard } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

// Extracted components
import { ProductCard } from '../components/dashboard/ProductCard';
import { ProductForm } from '../components/dashboard/ProductForm';
import { EditProductModal } from '../components/dashboard/EditProductModal';
import { Orders } from '../components/dashboard/Orders';
import { Stats } from '../components/dashboard/Stats';
import { StoreSettings } from '../components/dashboard/StoreSettings';
import { Billing } from '../components/dashboard/Billing';
import { Product } from '../types/index';

// ─── Dashboard Shell ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) navigate('/login');
      else setUser(u);
      setLoading(false);
    });
    return unsub;
  }, [navigate]);

  // Real-time new-order notifications
  useEffect(() => {
    if (!user) return;
    const mountTime = new Date();
    const q = query(
      collection(db, 'orders'),
      where('storeId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const order = change.doc.data();
          if (order.createdAt) {
            const createdAt = order.createdAt.toDate();
            if (createdAt > mountTime && order.status === 'pending') {
              toast.success(`Nouvelle commande de ${order.customerName}`, {
                description: `Montant : ${order.totalAmount?.toFixed(2)} € | ${order.items?.length || 0} article(s)`,
                duration: 8000,
                action: { label: 'Voir la commande', onClick: () => navigate('/dashboard/orders') },
              });
            }
          }
        }
      });
    }, (error) => { console.error('Orders listener error', error); });
    return () => unsubscribe();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-art-bg">
        <Loader2 className="w-8 h-8 animate-spin text-art-text" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col md:flex-row h-screen font-sans text-art-text overflow-hidden relative bg-transparent">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full p-4 md:p-12 z-10 glass-surface mt-0 md:mt-0 md:ml-0 rounded-none md:rounded-tl-2xl border-t md:border-t-0 md:border-l border-white/40 shadow-inner">
        <Routes>
          <Route path="/" element={<Products user={user} />} />
          <Route path="/orders" element={<Orders user={user} />} />
          <Route path="/stats" element={<Stats user={user} />} />
          <Route path="/billing" element={<Billing user={user} />} />
          <Route path="/settings" element={<StoreSettings user={user} />} />
        </Routes>
      </main>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const navItems = [
    { name: 'Produits',     path: '/dashboard',          icon: Package },
    { name: 'Commandes',    path: '/dashboard/orders',   icon: ShoppingCart },
    { name: 'Statistiques', path: '/dashboard/stats',    icon: BarChart },
    { name: 'Abonnement',   path: '/dashboard/billing',  icon: CreditCard },
    { name: 'Paramètres',   path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-art-border flex flex-col md:flex-col p-4 md:p-8 bg-art-bg/90 backdrop-blur-sm z-20 flex-shrink-0">
      <div className="mb-4 md:mb-12 flex justify-between items-center md:items-start md:flex-col">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tighter italic font-serif text-art-text">OmniShop.</h1>
          <p className="text-[10px] uppercase tracking-widest text-art-muted mt-1 hidden md:block">Social Commerce</p>
        </div>
        <button onClick={handleLogout} className="md:hidden flex items-center text-xs font-medium text-art-muted hover:text-art-text transition">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
      <nav className="flex md:flex-col gap-4 md:gap-6 overflow-x-auto pb-2 md:pb-0 scrollbar-hide md:flex-1">
        {navItems.map((item, idx) => {
          const isActive = item.path === '/dashboard'
            ? location.pathname === '/dashboard'
            : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'group flex items-center space-x-2 md:space-x-3 text-xs md:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0',
                isActive ? 'border-b-2 border-art-text pb-1 text-art-text' : 'text-art-muted hover:text-art-text'
              )}
            >
              <span className="text-[10px] uppercase font-mono glass-surface px-1">{`0${idx + 1}`}</span>
              <span className="flex items-center gap-2"><item.icon className="w-4 h-4" /> {item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="hidden md:block mt-auto pt-4 border-t border-art-border">
        <button onClick={handleLogout} className="flex items-center gap-3 text-sm font-medium text-art-muted hover:text-art-text transition w-fit group">
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}

// ─── Products View ────────────────────────────────────────────────────────────

function Products({ user }: { user: User }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [userCategories, setUserCategories] = useState<string[]>([]);

  useEffect(() => {
    const init = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists() && snap.data().categories) setUserCategories(snap.data().categories);
      await fetchProducts();
    };
    init();
  }, [user.uid]);

  const fetchProducts = async () => {
    const q = query(collection(db, 'products'), where('storeId', '==', user.uid));
    const snap = await getDocs(q);
    const p = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];
    p.sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    setProducts(p);
    setLoading(false);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const options = {
      maxSizeMB: 0.5, // Max 500KB
      maxWidthOrHeight: 1080,
      useWebWorker: true,
    };
    try {
      const compressedFile = await imageCompression(file, options);
      const fileRef = storageRef(storage, `products/${user.uid}/${Date.now()}_${compressedFile.name}`);
      const snapshot = await uploadBytes(fileRef, compressedFile);
      return getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error("Compression/Upload error:", error);
      throw error;
    }
  };

  const handleAddProduct = async (data: Partial<Product>, file?: File | null) => {
    let finalImageUrl = data.imageUrl || '';
    if (file) {
      try { finalImageUrl = await uploadImage(file); }
      catch { toast.error('Erreur upload image. Vérifiez Firebase Storage.'); return; }
    }
    await addDoc(collection(db, 'products'), {
      storeId: user.uid,
      name: data.name,
      price: data.price,
      stock: data.stock || 0,
      category: data.category || '',
      description: data.description || '',
      imageUrl: finalImageUrl,
      createdAt: serverTimestamp(),
    });
    toast.success('Produit ajouté !');
    fetchProducts();
  };

  const handleUpdateProduct = async (
    productId: string,
    data: Partial<Omit<Product, 'id' | 'createdAt'>>,
    file?: File | null
  ) => {
    let finalImageUrl = data.imageUrl;
    if (file) {
      try { finalImageUrl = await uploadImage(file); }
      catch { toast.error('Erreur upload image.'); return; }
    }
    await updateDoc(doc(db, 'products', productId), { ...data, imageUrl: finalImageUrl });
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...data, imageUrl: finalImageUrl } : p));
    setEditingProduct(null);
    toast.success('Produit modifié !');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    await deleteDoc(doc(db, 'products', id));
    setProducts(products.filter(p => p.id !== id));
    toast.success('Produit supprimé');
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-art-border pb-6 gap-6">
        <h1 className="text-4xl font-serif italic tracking-tight text-art-text">Mes Produits</h1>
        <div className="w-full md:w-72 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-art-muted" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 glass-surface border border-art-border focus:outline-none focus:border-art-text text-sm transition-colors"
          />
        </div>
      </header>

      <ProductForm userCategories={userCategories} onAdd={handleAddProduct} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-art-muted" />
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full py-12 text-center text-art-muted text-sm italic font-serif">Aucun produit pour le moment.</div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-art-muted text-sm italic font-serif">
            Aucun produit trouvé pour la recherche "{searchQuery}".
          </div>
        ) : (
          filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={setEditingProduct}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          userCategories={userCategories}
          onClose={() => setEditingProduct(null)}
          onSave={handleUpdateProduct}
        />
      )}
    </div>
  );
}