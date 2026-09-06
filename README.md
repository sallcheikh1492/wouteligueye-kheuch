# JobHunter AI

Assistant personnel de recherche d'emploi assisté par IA : analyse de CV, découverte automatique
d'offres, scoring de compatibilité, génération de documents de candidature et suivi centralisé.

> **Statut** : projet en cours de construction par étapes. Voir [Feuille de route](#feuille-de-route)
> pour l'état d'avancement.

## Stack technique

- **Frontend** : React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, React Router, TanStack Query,
  React Hook Form, Zod
- **Backend** : Supabase (PostgreSQL, Auth, Storage, Row Level Security, Edge Functions, Realtime)
- **IA** : Anthropic Claude, via une abstraction `AIProvider` exécutée exclusivement côté serveur
  (Supabase Edge Functions) — la clé API n'est jamais exposée au frontend.

## Démarrage

```bash
npm install
cp .env.example .env.local
```

Renseignez dans `.env.local` l'URL et la clé publique (anon) de votre projet Supabase. Ces valeurs
sont publiques par conception (protégées par Row Level Security) — ne jamais y mettre la clé
`service_role`.

```bash
npm run dev
```

## Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Récupérez l'URL du projet et la clé `anon` (Project Settings → API) et placez-les dans
   `.env.local`.
3. Liez le CLI local au projet et appliquez les migrations :

   ```bash
   npx supabase login
   npx supabase link --project-ref <votre-project-ref>
   npx supabase db push
   ```

4. Générez les types TypeScript à partir du schéma distant :

   ```bash
   npx supabase gen types typescript --linked > src/types/database.ts
   ```

5. Configurez les secrets utilisés par les Edge Functions (jamais dans le frontend) :

   ```bash
   npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```

6. Déployez les Edge Functions :

   ```bash
   npx supabase functions deploy analyze-cv
   npx supabase functions deploy analyze-job
   npx supabase functions deploy calculate-job-match
   npx supabase functions deploy generate-cover-letter
   npx supabase functions deploy optimize-cv
   npx supabase functions deploy discover-jobs
   npx supabase functions deploy process-job
   npx supabase functions deploy send-notification
   npx supabase functions deploy scheduled-job-search
   ```

## Fournisseurs IA

L'application communique avec les modèles d'IA uniquement depuis les Edge Functions Supabase, via
l'interface `AIProvider` (voir `supabase/functions/_shared`). Le fournisseur par défaut est
**Anthropic Claude** ; l'abstraction permet d'ajouter d'autres fournisseurs sans changer le code
appelant.

## Feuille de route

- [x] Étape 1 — Architecture et scaffolding (frontend, structure de dossiers, shadcn/ui)
- [ ] Étape 2 — Schéma de base de données et politiques RLS
- [ ] Étape 3 — Authentification (inscription, connexion, réinitialisation)
- [ ] Étape 4 — Interface principale (dashboard, offres, candidatures, profil)
- [ ] Étape 5 — Import et analyse de CV
- [ ] Étape 6 — Moteur de matching IA
- [ ] Étape 7 — Agents IA (CV, offres, lettres de motivation)
- [ ] Étape 8 — Découverte automatique des offres
- [ ] Étape 9 — Planification et automatisation
- [ ] Étape 10 — Notifications et tests de bout en bout

## Sécurité

- Row Level Security activée sur toutes les tables contenant des données utilisateur.
- Aucune clé API ou secret côté frontend — toutes les opérations sensibles passent par des Edge
  Functions.
- Le système ne collecte des offres que via des sources autorisées (API officielles, flux publics,
  import manuel par URL) et ne contourne aucune protection technique (CAPTCHA, authentification).
