import LoginForm from '@/components/auth/LoginForm';
import AuthLayout from '@/components/auth/AuthLayout';

export default function LoginPage() {
  const benefits = [
    'Sauvegarde automatique de tous vos plans mensuels dans le cloud',
    'Synchronisation en temps réel sur tous vos appareils',
    'Accédez à vos données depuis n\'importe où, à tout moment',
    'Protection contre la perte de données avec backup automatique',
    'Résolution intelligente des conflits entre appareils',
  ];

  return (
    <AuthLayout
      title="Connexion"
      subtitle="Accédez à vos finances en toute sécurité"
      benefits={benefits}
      footerText="Pas encore de compte ?"
      footerLink={{ text: "S'inscrire", href: '/auth/signup' }}
    >
      <LoginForm />
    </AuthLayout>
  );
}
