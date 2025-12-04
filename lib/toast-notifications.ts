import toast from 'react-hot-toast';

export const toastNotifications = {
  syncSuccess: (count: number) => {
    toast.success(`${count} plan(s) synchronisé(s)`);
  },

  syncError: (message: string) => {
    toast.error(`Erreur: ${message}`);
  },

  conflictResolved: (planName: string, winner: 'local' | 'remote') => {
    const version = winner === 'local' ? 'locale' : 'distante';
    toast(
      `Conflit résolu pour "${planName}"\nVersion ${version} conservée`,
      {
        icon: '⚠️',
        duration: 6000,
      }
    );
  },

  uploadSuccess: (planName: string) => {
    toast.success(`"${planName}" sauvegardé`);
  },

  downloadSuccess: (count: number) => {
    toast.success(`${count} plan(s) téléchargé(s)`);
  },

  networkError: () => {
    toast.error('Erreur réseau. Vérifiez votre connexion.');
  },

  /**
   * Plan créé et sauvegardé avec succès
   */
  planCreated: (month: string) => {
    toast.success(`Plan ${month} créé et sauvegardé`, {
      duration: 3000,
      icon: '✅',
    });
  },

  /**
   * Plan créé mais sauvegarde cloud a échoué
   */
  planCreatedLocalOnly: (month: string) => {
    toast(
      `⚠️ Plan ${month} créé en local uniquement\n\nLa sauvegarde cloud a échoué. Vos données sont conservées localement.`,
      {
        duration: 6000,
        icon: '⚠️',
      }
    );
  },
};
