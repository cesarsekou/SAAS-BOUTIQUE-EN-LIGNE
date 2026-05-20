import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { CreditCard, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BillingProps {
  user: User;
}

const PLANS = [
  { id: 'essential', name: 'Essentiel', price: 5000, description: 'Pour se lancer sur les réseaux.' },
  { id: 'pro', name: 'Pro', price: 10000, description: 'Pour les boutiques avec du volume.' }
];

// ─── Sous-composant: affiche un plan et gère son paiement ────────────────────
// useFlutterwave DOIT être appelé au niveau du composant (règle des hooks React)
function PlanCard({
  plan,
  isCurrentPlan,
  user,
  storeName,
  onSuccess,
}: {
  key?: any;
  plan: typeof PLANS[0];
  isCurrentPlan: boolean;
  user: User;
  storeName: string;
  onSuccess: (planId: string, newValidUntil: Date) => void;
}) {
  const [processing, setProcessing] = useState(false);

  const config = {
    public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-SANDBOXDEMOKEY-X',
    tx_ref: `txn_${Date.now()}_${user.id}`,
    amount: plan.price,
    currency: 'XOF',
    payment_options: 'card,mobilemoneyfranco',
    customer: {
      email: user.email || 'marchand@omnishop.com',
      phone_number: '',
      name: storeName || 'Marchand OmniShop',
    },
    customizations: {
      title: `Abonnement ${plan.name}`,
      description: 'Renouvellement 30 jours',
      logo: 'https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg',
    },
  };

  // ✅ Hook appelé au niveau du composant — conforme aux règles React
  const handleFlutterwavePayment = useFlutterwave(config);

  const handlePay = () => {
    setProcessing(true);
    handleFlutterwavePayment({
      callback: async (response) => {
        if (response.status === 'successful') {
          toast.success('Paiement validé !');
          try {
            const { data: currentUser } = await supabase
              .from('users')
              .select('subscription_valid_until')
              .eq('id', user.id)
              .single();

            const daysToAdd = 30;
            const now = new Date();
            let newValidUntil: Date;

            if (currentUser?.subscription_valid_until) {
              const existing = new Date(currentUser.subscription_valid_until);
              newValidUntil = existing > now
                ? new Date(existing.getTime() + daysToAdd * 86400000)
                : new Date(now.getTime() + daysToAdd * 86400000);
            } else {
              newValidUntil = new Date(now.getTime() + daysToAdd * 86400000);
            }

            const { error } = await supabase
              .from('users')
              .update({
                subscription_plan: plan.id,
                subscription_valid_until: newValidUntil.toISOString(),
              })
              .eq('id', user.id);

            if (error) throw error;

            onSuccess(plan.id, newValidUntil);
            toast.success('Abonnement prolongé de 30 jours !');
          } catch (err) {
            console.error(err);
            toast.error("Erreur lors de la mise à jour de l'abonnement.");
          }
        } else {
          toast.error("Le paiement n'a pas abouti.");
        }
        closePaymentModal();
        setProcessing(false);
      },
      onClose: () => setProcessing(false),
    });
  };

  return (
    <div className={`glass p-8 flex flex-col relative group overflow-hidden border transition-colors ${isCurrentPlan ? 'border-art-accent' : 'border-art-border hover:border-art-text/50'}`}>
      {isCurrentPlan && (
        <div className="absolute top-0 right-0 bg-art-accent text-white text-[10px] uppercase tracking-widest font-bold px-4 py-1">
          Forfait Actuel
        </div>
      )}
      <div className="mb-8">
        <h3 className="text-2xl font-bold tracking-tight mb-2">{plan.name}</h3>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-4xl font-serif italic text-art-text">{plan.price.toLocaleString()}</span>
          <span className="text-xs text-art-muted font-mono">FCFA / 30 jours</span>
        </div>
        <p className="text-xs text-art-muted uppercase tracking-widest leading-relaxed">{plan.description}</p>
      </div>
      <div className="mt-auto pt-6 border-t border-art-border">
        <button
          onClick={handlePay}
          disabled={processing}
          className="w-full flex items-center justify-center gap-2 bg-art-text text-white py-4 font-bold text-xs uppercase tracking-widest active:scale-[0.99] transition-transform shadow-[4px_4px_0px_rgba(0,0,0,0.1)] hover:translate-y-px hover:shadow-[2px_2px_0px_rgba(0,0,0,0.1)] disabled:opacity-50"
        >
          {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          {isCurrentPlan ? 'Renouveler ce forfait' : 'Passer à ce forfait'}
        </button>
        <p className="text-center text-[10px] text-art-muted mt-3 font-mono">
          Paiement sécurisé par Flutterwave (Mobile Money, Carte)
        </p>
      </div>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────
export function Billing({ user }: BillingProps) {
  const { storeData, refreshStoreData } = useAuth();

  const getStatus = () => {
    if (!storeData?.subscription_plan || storeData.subscription_plan === 'free') {
      return { type: 'danger', msg: 'Aucun abonnement actif.' };
    }
    if (!storeData.subscription_valid_until) {
      return { type: 'danger', msg: 'Abonnement expiré ou invalide.' };
    }
    const validUntil = new Date(storeData.subscription_valid_until);
    if (validUntil < new Date()) {
      return { type: 'danger', msg: `Expiré depuis le ${validUntil.toLocaleDateString('fr-FR')}` };
    }
    const daysLeft = Math.ceil((validUntil.getTime() - Date.now()) / 86400000);
    if (daysLeft <= 3) {
      return { type: 'warning', msg: `Expire bientôt (dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''})` };
    }
    return { type: 'success', msg: `Actif jusqu'au ${validUntil.toLocaleDateString('fr-FR')}` };
  };

  const status = getStatus();

  const handlePaymentSuccess = (planId: string, newValidUntil: Date) => {
    // Rafraîchit les données du marchand après un paiement réussi
    refreshStoreData();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <header className="flex justify-between items-end border-b border-art-border pb-6">
        <h1 className="text-4xl font-serif italic tracking-tight text-art-text">Abonnement</h1>
      </header>

      {/* Status Card */}
      <div className={`p-6 border flex flex-col md:flex-row items-center gap-6 justify-between ${
        status.type === 'success' ? 'glass border-green-200' :
        status.type === 'warning' ? 'glass border-yellow-200' :
        'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-4">
          {status.type === 'success'
            ? <CheckCircle2 className="w-8 h-8 text-green-500" />
            : <AlertCircle className={`w-8 h-8 ${status.type === 'warning' ? 'text-yellow-500' : 'text-red-500'}`} />
          }
          <div>
            <h2 className="text-xl font-bold tracking-tight mb-1">
              Forfait {
                storeData?.subscription_plan === 'pro' ? 'Pro' :
                storeData?.subscription_plan === 'essential' ? 'Essentiel' :
                'Gratuit (Démo)'
              }
            </h2>
            <p className={`text-sm font-mono ${status.type === 'danger' ? 'text-red-700' : 'text-art-muted'}`}>
              {status.msg}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {PLANS.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={storeData?.subscription_plan === plan.id}
            user={user}
            storeName={storeData?.store_name || ''}
            onSuccess={handlePaymentSuccess}
          />
        ))}
      </div>
    </div>
  );
}
