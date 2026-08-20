# Déployer le site Noor Safar

Tu as déjà tes 3 comptes (GitHub, Cloudflare, Supabase). Voici la suite, dans l'ordre. Rien de tout ça ne demande de ligne de commande — tout se fait par clics.

## 1. Créer la base de données (Supabase)

1. Sur [supabase.com](https://supabase.com), clique **"Start your project"** → **New project**.
2. Donne-lui un nom (ex. `noor-safar`), choisis un mot de passe pour la base (garde-le de côté), et une région proche (`Europe (Paris)` ou `Europe (Frankfurt)`).
3. Une fois le projet créé (30-60 secondes), va dans **SQL Editor** (menu de gauche) → **New query**.
4. Ouvre le fichier `supabase-schema.sql` fourni avec ce projet, colle tout son contenu dans l'éditeur, puis clique **Run**. Ça crée la table qui va stocker les demandes des pèlerins.
5. Va dans **Project Settings** (icône engrenage) → **API**. Tu y trouveras deux valeurs à garder sous la main :
   - **Project URL**
   - **anon public key** (une longue clé)

## 2. Mettre le code sur GitHub

1. Sur [github.com](https://github.com), clique **New repository**. Nom suggéré : `noor-safar-site`. Laisse-le en **Private** si tu préfères (pas obligatoire).
2. Ne coche aucune case d'initialisation (pas de README, pas de .gitignore — on a déjà tout).
3. Une fois le repo créé, GitHub te propose plusieurs façons d'y ajouter du code. La plus simple sans ligne de commande : clique **"uploading an existing file"**, puis glisse-dépose **tous les fichiers et dossiers** de ce projet (garde bien la structure : le dossier `src`, le dossier `public`, et les fichiers à la racine comme `package.json`).
4. **Ne mets surtout pas le fichier `.env`** s'il en existe un chez toi — il n'est pas fourni ici justement pour cette raison (les clés Supabase ne doivent jamais être sur GitHub en clair). On les mettra directement dans Cloudflare à l'étape suivante.
5. Valide l'envoi ("Commit changes").

## 3. Déployer sur Cloudflare Pages

1. Sur le tableau de bord Cloudflare, va dans **Workers & Pages** → **Create** → onglet **Pages** → **Connect to Git**.
2. Autorise Cloudflare à accéder à GitHub, puis sélectionne le repo `noor-safar-site`.
3. Dans les réglages de build :
   - **Framework preset** : Vite
   - **Build command** : `npm run build`
   - **Build output directory** : `dist`
4. Avant de valider, clique sur **Environment variables** et ajoute les deux valeurs récupérées à l'étape 1 :
   - `VITE_SUPABASE_URL` → ton Project URL
   - `VITE_SUPABASE_ANON_KEY` → ta anon public key
5. Clique **Save and Deploy**. Ça prend 1 à 2 minutes. Une fois terminé, Cloudflare te donne une adresse du type `noor-safar-site.pages.dev` — le site est en ligne, teste-le.

## 4. Connecter ton nom de domaine (noorsafaromra.com)

1. Dans le projet Cloudflare Pages, va dans **Custom domains** → **Set up a custom domain** → tape `noorsafaromra.com`.
2. Cloudflare te donne des instructions précises selon que le domaine est déjà chez Cloudflare ou encore chez OVH :
   - Si on te propose de **transférer la gestion DNS chez Cloudflare** (recommandé, gratuit, plus simple ensuite) : accepte, puis va chez OVH mettre à jour les **serveurs DNS (nameservers)** avec ceux que Cloudflare t'indique.
   - Sinon, Cloudflare te donnera un enregistrement **CNAME** à ajouter directement dans la zone DNS de ton domaine chez OVH.
3. La propagation peut prendre de quelques minutes à quelques heures. Une fois fait, `noorsafaromra.com` affichera directement ton site.

## 5. ⚠️ Sécurité à faire avant toute vraie mise en avant publique

Le fichier `supabase-schema.sql` configure la base pour que **n'importe qui** puisse lire et modifier les demandes (même principe que l'aperçu Claude jusqu'ici — pratique pour tester, pas sécurisé pour de vrai). Avant de pousser du trafic dessus (Insta, TikTok, Facebook), reviens vers Claude avec ce projet et demande : *"Sécurise l'accès à l'espace conciergerie avec une authentification"* — ça mettra en place une vraie connexion (email + mot de passe) pour que toi seul puisses voir les demandes des pèlerins.

## En résumé

| Étape | Où | Temps estimé |
|---|---|---|
| Créer la base + exécuter le SQL | Supabase | 5 min |
| Mettre le code en ligne | GitHub | 5 min |
| Déployer | Cloudflare Pages | 5 min |
| Brancher le domaine | Cloudflare + OVH | 5 min (+ propagation) |

Si un écran bloque ou qu'un message d'erreur apparaît à une étape, envoie une capture d'écran — c'est plus rapide à débugger avec l'image sous les yeux.
