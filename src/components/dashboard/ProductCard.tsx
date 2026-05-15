import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Product } from '../../types/index';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete }) => {
  return (
    <div className="glass p-4 flex flex-col space-y-4 group">
      <div className="h-48 glass-surface flex items-center justify-center italic text-art-muted font-serif overflow-hidden relative">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <span>Pas d'image</span>
        )}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(product); }} 
            className="p-1.5 bg-white text-art-text border border-art-border hover:glass-surface rounded-full"
            aria-label="Modifier le produit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(product.id); }} 
            className="p-1.5 bg-white text-red-500 border border-art-border hover:glass-surface rounded-full"
            aria-label="Supprimer le produit"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-art-text leading-tight">{product.name}</h4>
          <div className="flex items-center gap-2 mt-2">
            {product.category && <span className="inline-block glass-surface border border-art-border px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest text-art-muted">{product.category}</span>}
            <span className={`inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest ${product.stock > 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>Stock: {product.stock || 0}</span>
          </div>
          {product.description && <p className="text-xs text-art-muted mt-2 line-clamp-1">{product.description}</p>}
        </div>
        <p className="font-serif text-lg tracking-tight whitespace-nowrap ml-4">€{product.price.toFixed(2)}</p>
      </div>
    </div>
  );
};
