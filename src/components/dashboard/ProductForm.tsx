import React, { useState } from 'react';
import { Plus, Minus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { COUNTRIES } from '../../data/countries';

interface ProductFormProps {
  userCategories: string[];
  onAdd: (data: any, file?: File | null) => Promise<void>;
}

export const ProductForm: React.FC<ProductFormProps> = ({ userCategories, onAdd }) => {
  const { storeData } = useAuth();
  const currency = COUNTRIES[storeData?.country || 'CI']?.currency || 'FCFA';
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    setIsAdding(true);

    try {
      await onAdd({
        name,
        price: parseFloat(price),
        stock: parseInt(stock, 10) || 0,
        category,
        description,
        imageUrl,
      }, imageFile);

      // Reset form on success
      setName('');
      setPrice('');
      setStock('0');
      setCategory('');
      setDescription('');
      setImageUrl('');
      setImageFile(null);
      setShowAdvanced(false);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'ajout du produit');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="glass p-8">
      <h2 className="text-xl font-medium tracking-tight mb-6">Ajout rapide</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input required value={name} onChange={e => setName(e.target.value)} type="text" placeholder="Nom du produit *" className="w-full glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text text-sm" />
          </div>
          <div className="md:w-32">
            <input required value={price} onChange={e => setPrice(e.target.value)} type="number" step="0.01" min="0" placeholder={`Prix (${currency}) *`} className="w-full glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text text-sm font-mono" />
          </div>
          <div className="md:w-24">
            <input required value={stock} onChange={e => setStock(e.target.value)} type="number" min="0" placeholder="Stock" className="w-full glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text text-sm font-mono" />
          </div>
          <button disabled={isAdding} type="submit" className="bg-art-text text-white px-8 py-3 text-xs uppercase font-bold tracking-widest hover:glass-surface hover:text-art-text border-2 border-transparent hover:border-art-text transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap">
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isAdding ? 'Upload...' : 'Ajouter'}
          </button>
        </div>

        {!showAdvanced ? (
          <button type="button" onClick={() => setShowAdvanced(true)} className="text-[10px] uppercase font-bold tracking-widest text-art-muted hover:text-art-text transition-colors flex items-center gap-2">
            <Plus className="w-3 h-3" />
            Ajouter image et description (optionnel)
          </button>
        ) : (
          <div className="grid grid-cols-1 gap-6 pt-6 border-t border-art-border border-dashed">
            {userCategories.length > 0 && (
              <div>
                <label className="block text-xs uppercase tracking-widest text-art-muted mb-2">Catégorie</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text text-sm cursor-pointer">
                  <option value="">Sélectionner une catégorie...</option>
                  {userCategories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs uppercase tracking-widest text-art-muted mb-2">Image du produit</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer glass-surface border border-dashed border-art-border p-3 hover:border-art-text transition-colors">
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImageUrl(''); } }} />
                  <span className="text-xs text-art-muted">{imageFile ? `✓ ${imageFile.name}` : '↑ Choisir un fichier...'}</span>
                </label>
                <p className="text-[10px] text-art-muted">— ou coller une URL —</p>
                <input value={imageUrl} onChange={e => { setImageUrl(e.target.value); setImageFile(null); }} type="url" className="w-full glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text text-sm font-mono" placeholder="https://..." disabled={!!imageFile} />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-art-muted mb-2">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text text-sm" placeholder="Description du produit..." />
            </div>
            <div>
              <button type="button" onClick={() => setShowAdvanced(false)} className="text-[10px] uppercase font-bold tracking-widest text-art-muted hover:text-art-text transition-colors flex items-center gap-2">
                <Minus className="w-3 h-3" />
                Masquer les options
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
