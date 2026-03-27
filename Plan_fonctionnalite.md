# Plan de fonctionnalites - Moneto

Fonctionnalites proposees pour les prochaines versions de Moneto. Chaque fonctionnalite est decrite en detail avec son objectif, son fonctionnement prevu et son impact technique.

---

## F-1. Suivi des transactions par enveloppe

### Objectif
Permettre a l'utilisateur d'enregistrer ses depenses reelles dans chaque enveloppe, au lieu de simplement definir un budget. Passer d'un outil de **planification** a un outil de **suivi actif**.

### Fonctionnement prevu

Actuellement, chaque enveloppe a un montant alloue mais aucun moyen de suivre les depenses reelles. Cette fonctionnalite ajoute :

1. **Liste de transactions par enveloppe** : chaque enveloppe contient une liste de depenses avec nom, montant, date, et note optionnelle
2. **Solde restant en temps reel** : montant alloue - somme des transactions = reste disponible
3. **Ajout rapide** : formulaire inline dans la page repartition, un tap pour ajouter une depense
4. **Historique** : liste scrollable des transactions passees avec possibilite de supprimer

### Exemple concret
> Enveloppe "Courses" : 400EUR alloues
> - 15 mars : Carrefour - 85.20EUR
> - 18 mars : Boulangerie - 12.50EUR
> - Reste : 302.30EUR

### Impact technique
- Ajout d'un champ `transactions: Transaction[]` dans le type `Envelope`
- Extension du store Zustand : `addTransaction()`, `removeTransaction()`
- Nouveau composant `TransactionList.tsx`
- Sync cloud : les transactions font partie du plan (stockees dans le JSON chiffre)
- Pas de nouvelle table DB necessaire (les transactions sont dans `data` du plan)

---

## F-2. Page Parametres

### Objectif
Centraliser les preferences utilisateur dans une page dediee au lieu de les disperser dans differentes pages. Offrir un controle fin sur le comportement de l'application.

### Fonctionnement prevu

Une page `/settings` accessible depuis la navigation, regroupant :

1. **Preferences financieres**
   - Devise par defaut (EUR, USD, etc.)
   - Format des nombres (separateur decimal, milliers)
   - Jour de debut de mois (1er par defaut, configurable pour ceux qui sont payes le 25 par ex.)

2. **Preferences d'affichage**
   - Theme sombre/clair (deja existant, a deplacer ici)
   - Graphique par defaut sur la page visualisation (Sankey ou Waterfall)
   - Tri des plans sur le dashboard (date, nom, montant)

3. **Donnees et stockage**
   - Export de toutes les donnees (JSON)
   - Import de donnees
   - Suppression de toutes les donnees locales (avec confirmation)
   - Statut de synchronisation cloud

4. **Notifications**
   - Activer/desactiver les notifications toast
   - Activer/desactiver les rappels de budget

### Impact technique
- Nouveau fichier `app/(main)/settings/page.tsx`
- Extension du store Zustand avec un objet `settings`
- Les settings sont persistes en IndexedDB avec le reste du store
- Pas de sync cloud pour les settings (preferences locales uniquement)

---

## F-4. Comparaison budget prevu vs reel

### Objectif
Visualiser l'ecart entre le budget planifie et les depenses reelles pour chaque enveloppe. Permet a l'utilisateur de voir ou il depense plus ou moins que prevu.

### Prerequis
Necessite F-1 (suivi des transactions) pour avoir des donnees reelles a comparer.

### Fonctionnement prevu

Un nouveau graphique/tableau dans la page visualisation :

1. **Vue tableau** : pour chaque enveloppe, affiche trois colonnes :
   - Budget prevu (montant alloue)
   - Depense reelle (somme des transactions)
   - Ecart (prevu - reel), colore en vert si sous-budget, rouge si sur-budget

2. **Vue graphique** : barres groupees (prevu vs reel) par enveloppe, avec couleurs distinctes

3. **Indicateurs globaux** :
   - % du budget total utilise
   - Nombre d'enveloppes depassees
   - Economie totale ou depassement total

### Exemple concret
> | Enveloppe   | Prevu   | Reel    | Ecart     |
> |-------------|---------|---------|-----------|
> | Courses     | 400EUR  | 350EUR  | +50EUR    |
> | Sorties     | 150EUR  | 210EUR  | -60EUR    |
> | Transport   | 80EUR   | 75EUR   | +5EUR     |
> | **Total**   | 630EUR  | 635EUR  | **-5EUR** |

### Impact technique
- Nouveau composant `BudgetComparison.tsx` avec Recharts (BarChart groupees)
- Integration dans la page visualisation comme onglet supplementaire
- Calculs dans `lib/financial.ts` : fonctions de comparaison prevu/reel
- Depend uniquement des donnees existantes dans le plan (enveloppes + transactions)

---

## F-5. Comparaison mensuelle (evolution dans le temps)

### Objectif
Permettre a l'utilisateur de comparer ses budgets et depenses d'un mois a l'autre. Voir l'evolution de ses habitudes financieres sur plusieurs mois.

### Fonctionnement prevu

Un nouveau graphique dans la page visualisation :

1. **Graphique d'evolution** : courbes ou barres empilees montrant mois par mois :
   - Total des revenus
   - Total des depenses fixes
   - Total alloue aux enveloppes
   - Solde restant (epargne)

2. **Comparaison entre 2 mois** : selection de deux plans mensuels, tableau comparatif :
   - Differences par categorie de revenu/depense
   - Nouvelles enveloppes ajoutees/supprimees
   - Evolution des montants par enveloppe

3. **Tendances** : indicateurs visuels (fleches haut/bas) montrant si une depense augmente ou diminue par rapport au mois precedent

### Exemple concret
> Evolution sur 3 mois :
> | Mois    | Revenus | Depenses fixes | Enveloppes | Epargne |
> |---------|---------|----------------|------------|---------|
> | Janvier | 2500EUR | 1200EUR        | 1100EUR    | 200EUR  |
> | Fevrier | 2500EUR | 1200EUR        | 1050EUR    | 250EUR  |
> | Mars    | 2650EUR | 1200EUR        | 1150EUR    | 300EUR  |

### Impact technique
- Nouveau composant `MonthlyComparison.tsx` avec Recharts (LineChart ou BarChart empilee)
- Integration dans la page visualisation
- Les donnees sont deja disponibles : tous les plans mensuels sont dans le store Zustand
- Fonctions utilitaires dans `lib/financial.ts` pour aggreger les donnees multi-plans
- Pas de modification du schema DB

---

## Ordre d'implementation recommande

1. **F-2** (Page Parametres) - independant, ameliore l'UX immediatement
2. **F-1** (Suivi transactions) - prerequis pour F-4
3. **F-4** (Budget vs reel) - depend de F-1
4. **F-5** (Comparaison mensuelle) - independant, mais plus utile avec des donnees reelles de F-1

---

**Date** : 27 mars 2026
