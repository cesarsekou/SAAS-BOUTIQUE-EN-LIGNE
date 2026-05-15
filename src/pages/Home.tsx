import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, BarChart3, Globe, Smartphone } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen text-art-text flex flex-col items-center overflow-x-hidden relative bg-transparent">
      {/* Decorative Background Element removed since we use liquid-bg */}

      {/* Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between px-6 md:px-12 py-4 md:py-8 w-full max-w-7xl relative z-10 gap-4 sm:gap-0">
        <div className="flex items-center gap-3 text-art-text mt-2 sm:mt-0">
          <span className="text-2xl font-bold tracking-tighter italic font-serif">OmniShop.</span>
        </div>
        <nav className="flex items-center gap-4 md:gap-8">
          <Link to="/login" className="text-[10px] md:text-xs uppercase font-bold tracking-widest border-b-2 border-art-text pb-1 hover:text-art-accent hover:border-art-accent transition-colors">Connexion</Link>
          <Link to="/login" className="px-4 md:px-6 py-2 bg-art-text text-white font-bold text-[10px] md:text-xs uppercase tracking-tighter border border-art-text hover:bg-art-bg hover:text-art-text transition text-center glass-dark">Créer ma boutique</Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 w-full max-w-7xl flex flex-col relative z-10">
        <section className="px-6 md:px-12 py-16 md:py-24 mx-auto w-full text-center max-w-4xl">
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-serif italic tracking-tight text-art-text mb-6 md:mb-8 leading-none drop-shadow-sm">
            Votre boutique web en <br className="hidden sm:block" /><span className="text-art-accent relative"><div className="absolute inset-0 bg-art-accent opacity-20 blur-xl"></div>un clin d'œil</span>
          </h1>
          <p className="max-w-xl mx-auto text-xs md:text-sm text-art-muted mb-8 md:mb-12 uppercase tracking-widest leading-relaxed drop-shadow-sm">
            Vendez facilement sur Instagram, TikTok ou WhatsApp. Créez votre catalogue, partagez votre lien et recevez vos commandes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
            <Link to="/login" className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 text-xs font-bold text-white bg-art-text border-2 border-art-text hover:glass-surface hover:text-art-text transition-all uppercase tracking-widest group shadow-xl">
              Commencer
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 md:px-12 py-12 md:py-24 w-full relative z-10">
          <div className="mb-10 md:mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-serif italic tracking-tight mb-4 drop-shadow-sm">L'essentiel pour vendre</h2>
          </div>
            
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="glass p-6 md:p-8 flex flex-col items-center text-center relative group overflow-hidden">
              <div className="absolute inset-0 bg-art-accent opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="h-20 md:h-24 w-full glass-surface flex items-center justify-center text-art-muted mb-6 md:mb-8 relative transition-colors group-hover:text-art-accent">
                <Smartphone className="w-8 h-8" />
              </div>
              <h3 className="text-base md:text-lg font-bold tracking-tight mb-2 md:mb-3">Pensé Mobile</h3>
              <p className="text-[10px] md:text-xs text-art-muted uppercase tracking-widest leading-relaxed">Expérience fluide pour vos clients sur smartphone.</p>
            </div>
            
            <div className="glass p-6 md:p-8 flex flex-col items-center text-center relative group overflow-hidden">
              <div className="absolute inset-0 bg-art-accent opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="h-20 md:h-24 w-full glass-surface flex items-center justify-center text-art-muted mb-6 md:mb-8 relative transition-colors group-hover:text-art-accent">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="text-base md:text-lg font-bold tracking-tight mb-2 md:mb-3">Lien Unique</h3>
              <p className="text-[10px] md:text-xs text-art-muted uppercase tracking-widest leading-relaxed">Un seul lien dans votre bio regroupe tous vos produits.</p>
            </div>
            
            <div className="glass p-6 md:p-8 flex flex-col items-center text-center relative group overflow-hidden">
              <div className="absolute inset-0 bg-art-accent opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="h-20 md:h-24 w-full glass-surface flex items-center justify-center text-art-muted mb-6 md:mb-8 relative transition-colors group-hover:text-art-accent">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="text-base md:text-lg font-bold tracking-tight mb-2 md:mb-3">Suivi Simplifié</h3>
              <p className="text-[10px] md:text-xs text-art-muted uppercase tracking-widest leading-relaxed">Gérez toutes vos commandes en temps réel.</p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="px-6 md:px-12 py-12 md:py-24 w-full relative z-10 border-t border-art-border">
          <div className="mb-10 md:mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-serif italic tracking-tight mb-4 drop-shadow-sm">Tarification Simple</h2>
            <p className="text-xs text-art-muted uppercase tracking-widest">Choisissez l'offre qui correspond à vos besoins</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plan 5000 */}
            <div className="glass p-8 flex flex-col relative group overflow-hidden border border-art-border hover:border-art-accent transition-colors">
              <div className="mb-8">
                <h3 className="text-xl font-bold tracking-tight mb-2">Essentiel</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-serif italic text-art-accent">5 000</span>
                  <span className="text-xs text-art-muted font-mono">FCFA / mois</span>
                </div>
                <p className="text-xs text-art-muted uppercase tracking-widest leading-relaxed">Idéal pour se lancer sur les réseaux sociaux.</p>
              </div>
              <ul className="space-y-4 mb-8 text-sm font-mono flex-1">
                <li className="flex items-center gap-3"><span className="text-art-accent">✓</span> Jusqu'à 50 produits</li>
                <li className="flex items-center gap-3"><span className="text-art-accent">✓</span> Commandes WhatsApp</li>
                <li className="flex items-center gap-3"><span className="text-art-accent">✓</span> Design de base</li>
              </ul>
              <Link to="/login" className="w-full text-center py-4 bg-art-surface border border-art-border hover:bg-art-text hover:text-white transition-colors text-xs uppercase font-bold tracking-widest">Choisir Essentiel</Link>
            </div>

            {/* Plan 10000 */}
            <div className="glass p-8 flex flex-col relative group overflow-hidden border-2 border-art-text">
              <div className="absolute top-0 right-0 bg-art-text text-white text-[10px] uppercase tracking-widest font-bold px-4 py-1">Populaire</div>
              <div className="mb-8">
                <h3 className="text-xl font-bold tracking-tight mb-2">Pro</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-serif italic text-art-text">10 000</span>
                  <span className="text-xs text-art-muted font-mono">FCFA / mois</span>
                </div>
                <p className="text-xs text-art-muted uppercase tracking-widest leading-relaxed">Pour les boutiques établies avec du volume.</p>
              </div>
              <ul className="space-y-4 mb-8 text-sm font-mono flex-1">
                <li className="flex items-center gap-3"><span className="text-art-text">✓</span> Produits illimités</li>
                <li className="flex items-center gap-3"><span className="text-art-text">✓</span> Commandes WhatsApp & Suivi</li>
                <li className="flex items-center gap-3"><span className="text-art-text">✓</span> Couleurs personnalisées</li>
                <li className="flex items-center gap-3"><span className="text-art-text">✓</span> Tableau de bord complet</li>
              </ul>
              <Link to="/login" className="w-full text-center py-4 bg-art-text text-white hover:glass-surface hover:text-art-text border-2 border-art-text transition-colors text-xs uppercase font-bold tracking-widest">Choisir Pro</Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/20 py-6 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center text-[10px] text-art-muted uppercase tracking-widest max-w-7xl relative z-10 gap-4 md:gap-0">
        <p>&copy; 2026 OmniShop.</p>
        <div className="flex space-x-6">
          <span>Assistance 24/7</span>
          <span>Terms</span>
        </div>
      </footer>
    </div>
  );
}
