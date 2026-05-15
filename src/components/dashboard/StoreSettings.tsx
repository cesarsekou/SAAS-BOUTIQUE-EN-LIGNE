import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Loader2, Trash2, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface StoreSettingsProps {
  user: User;
}

export function StoreSettings({ user }: StoreSettingsProps) {
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [themeColor, setThemeColor] = useState('#FF5F1F');
  const [backgroundColor, setBackgroundColor] = useState('#FDFCF8');
  const [textColor, setTextColor] = useState('#1A1A1A');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [newCat, setNewCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchUser = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setStoreName(data.storeName || '');
        setStoreSlug(data.storeSlug || '');
        setCategories(data.categories || []);
        setThemeColor(data.themeColor || '#FF5F1F');
        setBackgroundColor(data.backgroundColor || '#FDFCF8');
        setTextColor(data.textColor || '#1A1A1A');
        setWhatsappNumber(data.whatsappNumber || '');
      }
      setLoading(false);
    };
    fetchUser();
  }, [user.uid]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: '', type: '' });

    const formattedSlug = storeSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    setStoreSlug(formattedSlug);

    try {
      const q = query(collection(db, 'users'), where('storeSlug', '==', formattedSlug));
      const snap = await getDocs(q);
      const otherUserWithSlug = snap.docs.find(d => d.id !== user.uid);
      if (otherUserWithSlug) {
        setMsg({ text: 'Ce lien est déjà pris par une autre boutique.', type: 'error' });
        setSaving(false);
        return;
      }

      await updateDoc(doc(db, 'users', user.uid), {
        storeName,
        storeSlug: formattedSlug,
        categories,
        themeColor,
        backgroundColor,
        textColor,
        whatsappNumber,
      });
      setMsg({ text: 'Paramètres enregistrés !', type: 'success' });
      toast.success('Paramètres enregistrés !');
    } catch (error) {
      console.error(error);
      setMsg({ text: "Erreur lors de l'enregistrement.", type: 'error' });
    }
    setSaving(false);
  };

  const addCategory = () => {
    const trimmed = newCat.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
      setNewCat('');
    }
  };

  if (loading) return <div className="flex p-8 justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <header className="flex justify-between items-end border-b border-art-border pb-6">
        <h1 className="text-4xl font-serif italic tracking-tight text-art-text">Paramètres</h1>
      </header>

      {/* Public Link */}
      <div className="glass p-8">
        <h2 className="text-xl font-medium tracking-tight mb-6">Lien public</h2>
        <div className="p-4 glass-surface border border-art-border flex items-center justify-between">
          <div className="flex items-center text-sm font-mono text-art-text truncate mr-4">
            <span className="text-art-muted">omnishop.io/</span>
            <span className="font-bold border-b border-art-text mb-0.5">{storeSlug}</span>
          </div>
          <a
            href={`/${storeSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest hover:text-art-accent transition-colors whitespace-nowrap border-2 border-art-text px-4 py-2 hover:border-art-accent"
          >
            Ouvrir <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Categories */}
      <div className="glass p-8">
        <h2 className="text-xl font-medium tracking-tight mb-6">Catégories de la boutique</h2>
        <div className="space-y-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              placeholder="Ex: Soins du visage, Offres Spéciales..."
              className="flex-1 glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text text-sm"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }}
            />
            <button
              type="button"
              onClick={addCategory}
              className="bg-art-text text-white px-8 py-3 text-xs uppercase font-bold tracking-widest hover:glass-surface hover:text-art-text border-2 border-transparent hover:border-art-text transition-colors whitespace-nowrap"
            >
              Ajouter
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat, idx) => (
              <span key={idx} className="flex items-center gap-3 glass-surface border border-art-border px-3 py-1.5 text-sm font-medium">
                {cat}
                <button type="button" onClick={() => setCategories(categories.filter((_, i) => i !== idx))} className="text-art-muted hover:text-red-500 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
            {categories.length === 0 && <span className="text-sm italic font-serif text-art-muted">Aucune catégorie configurée pour le moment.</span>}
          </div>
          <p className="text-[10px] uppercase tracking-widest text-art-muted">N'oubliez pas d'enregistrer vos paramètres pour appliquer les modifications.</p>
        </div>
      </div>

      {/* Theme Colors */}
      <div className="glass p-8">
        <h2 className="text-xl font-medium tracking-tight mb-6">Personnalisation de l'interface</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Couleur d'accentuation", value: themeColor, set: setThemeColor },
            { label: 'Couleur de fond', value: backgroundColor, set: setBackgroundColor },
            { label: 'Couleur du texte', value: textColor, set: setTextColor },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="block text-xs uppercase tracking-widest text-art-muted mb-2">{label}</label>
              <div className="flex gap-2">
                <input type="color" value={value} onChange={e => set(e.target.value)} className="h-10 w-10 border border-art-border p-1 glass-surface cursor-pointer" />
                <input type="text" value={value} onChange={e => set(e.target.value)} className="flex-1 glass-surface border border-art-border p-2 focus:outline-none focus:border-art-text font-mono text-sm uppercase" />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[10px] uppercase tracking-widest text-art-muted">N'oubliez pas d'enregistrer vos paramètres pour appliquer les modifications.</p>
      </div>

      {/* General Info + Save */}
      <div className="glass p-8">
        <h2 className="text-xl font-medium tracking-tight mb-6">Informations générales</h2>
        <form onSubmit={handleSave} className="space-y-6">
          {msg.text && (
            <div className={cn('p-4 border text-sm italic font-serif', msg.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200')}>
              {msg.text}
            </div>
          )}
          <div>
            <label className="block text-xs uppercase tracking-widest text-art-muted mb-2">Nom de la boutique</label>
            <input required value={storeName} onChange={e => setStoreName(e.target.value)} type="text" className="w-full glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text text-sm" />
            <p className="mt-2 text-[10px] uppercase tracking-widest text-art-muted">Affiché en titre sur votre boutique.</p>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-art-muted mb-2">Identifiant (URL)</label>
            <input required value={storeSlug} onChange={e => setStoreSlug(e.target.value)} type="text" className="w-full glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text font-mono text-sm" />
            <p className="mt-2 text-[10px] uppercase tracking-widest text-art-muted">Doit être unique. Lettres minuscules et tirets uniquement.</p>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-art-muted mb-2">Numéro WhatsApp (Commandes)</label>
            <input value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} type="tel" className="w-full glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text font-mono text-sm" placeholder="Ex: +225 01 02 03 04 05" />
            <p className="mt-2 text-[10px] uppercase tracking-widest text-art-muted">Si renseigné, les clients pourront envoyer leur commande directement sur WhatsApp.</p>
          </div>
          <div className="pt-8 border-t border-art-border flex justify-end">
            <button disabled={saving} type="submit" className="text-xs uppercase font-bold tracking-widest text-art-text border-b-2 border-art-accent pb-1 hover:text-art-accent disabled:opacity-50 transition-colors flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
