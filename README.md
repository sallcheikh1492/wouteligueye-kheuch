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

## Schéma de base de données

Les migrations (`supabase/migrations/`) créent, dans l'ordre : les extensions et types énumérés,
puis `profiles`, `cvs`, `skills`, `job_preferences`, `job_sources`, `jobs`, `job_matches`,
`applications`, `generated_documents`, `agent_runs`, `notifications`. Chaque table de données
utilisateur a Row Level Security activée avec des politiques `user_id = auth.uid()` (ou
`id = auth.uid()` pour `profiles`) séparées par opération (SELECT/INSERT/UPDATE/DELETE). Les tables
partagées (`job_sources`, `jobs`) sont en lecture seule pour les utilisateurs authentifiés ; seules
les Edge Functions (clé `service_role`, qui contourne RLS) peuvent y écrire.

Un profil de démonstration (Business Intelligence / Data Analyst, voir section 3 du cahier des
charges) peut être chargé volontairement via la fonction RPC `seed_demo_profile()` — jamais exécutée
automatiquement, uniquement pour tester l'application avant d'importer un vrai CV.

## Authentification

L'inscription, la connexion, la réinitialisation du mot de passe et la déconnexion utilisent
Supabase Auth (`src/contexts/AuthContext.tsx`). Toutes les routes de l'application (tableau de
bord, offres, candidatures, etc.) sont protégées par `ProtectedRoute` et redirigent vers `/login`
tant qu'aucune session n'est active ; à l'inverse, `/login`, `/signup` et `/forgot-password`
redirigent vers le tableau de bord si l'utilisateur est déjà connecté. Un profil est créé
automatiquement dans `public.profiles` à l'inscription (trigger `handle_new_user`).

Ces écrans nécessitent un vrai projet Supabase pour être testés de bout en bout (inscription,
e-mail de confirmation, connexion, lien de réinitialisation) — ils ont été vérifiés visuellement
et sur la validation des formulaires avec des identifiants factices, sans backend réel.

## Interface principale

Le tableau de bord, les offres, les candidatures et le profil sont branchés sur Supabase via des
services typés (`src/services/`) et des hooks TanStack Query (`src/hooks/`) : requêtes mises en
cache, invalidées automatiquement après chaque mutation, avec états de chargement (skeletons) et
d'erreur explicites. La page Offres liste les `job_matches` de l'utilisateur (favoris, ignorer,
préparer une candidature) ; Candidatures permet de changer le statut d'une candidature ; Profil
gère les informations générales et les compétences, avec un bouton pour charger le profil de
démonstration (`seed_demo_profile()`).

Ces écrans restent vides tant qu'aucune offre n'a été découverte ou analysée — normal avant les
étapes Agents IA et Découverte automatique, qui alimenteront `jobs` et `job_matches`.

## Import et analyse de CV

Les CV (PDF/DOCX, 10 Mo max) sont téléversés dans le bucket privé Supabase Storage `cvs`, sous
`<user_id>/<fichier>` — les politiques RLS sur `storage.objects` limitent chaque utilisateur à son
propre dossier. La page « Mes CV » permet d'importer, définir un CV principal et supprimer.

L'analyse est déclenchée à la demande (bouton « Analyser ») et exécutée entièrement côté serveur
par l'Edge Function `analyze-cv` :

1. Téléchargement du fichier depuis Storage (avec le JWT de l'utilisateur — RLS garantit qu'il ne
   peut accéder qu'à ses propres fichiers, aucune clé de service n'est nécessaire).
2. Extraction du texte (`unpdf` pour les PDF, `mammoth` pour les DOCX).
3. Extraction structurée par Claude via l'API *tool use* (schéma JSON strict : résumé,
   compétences catégorisées, formations, expériences, projets, langues, certifications) —
   consigne explicite de ne jamais inventer d'information absente du texte.
4. Enregistrement du résultat sur la ligne `cvs` (`raw_text`, `parsed_data`).

Le résultat est ensuite présenté dans une boîte de dialogue de relecture (rien n'est enregistré
dans le profil sans validation) : le résumé peut être renvoyé vers `profiles.professional_summary`,
et les compétences sélectionnées peuvent être importées individuellement dans `skills`.

## Moteur de matching IA

Le score de compatibilité (0-100) combine des règles déterministes et une évaluation IA
contextuelle, jamais l'IA seule (spec section 12) :

| Composante | Poids | Calcul |
|---|---|---|
| Compétences | 35 % | recoupement compétences utilisateur ↔ requises/préférées du poste (`_shared/matching/scoring.ts`) |
| Expérience | 20 % | années d'expérience estimées depuis le CV vs séniorité attendue |
| Formation | 15 % | pertinence du domaine d'études |
| Localisation | 10 % | correspondance avec les localisations préférées / télétravail |
| Mots-clés | 10 % | recoupement lexical CV ↔ description du poste |
| Contexte IA | 10 % | évaluation holistique par Claude (trajectoire, pertinence globale) |

Deux Edge Functions :

- **`analyze-job`** extrait les exigences structurées d'une offre (résumé, compétences requises/
  préférées, séniorité, responsabilités) et met le résultat en cache sur `jobs.ai_analysis` — calculé
  une seule fois par offre, jamais par utilisateur.
- **`calculate-job-match`** calcule les 5 scores déterministes, appelle Claude pour le score de
  contexte, combine le tout selon les poids ci-dessus, et enregistre le résultat dans `job_matches`
  (via la clé de service, cette table n'ayant pas de politique INSERT/UPDATE pour les utilisateurs).

Toutes les réponses IA sont validées avec Zod avant d'être utilisées ou enregistrées
(`_shared/ai/validation.ts`).

**Import manuel d'offres** — en attendant l'agent de découverte automatique (étape 8), la page
Offres permet d'ajouter une offre par ses informations via l'Edge Function `process-job`
(spec section 11 : l'import manuel doit toujours être possible). L'offre est immédiatement
analysée après import.

## Fournisseurs IA

L'application communique avec les modèles d'IA uniquement depuis les Edge Functions Supabase, via
l'interface `AIProvider` (voir `supabase/functions/_shared/ai/types.ts`). Le fournisseur par défaut
est **Anthropic Claude** (`claude-sonnet-5`, voir `_shared/ai/anthropic.ts`) ; l'abstraction permet
d'ajouter d'autres fournisseurs sans changer le code appelant.

`analyzeCV()`, `analyzeJob()` et `calculateMatch()` sont implémentées. `generateCoverLetter()` et
`optimizeCV()` arrivent avec les agents IA (étape 7) — les appeler avant cela lève volontairement
une erreur explicite plutôt que de renvoyer un résultat silencieusement incorrect.

## Feuille de route

- [x] Étape 1 — Architecture et scaffolding (frontend, structure de dossiers, shadcn/ui)
- [x] Étape 2 — Schéma de base de données et politiques RLS
- [x] Étape 3 — Authentification (inscription, connexion, réinitialisation)
- [x] Étape 4 — Interface principale (dashboard, offres, candidatures, profil)
- [x] Étape 5 — Import et analyse de CV
- [x] Étape 6 — Moteur de matching IA
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
