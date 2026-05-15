import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { CreditCard, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BillingProps {
  user: User;
}

export function Billing({ user }: BillingProps) {
  const { storeData } = useAuth();
  const [processing, setProcessing] = useState(false);

  const plans = [
    { id: 'essential', name: 'Essentiel', price: 5000, description: 'Pour se lancer sur les réseaux.' },
    { id: 'pro', name: 'Pro', price: 10000, description: 'Pour les boutiques avec du volume.' }
  ];

  // Config Flutterwave pour un test. Remplacez "public_key" par votre vraie clé live.
  const handlePayment = (plan: any) => {
    setProcessing(true);
    
    const config = {
      public_key: 'FLWPUBK_TEST-SANDBOXDEMOKEY-X', // A REMPLACER PAR VOTRE VRAIE CLÉ FLUTTERWAVE
      tx_ref: `txn_${Date.now()}_${user.uid}`,
      amount: plan.price,
      currency: 'XOF', // Ou 'XAF'
      payment_options: 'card,mobilemoney,ussd',
      customer: {
        email: user.email || 'marchand@omnishop.com',
        phone_number: '',
        name: storeData?.storeName || 'Marchand OmniShop',
      },
      customizations: {
        title: `Abonnement ${plan.name}`,
        description: 'Renouvellement 30 jours',
        logo: 'https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg',
      },
    };

    const handleFlutterwavePayment = useFlutterwave(config);

    handleFlutterwavePayment({
      callback: async (response) => {
        if (response.status === "successful") {
          toast.success("Paiement validé !");
          try {
            const daysToAdd = 30;
            const now = new Date();
            let newValidUntil = new Date();
            
            // Si l'abonnement est encore valide, on ajoute 30 jours
            if (storeData?.subscriptionValidUntil && storeData.subscriptionValidUntil.toDate() > now) {
              newValidUntil = new Date(storeData.subscriptionValidUntil.toDate().getTime() + daysToAdd * 24 * 60 * 60 * 1000);
            } else {
              newValidUntil = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
            }

            await updateDoc(doc(db, 'users', user.uid), {
              subscriptionPlan: plan.id,
              subscriptionValidUntil: Timestamp.fromDate(newValidUntil)
            });
            toast.success("Votre abonnement a été prolongé de 30 jours.");
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
      onClose: () => {
        setProcessing(false);
      },
    });
  };

  const getStatus = () => {
    if (!storeData?.subscriptionPlan || storeData.subscriptionPlan === 'free') {
      return { type: 'danger', msg: 'Aucun abonnement actif.' };
    }
    const validUntil = storeData.subscriptionValidUntil?.toDate();
    if (!validUntil) return { type: 'danger', msg: 'Abonnement expiré ou invalide.' };
    
    if (validUntil < new Date()) {
      return { type: 'danger', msg: `Expiré depuis le ${validUntil.toLocaleDateString()}` };
    }
    
    const daysLeft = Math.ceil((validUntil.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    if (daysLeft <= 3) {
      return { type: 'warning', msg: `Expire bientôt (dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''})` };
    }
    return { type: 'success', msg: `Actif (jusqu'au ${validUntil.toLocaleDateString()})` };
  };

  const status = getStatus();

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
          {status.type === 'success' ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <AlertCircle className={`w-8 h-8 ${status.type === 'warning' ? 'text-yellow-500' : 'text-red-500'}`} />}
          <div>
            <h2 className="text-xl font-bold tracking-tight mb-1">
              Forfait {storeData?.subscriptionPlan === 'pro' ? 'Pro' : storeData?.subscriptionPlan === 'essential' ? 'Essentiel' : 'Gratuit (Démo)'}
            </h2>
            <p className={`text-sm font-mono ${status.type === 'danger' ? 'text-red-700' : 'text-art-muted'}`}>
              {status.msg}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map(plan => {
          const isCurrentPlan = storeData?.subscriptionPlan === plan.id;
          
          return (
            <div key={plan.id} className={`glass p-8 flex flex-col relative group overflow-hidden border transition-colors ${isCurrentPlan ? 'border-art-accent' : 'border-art-border hover:border-art-text/50'}`}>
              {isCurrentPlan && <div className="absolute top-0 right-0 bg-art-accent text-white text-[10px] uppercase tracking-widest font-bold px-4 py-1">Forfait Actuel</div>}
              <div className="mb-8">
                <h3 className="text-2xl font-bold tracking-tight mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-serif italic text-art-text">{plan.price}</span>
                  <span className="text-xs text-art-muted font-mono">FCFA / 30 jours</span>
                </div>
                <p className="text-xs text-art-muted uppercase tracking-widest leading-relaxed">{plan.description}</p>
              </div>
              <div className="mt-auto pt-6 border-t border-art-border">
                <button 
                  onClick={() => handlePayment(plan)}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 bg-art-text text-white py-4 font-bold text-xs uppercase tracking-widest active:scale-[0.99] transition-transform shadow-[4px_4px_0px_rgba(0,0,0,0.1)] hover:translate-y-px hover:shadow-[2px_2px_0px_rgba(0,0,0,0.1)] disabled:opacity-50"
                >
                  {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  {isCurrentPlan ? 'Renouveler ce forfait' : 'Passer à ce forfait'}
                </button>
                <p className="text-center text-[10px] text-art-muted mt-3 font-mono">Paiement sécurisé par Flutterwave (Mobile Money, Carte)</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
