import React, { useState } from 'react';
import { X, Edit2, Loader2 } from 'lucide-react';
import { Product } from '../../types/index';
import { useAuth } from '../../contexts/AuthContext';
import { COUNTRIES } from '../../data/countries';

interface EditProductModalProps {
  product: Product;
  userCategories: string[];
  onClose: () => void;
  onSave: (id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>, file?: File | null) => Promise<void>;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({ product, userCategories, onClose, onSave }) => {
  const { storeData } = useAuth();
  const currency = COUNTRIES[storeData?.country || 'CI']?.currency || 'FCFA';
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price.toString());
  const [stock, setStock] = useState((product.stock || 0).toString());
  const [category, setCategory] = useState(product.category || '');
  const [description, setDescription] = useState(product.description || '');
  const [imageUrl, setImageUrl] = useState(product.imageUrl || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    setSaving(true);
    await onSave(
      product.id,
      { name, price: parseFloat(price), stock: parseInt(stock, 10) || 0, category, description, imageUrl },
      imageFile
    );
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-art-text/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-art-muted hover:text-art-text">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-serif italic text-art-text mb-6">Modifier le produit</h2>

        {(imageUrl || product.imageUrl) && !imageFile && (
          <img src={imageUrl || product.imageUrl} alt="" className="w-full h-40 object-cover mb-6 border border-art-border" />
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-art-muted mb-2">Nom *</label>
            <input
              required
              value={name}
              onChange={e => setName(e.target.value)}
              type="text"
              className="w-full glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text text-sm"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs uppercase tracking-widest text-art-muted mb-2">Prix ({currency}) *</label>
              <input
                required
                value={price}
                onChange={e => setPrice(e.target.value)}
                type="number"
                step="0.01"
                min="0"
                className="w-full glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text text-sm font-mono"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs uppercase tracking-widest text-art-muted mb-2">Stock *</label>
              <input
                required
                value={stock}
                onChange={e => setStock(e.target.value)}
                type="number"
                min="0"
                className="w-full glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text text-sm font-mono"
              />
            </div>
          </div>

          {userCategories.length > 0 && (
            <div>
              <label className="block text-xs uppercase tracking-widest text-art-muted mb-2">Catégorie</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text text-sm"
              >
                <option value="">Aucune catégorie</option>
                {userCategories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-widest text-art-muted mb-2">Image</label>
            <label className="flex items-center gap-3 cursor-pointer glass-surface border border-dashed border-art-border p-3 hover:border-art-text transition-colors mb-2">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImageUrl(''); } }}
              />
              <span className="text-xs text-art-muted">{imageFile ? `✓ ${imageFile.name}` : "↑ Changer l'image..."}</span>
            </label>
            <input
              value={imageUrl}
              onChange={e => { setImageUrl(e.target.value); setImageFile(null); }}
              type="url"
              className="w-full glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text text-sm font-mono"
              placeholder="https://..."
              disabled={!!imageFile}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-art-muted mb-2">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full glass-surface border border-art-border p-3 focus:outline-none focus:border-art-text text-sm"
              placeholder="Description du produit..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-art-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs uppercase font-bold tracking-widest text-art-muted border border-art-border hover:text-art-text transition-colors"
            >
              Annuler
            </button>
            <button
              disabled={saving}
              type="submit"
              className="flex-1 py-3 text-xs uppercase font-bold tracking-widest bg-art-text text-white border-2 border-art-text disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
