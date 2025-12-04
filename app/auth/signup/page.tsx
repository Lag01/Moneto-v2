import SignupForm from '@/components/auth/SignupForm';
import AuthLayout from '@/components/auth/AuthLayout';

export default function SignupPage() {
  const benefits = [
    'Sauvegarde automatique de tous vos plans mensuels dans le cloud',
    'Synchronisation en temps réel sur tous vos appareils',
    'Accédez à vos données depuis n\'importe où, à tout moment',
    'Protection contre la perte de données avec backup automatique',
    'Résolution intelligente des conflits entre appareils',
  ];

  return (
    <AuthLayout
      title="Créer un compte"
      subtitle="Commencez à gérer vos finances de manière professionnelle"
      benefits={benefits}
      footerText="Déjà un compte ?"
      footerLink={{ text: 'Se connecter', href: '/auth/login' }}
    >
      <SignupForm />
    </AuthLayout>
  );
}
