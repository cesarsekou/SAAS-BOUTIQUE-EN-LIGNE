import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { Loader2, Trash2, ExternalLink, Copy, Check, Download, Share2, Upload } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import { COUNTRIES } from '../../data/countries';

const COLOR_PRESETS = [
  {
    id: 'monresto',
    name: 'MonResto (Sommelier de minuit)',
    themeColor: '#10B981',
    backgroundColor: '#131313',
    textColor: '#ECFDF5',
  },
  {
    id: 'elegant',
    name: 'Luxe / Élégant',
    themeColor: '#D4A574',
    backgroundColor: '#111111',
    textColor: '#F5F5F5',
  },
  {
    id: 'nature',
    name: 'Nature / Frais',
    themeColor: '#22C55E',
    backgroundColor: '#FDFCF8',
    textColor: '#1B4332',
  },
  {
    id: 'mode',
    name: 'Corail / Mode',
    themeColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
    textColor: '#2D3748',
  },
  {
    id: 'tech',
    name: 'Océan / Tech',
    themeColor: '#3B82F6',
    backgroundColor: '#F8FAFC',
    textColor: '#1E293B',
  }
];

const HERO_PRESETS = [
  {
    id: 'gold-luxury',
    name: 'Or & Noir Minimaliste',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: 'editorial-fashion',
    name: 'Mode Éditoriale',
    url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: 'cozy-wellness',
    name: 'Bien-être & Naturel',
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: 'modern-cuisine',
    name: 'Gastronomie & Café',
    url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop'
  },
];

interface StoreSettingsProps {
  user: User;
}

export function StoreSettings({ user }: StoreSettingsProps) {
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [themeColor, setThemeColor] = useState('#FF5F1F');
  const [backgroundColor, setBackgroundColor] = useState('#FDFCF8');
  const [textColor, setTextColor] = useState('#1A1A1A');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [deliveryCost, setDeliveryCost] = useState(1000);
  const [country, setCountry] = useState('CI');
  const currency = COUNTRIES[country]?.currency || 'FCFA';
  const [newCat, setNewCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [copied, setCopied] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);
  const [heroImage, setHeroImage] = useState('');
  const [uploadingHero, setUploadingHero] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (data) {
        setStoreName(data.store_name || '');
        setStoreSlug(data.store_url || '');
        setSlugManuallyEdited(!!data.store_url);
        setCategories(data.categories || []);
        setThemeColor(data.theme_color || '#FF5F1F');
        setBackgroundColor(data.background_color || '#FDFCF8');
        setTextColor(data.text_color || '#1A1A1A');
        setWhatsappNumber(data.whatsapp_number || '');
        setDeliveryCost(data.delivery_cost ?? 1000);
        setHeroImage(data.hero_image || '');
        setCountry(data.country || 'CI');
      }
      setLoading(false);
    };
    fetchUser();
  }, [user.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: '', type: '' });

    const formattedSlug = storeSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    setStoreSlug(formattedSlug);

    // Validate WhatsApp number format
    if (whatsappNumber && !/^\+?\d{8,15}$/.test(whatsappNumber.replace(/\s/g, ''))) {
      setMsg({ text: 'Numéro WhatsApp invalide. Format attendu : +225XXXXXXXXXX', type: 'error' });
      setSaving(false);
      return;
    }

    try {
      const { data: existingSlugs } = await supabase
        .from('users')
        .select('id')
        .eq('store_url', formattedSlug)
        .neq('id', user.id);

      if (existingSlugs && existingSlugs.length > 0) {
        setMsg({ text: 'Ce lien est déjà pris par une autre boutique.', type: 'error' });
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('users')
        .update({
          store_name: storeName,
          store_url: formattedSlug,
          theme_color: themeColor,
          background_color: backgroundColor,
          text_color: textColor,
          whatsapp_number: whatsappNumber,
          delivery_cost: deliveryCost,
          categories: categories,
          hero_image: heroImage,
          country: country,
        })
        .eq('id', user.id);

      if (error) throw error;

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

  const handleHeroImageUpload = async (file: File) => {
    setUploadingHero(true);
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      const filePath = `${user.id}/hero_${Date.now()}_${compressedFile.name}`;
      
      const { data, error } = await supabase.storage
        .from('products')
        .upload(filePath, compressedFile);
        
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(data.path);
        
      setHeroImage(publicUrl);
      toast.success("Image de couverture téléchargée avec succès !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'upload de la couverture.");
    } finally {
      setUploadingHero(false);
    }
  };

  // Auto-generate slug from store name
  const slugify = (text: string) => text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const handleNameChange = (value: string) => {
    setStoreName(value);
    if (!slugManuallyEdited) {
      setStoreSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setStoreSlug(value);
  };

  const getFullStoreUrl = () => {
    const origin = window.location.origin;
    return `${origin}/${storeSlug}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getFullStoreUrl());
    setCopied(true);
    toast.success("Lien de la boutique copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = async () => {
    setDownloadingQr(true);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getFullStoreUrl())}`;
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `qrcode-${storeSlug}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("QR Code téléchargé !");
    } catch (err) {
      console.error(err);
      window.open(qrUrl, '_blank');
    } finally {
      setDownloadingQr(false);
    }
  };

  if (loading) return <div className="flex p-8 justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <header className="flex justify-between items-end border-b border-art-border pb-6">
        <h1 className="text-4xl font-serif italic tracking-tight text-art-text">Paramètres</h1>
      </header>

      {/* Public Link & Share Toolkit */}
      <div className="glass p-8">
        <h2 className="text-xl font-medium tracking-tight mb-6">Kit de partage</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Left sharing options */}
          <div className="md:col-span-2 space-y-6">
            <p className="text-sm text-art-muted leading-relaxed">
              Votre vitrine en ligne est prête ! Partagez ce lien unique avec vos clients sur les réseaux sociaux, dans votre bio Instagram, TikTok, ou directement par message pour recevoir vos commandes.
            </p>

            <div className="p-4 glass-surface border border-art-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center text-sm font-mono text-art-text truncate mr-2">
                <span className="text-art-muted select-none">omnishop.io/</span>
                <span className="font-bold border-b border-art-text mb-0.5 select-all">{storeSlug}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/${storeSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest hover:text-art-accent hover:border-art-accent transition-all whitespace-nowrap border-2 border-art-text px-4 py-2"
                >
                  Ouvrir <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest hover:text-art-accent hover:border-art-accent transition-all whitespace-nowrap border-2 border-art-text px-4 py-2 bg-white text-art-text"
                >
                  {copied ? (
                    <>Copié ! <Check className="w-3.5 h-3.5 text-green-600 animate-scale" /></>
                  ) : (
                    <>Copier <Copy className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Découvrez ma boutique en ligne sur OmniShop et commandez directement sur WhatsApp ! \n👉 ${getFullStoreUrl()}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20ba5a] text-white p-3 text-xs uppercase font-bold tracking-widest transition-colors border border-transparent shadow-sm"
              >
                <Share2 className="w-4 h-4" /> Partager sur WhatsApp
              </a>
            </div>

            <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-sm text-xs text-amber-900 leading-relaxed">
              💡 <strong>Conseil d'expert :</strong> Ajoutez ce lien dans la section <strong>"Site web"</strong> de votre profil Instagram ou TikTok. C'est l'emplacement idéal pour transformer vos abonnés en clients payants !
            </div>
          </div>

          {/* Right QR Code area */}
          <div className="md:col-span-1 flex flex-col items-center justify-center p-6 glass-surface border border-art-border text-center space-y-4">
            <span className="text-[10px] uppercase font-mono tracking-widest text-art-muted">Code QR Unique</span>
            <div className="bg-white p-3 border border-art-border shadow-inner relative group">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(getFullStoreUrl())}`}
                alt="QR Code boutique"
                className="w-36 h-36 select-none"
                loading="lazy"
              />
            </div>
            <p className="text-[10px] text-art-muted leading-relaxed max-w-[180px]">
              Téléchargez et imprimez votre QR code pour l'afficher sur vos emballages ou votre comptoir.
            </p>
            <button
              type="button"
              onClick={handleDownloadQr}
              disabled={downloadingQr}
              className="w-full flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest border border-art-text hover:bg-art-text hover:text-white transition-all py-2 disabled:opacity-50"
            >
              {downloadingQr ? (
                <>Téléchargement... <Loader2 className="w-3.5 h-3.5 animate-spin" /></>
              ) : (
                <>Télécharger le QR <Download className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>
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
          <p className="text-[10px] uppercase tracking-widest text-art-muted">Les catégories permettent de filtrer les produits dans la vitrine.</p>
        </div>
      </div>

      {/* Theme Colors & Live Preview */}
      <div className="glass p-8">
        <h2 className="text-xl font-medium tracking-tight mb-6">Personnalisation & Design de la vitrine</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Left: Customizer & Presets */}
          <div className="md:col-span-2 space-y-8">
            {/* Presets Grid */}
            <div className="space-y-4">
              <label className="block text-xs uppercase tracking-widest text-art-muted font-bold">Palettes & Styles Prédéfinis</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {COLOR_PRESETS.map(p => {
                  const isSelected = themeColor === p.themeColor && backgroundColor === p.backgroundColor && textColor === p.textColor;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setThemeColor(p.themeColor);
                        setBackgroundColor(p.backgroundColor);
                        setTextColor(p.textColor);
                        toast.success(`Palette "${p.name}" appliquée !`);
                      }}
                      className={`p-4 border text-left flex flex-col justify-between transition-all relative ${isSelected ? 'border-art-text bg-slate-50 ring-2 ring-art-text' : 'border-art-border hover:border-art-text/50'}`}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-4 h-4 bg-art-text text-white rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                      <span className="font-bold text-xs block mb-3">{p.name}</span>
                      <div className="flex gap-2 items-center">
                        <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: p.themeColor }} title="Accent" />
                        <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: p.backgroundColor }} title="Fond" />
                        <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: p.textColor }} title="Texte" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom fine-tuning */}
            <div className="space-y-4 border-t border-art-border pt-6">
              <label className="block text-xs uppercase tracking-widest text-art-muted font-bold">Ajustement précis des couleurs</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Accentuation", value: themeColor, set: setThemeColor },
                  { label: 'Fond de page', value: backgroundColor, set: setBackgroundColor },
                  { label: 'Couleur texte', value: textColor, set: setTextColor },
                ].map(({ label, value, set }) => (
                  <div key={label} className="space-y-2">
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-art-muted">{label}</span>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={value} 
                        onChange={e => set(e.target.value)} 
                        className="h-10 w-10 border border-art-border p-1 bg-white cursor-pointer rounded-sm" 
                      />
                      <input 
                        type="text" 
                        value={value} 
                        onChange={e => set(e.target.value)} 
                        className="flex-1 border border-art-border p-2 focus:outline-none focus:border-art-text font-mono text-xs uppercase bg-white" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Banner/Header Cover Image Option */}
            <div className="space-y-4 border-t border-art-border pt-6">
              <label className="block text-xs uppercase tracking-widest text-art-muted font-bold">Image de couverture de l'en-tête</label>
              <p className="text-xs text-art-muted leading-relaxed">
                Ajoutez une image de fond élégante pour l'en-tête de votre boutique. Elle s'adaptera automatiquement derrière le nom de votre boutique.
              </p>
              
              <div className="space-y-3">
                {/* Visual Preview + Actions */}
                {heroImage ? (
                  <div className="relative aspect-[3/1] w-full rounded-sm overflow-hidden border border-art-border group">
                    <img src={heroImage} alt="Cover preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setHeroImage('');
                          toast.info("Couverture supprimée.");
                        }}
                        className="p-2 bg-white text-red-600 rounded-full shadow-md hover:bg-red-50 hover:scale-105 transition-all"
                        title="Supprimer l'image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[3/1] w-full border-2 border-dashed border-art-border flex flex-col items-center justify-center text-center p-4 bg-slate-50/50">
                    <span className="text-xs text-art-muted italic font-serif">Aucune image de couverture configurée</span>
                  </div>
                )}

                {/* Upload or Link inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* File Upload */}
                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-art-muted mb-2">Uploader une image</span>
                    <label className={cn(
                      "flex items-center justify-center gap-2 cursor-pointer glass-surface border border-dashed border-art-border p-3 hover:border-art-text transition-colors rounded-sm text-xs font-medium text-art-text",
                      uploadingHero ? "opacity-50 pointer-events-none" : ""
                    )}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async e => { 
                          const f = e.target.files?.[0]; 
                          if (f) await handleHeroImageUpload(f); 
                        }} 
                      />
                      {uploadingHero ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Téléchargement...</>
                      ) : (
                        <>↑ Choisir un fichier</>
                      )}
                    </label>
                  </div>

                  {/* URL Input */}
                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-art-muted mb-2">Ou coller un lien d'image</span>
                    <input 
                      type="url" 
                      value={heroImage} 
                      onChange={e => setHeroImage(e.target.value)} 
                      placeholder="https://images.unsplash.com/..." 
                      className="w-full border border-art-border p-3 focus:outline-none focus:border-art-text text-xs font-mono bg-white rounded-sm"
                    />
                  </div>
                </div>

                {/* Curated Presets */}
                <div className="pt-2">
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-art-muted mb-2">Exemples de couvertures de luxe</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {HERO_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setHeroImage(preset.url);
                          toast.success(`Couverture "${preset.name}" sélectionnée !`);
                        }}
                        className={cn(
                          "relative aspect-[2/1] rounded-sm overflow-hidden border transition-all text-left group",
                          heroImage === preset.url ? "border-art-text ring-2 ring-art-text" : "border-art-border hover:border-art-text/50"
                        )}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/40 flex items-end p-1.5">
                          <span className="text-[8px] font-bold text-white tracking-tight truncate w-full">{preset.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Live Mockup Storefront */}
          <div className="md:col-span-1 border border-art-border p-4 bg-slate-50 flex flex-col items-center space-y-4">
            <span className="text-[10px] uppercase font-mono tracking-widest text-art-muted block text-center">Rendu en temps réel</span>
            
            <div 
              className="border border-slate-200 shadow-xl overflow-hidden flex flex-col aspect-[4/5] w-full max-w-[200px] transition-all duration-300 rounded-sm bg-white"
              style={{ backgroundColor: backgroundColor, color: textColor }}
            >
              {/* Header Mock */}
              <div 
                className={cn(
                  "p-2.5 border-b flex items-center justify-between relative overflow-hidden min-h-[45px]",
                  heroImage ? "text-white border-white/10" : "border-current/10"
                )}
                style={heroImage ? { 
                  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${heroImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : undefined}
              >
                <span className="font-serif italic font-bold text-[9px] truncate max-w-[80px] relative z-10">{storeName || 'Ma Boutique'}</span>
                <div className="w-3.5 h-3.5 rounded-full bg-current/10 flex items-center justify-center relative z-10">
                  <span className="text-[6px] font-bold">🛒</span>
                </div>
              </div>
              
              {/* Banner Mock */}
              <div className="p-3 text-center border-b border-current/5 bg-current/5">
                <h3 className="text-[8px] font-bold uppercase tracking-wider">Nouvelle Collection</h3>
                <p className="text-[6px] opacity-60 mt-0.5">Visitez & commandez</p>
              </div>

              {/* Product Card Mock */}
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div className="border border-slate-200 p-2 space-y-1.5 bg-current/5 rounded-sm">
                  <div className="aspect-[4/3] bg-current/10 flex items-center justify-center rounded-sm">
                    <span className="text-[6px] opacity-50 uppercase tracking-widest">Produit</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[6px] font-bold">Article démo</span>
                    <span className="text-[6px] font-mono font-bold" style={{ color: themeColor }}>15.000 F</span>
                  </div>
                </div>

                {/* Call to action Mock */}
                <div 
                  className="w-full text-center py-2 text-[6px] font-bold uppercase tracking-widest text-white transition-colors duration-300 shadow-sm rounded-sm"
                  style={{ backgroundColor: themeColor }}
                >
                  Commander via WhatsApp
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-6 text-[10px] uppercase tracking-widest text-art-muted border-t border-art-border/40 pt-4">N'oubliez pas d'enregistrer vos paramètres pour appliquer les modifications.</p>
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
            <input required value={storeName} onChange={e => handleNameChange(e.target.value)} type="text" className="w-full glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text text-sm" placeholder="Ex: Boutique Fatou" />
            <p className="mt-2 text-[10px] uppercase tracking-widest text-art-muted">Affiché en titre sur votre boutique.</p>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-art-muted mb-2">Identifiant (URL) {!slugManuallyEdited && storeName && <span className="text-art-accent">- généré automatiquement</span>}</label>
            <input required value={storeSlug} onChange={e => handleSlugChange(e.target.value)} type="text" className="w-full glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text font-mono text-sm" />
            <p className="mt-2 text-[10px] uppercase tracking-widest text-art-muted">Doit être unique. Lettres minuscules et tirets uniquement.</p>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-art-muted mb-2">Pays d'opération</label>
            <select
              value={country}
              onChange={e => {
                const code = e.target.value;
                setCountry(code);
                const prefix = COUNTRIES[code]?.phonePrefix || '';
                if (!whatsappNumber || whatsappNumber === COUNTRIES[country]?.phonePrefix) {
                  setWhatsappNumber(prefix);
                }
              }}
              className="w-full glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text text-sm bg-white"
            >
              {Object.values(COUNTRIES).map(c => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.currency})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-art-muted mb-2">Numéro WhatsApp (Commandes)</label>
            <input value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} type="tel" className="w-full glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text font-mono text-sm" placeholder="Ex: +225 01 02 03 04 05" />
            <p className="mt-2 text-[10px] uppercase tracking-widest text-art-muted">Si renseigné, les clients pourront envoyer leur commande directement sur WhatsApp.</p>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-art-muted mb-2">Frais de livraison à domicile ({currency})</label>
            <input value={deliveryCost} onChange={e => setDeliveryCost(Number(e.target.value) || 0)} type="number" min="0" className="w-full glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text font-mono text-sm" placeholder="Ex: 1000" />
            <p className="mt-2 text-[10px] uppercase tracking-widest text-art-muted">Ces frais seront appliqués si le client choisit "Livraison à domicile".</p>
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
