import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, ArrowRight, ArrowLeft, Sparkles, Palette, ShoppingBag, Check, Store, Phone, Camera } from 'lucide-react';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import { COUNTRIES } from '../../data/countries';

interface OnboardingWizardProps {
  userId: string;
  onComplete: () => Promise<void>;
}

export function OnboardingWizard({ userId, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Info boutique
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('CI');
  const currency = COUNTRIES[selectedCountry]?.currency || 'FCFA';

  // Step 2: Thème de couleur
  const [selectedTheme, setSelectedTheme] = useState('elegant');

  const themes = [
    {
      id: 'elegant',
      name: 'Luxe / Élégant',
      desc: 'Pour la haute couture, les bijoux et le premium.',
      accent: '#D4A574',
      bg: '#111111',
      text: '#F5F5F5'
    },
    {
      id: 'nature',
      name: 'Nature / Frais',
      desc: 'Pour les produits bio, cosmétiques et naturels.',
      accent: '#22C55E',
      bg: '#FDFCF8',
      text: '#1B4332'
    },
    {
      id: 'mode',
      name: 'Corail / Mode',
      desc: 'Pour le prêt-à-porter dynamique et tendance.',
      accent: '#FF6B6B',
      bg: '#FFF5F5',
      text: '#2D3748'
    },
    {
      id: 'tech',
      name: 'Océan / Tech',
      desc: 'Pour les gadgets, téléphones et accessoires.',
      accent: '#3B82F6',
      bg: '#F8FAFC',
      text: '#1E293B'
    }
  ];

  // Step 3: Premier produit
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Helper slugify
  const slugify = (text: string) => text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStoreName(val);
    setStoreSlug(slugify(val));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1080,
      useWebWorker: true,
    };
    const compressedFile = await imageCompression(file, options);
    const filePath = `${userId}/${Date.now()}_${compressedFile.name}`;
    
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filePath, compressedFile);
      
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(data.path);
      
    return publicUrl;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!storeName.trim()) {
        toast.error("Veuillez saisir le nom de votre boutique.");
        return;
      }
      if (!storeSlug.trim()) {
        toast.error("Veuillez configurer l'URL de votre boutique.");
        return;
      }
      if (!whatsapp.trim()) {
        toast.error("Veuillez entrer votre numéro WhatsApp.");
        return;
      }
      const waRegex = /^\+?\d{8,15}$/;
      if (!waRegex.test(whatsapp.replace(/\s+/g, ''))) {
        toast.error("Format de numéro WhatsApp invalide. Exemple: +2250700000000");
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const activeTheme = themes.find(t => t.id === selectedTheme) || themes[0];
      const cleanedWhatsApp = whatsapp.replace(/\s+/g, '');

      // 1. Update merchant settings
      const { error: userError } = await supabase
        .from('users')
        .update({
          store_name: storeName.trim(),
          store_url: storeSlug.trim(),
          whatsapp_number: cleanedWhatsApp,
          theme_color: activeTheme.accent,
          background_color: activeTheme.bg,
          text_color: activeTheme.text,
          country: selectedCountry,
          store_description: `Bienvenue sur la boutique de ${storeName} ! Retrouvez nos produits de qualité commandables directement par WhatsApp.`
        })
        .eq('id', userId);

      if (userError) throw userError;

      // 2. Create the first product if filled
      if (prodName.trim() && prodPrice.trim()) {
        let imageUrl = '';
        if (imageFile) {
          try {
            imageUrl = await uploadImage(imageFile);
          } catch (imgErr) {
            console.error("Image upload failed", imgErr);
          }
        } else {
          // Default Unsplash aesthetic image
          imageUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80';
        }

        const { error: prodError } = await supabase.from('products').insert({
          user_id: userId,
          name: prodName.trim(),
          price: Number(prodPrice),
          description: prodDesc.trim() || 'Produit ajouté lors de la configuration initiale de la boutique.',
          image: imageUrl,
          category: 'Nouveautés',
          in_stock: true,
          stock_count: 10
        });

        if (prodError) throw prodError;
      }

      toast.success("Félicitations ! Votre boutique est prête 🚀");
      await onComplete();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Une erreur est survenue lors de la création de la boutique.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FDFCF8] flex items-center justify-center p-4 overflow-y-auto">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-200/40 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-200/30 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-2xl bg-white border border-art-border shadow-2xl p-8 relative flex flex-col justify-between min-h-[500px]">
        {/* Satisfying Corner accents */}
        <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-art-text" />
        <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-art-text" />

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-sm font-serif italic text-art-text font-bold">OmniShop. Onboarding</span>
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={`h-2 transition-all duration-300 rounded-full ${i === step ? 'w-8 bg-art-text' : 'w-2 bg-art-border'}`}
              />
            ))}
          </div>
        </div>

        {/* Content Box */}
        <div className="flex-1 mb-8">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <h2 className="text-3xl font-serif italic text-art-text flex items-center gap-2">
                  <Store className="w-8 h-8 text-art-accent" /> Configurez votre vitrine
                </h2>
                <p className="text-xs uppercase tracking-widest text-art-muted">
                  Créons le lien de votre boutique en quelques secondes
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-art-muted mb-2">
                    Nom de votre boutique *
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={handleNameChange}
                    className="w-full border border-art-border p-3 focus:outline-none focus:border-art-text text-sm transition-colors"
                    placeholder="Ex: Fatou Cosmétiques, Chic Mode..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-art-muted mb-2">
                    Lien de votre boutique (URL unique) *
                  </label>
                  <div className="flex items-center border border-art-border bg-slate-50 p-3">
                    <span className="text-xs text-art-muted select-none font-mono">omnishop.io/</span>
                    <input
                      type="text"
                      value={storeSlug}
                      onChange={e => setStoreSlug(slugify(e.target.value))}
                      className="flex-1 bg-transparent focus:outline-none text-sm font-mono font-bold"
                      placeholder="fatou-cosmetiques"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-art-muted mb-2">
                    Pays d'opération *
                  </label>
                  <select
                    value={selectedCountry}
                    onChange={e => {
                      const code = e.target.value;
                      setSelectedCountry(code);
                      const prefix = COUNTRIES[code]?.phonePrefix || '';
                      if (!whatsapp || whatsapp === COUNTRIES[selectedCountry]?.phonePrefix) {
                        setWhatsapp(prefix);
                      }
                    }}
                    className="w-full border border-art-border p-3 focus:outline-none focus:border-art-text text-sm bg-white"
                    required
                  >
                    {Object.values(COUNTRIES).map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.currency})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-art-muted mb-2 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> Numéro WhatsApp (Pour recevoir les commandes) *
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    className="w-full border border-art-border p-3 focus:outline-none focus:border-art-text text-sm font-mono"
                    placeholder="Ex: +2250700000000 (Côte d'Ivoire)"
                    required
                  />
                  <p className="text-[10px] text-art-muted mt-1 italic">
                    Incluez le code pays (ex: +225 pour la Côte d'Ivoire, +221 pour le Sénégal).
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <h2 className="text-3xl font-serif italic text-art-text flex items-center gap-2">
                  <Palette className="w-8 h-8 text-art-accent" /> Choisissez votre univers
                </h2>
                <p className="text-xs uppercase tracking-widest text-art-muted">
                  Sélectionnez le thème visuel qui vous correspond le mieux
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {themes.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTheme(t.id)}
                    className={`p-4 border text-left flex flex-col justify-between transition-all relative ${selectedTheme === t.id ? 'border-art-text bg-slate-50 ring-2 ring-art-text' : 'border-art-border hover:border-art-text/50'}`}
                  >
                    {selectedTheme === t.id && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-art-text text-white rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                    <div>
                      <span className="font-bold text-sm block mb-1">{t.name}</span>
                      <span className="text-[10px] text-art-muted block leading-relaxed mb-4">{t.desc}</span>
                    </div>

                    <div className="flex gap-2 items-center mt-2 border-t border-art-border/40 pt-2 w-full">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.accent }} />
                      <div className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: t.bg }} />
                      <span className="text-[9px] uppercase tracking-wider font-mono text-art-muted ml-auto">Aperçu</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <h2 className="text-3xl font-serif italic text-art-text flex items-center gap-2">
                  <ShoppingBag className="w-8 h-8 text-art-accent" /> Ajoutez votre premier produit
                </h2>
                <p className="text-xs uppercase tracking-widest text-art-muted">
                  Ou passez cette étape pour démarrer avec des démos
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
                <div className="sm:col-span-1">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-art-muted mb-2">
                    Photo du produit
                  </label>
                  <div className="relative group border border-dashed border-art-border hover:border-art-text transition-colors aspect-square flex flex-col items-center justify-center cursor-pointer p-4 bg-slate-50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {imagePreview ? (
                      <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-art-muted mb-2" />
                        <span className="text-[9px] uppercase font-bold tracking-widest text-art-muted text-center leading-normal">
                          Uploader
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-art-muted mb-2">
                      Nom du produit
                    </label>
                    <input
                      type="text"
                      value={prodName}
                      onChange={e => setProdName(e.target.value)}
                      className="w-full border border-art-border p-3 focus:outline-none focus:border-art-text text-sm"
                      placeholder="Ex: Sneakers Premium, Robe d'été..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-art-muted mb-2">
                      Prix ({currency})
                    </label>
                    <input
                      type="number"
                      value={prodPrice}
                      onChange={e => setProdPrice(e.target.value)}
                      className="w-full border border-art-border p-3 focus:outline-none focus:border-art-text text-sm font-mono"
                      placeholder="Ex: 25000"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-art-muted mb-2">
                      Description <span className="font-normal italic lowercase text-xs">(optionnel)</span>
                    </label>
                    <textarea
                      value={prodDesc}
                      onChange={e => setProdDesc(e.target.value)}
                      className="w-full border border-art-border p-3 focus:outline-none focus:border-art-text text-sm h-16 resize-none"
                      placeholder="Décrivez brièvement le produit..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-art-border pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest text-art-muted hover:text-art-text transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest text-art-text border-2 border-art-text px-6 py-3 hover:bg-art-text hover:text-white transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.1)] active:translate-y-px"
            >
              Suivant <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest bg-art-text text-white px-8 py-4 transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.1)] hover:bg-black disabled:opacity-50"
            >
              {loading ? (
                <>Création... <Loader2 className="w-4 h-4 animate-spin" /></>
              ) : (
                <>Lancer ma boutique <Sparkles className="w-4 h-4 text-amber-300" /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
