# InstaPilot

Mini SaaS em Next.js para criar, revisar e publicar posts de imagem no Instagram pela API oficial da Meta.

## Stack

- Next.js 15
- React 19
- Firebase Firestore
- Firebase Storage
- Firebase Admin SDK
- Instagram API with Instagram Login
- PWA para uso no celular

## Fluxo

```text
Criar post
  ↓
Firebase Storage guarda a imagem
  ↓
Firestore guarda o rascunho
  ↓
Preview / fila de revisão
  ↓
Aprovar e publicar
  ↓
Instagram API
  ↓
Instagram
```

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_ENCRYPTION_KEY=

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/instagram/callback
INSTAGRAM_API_VERSION=v25.0
```

### APP_ENCRYPTION_KEY

Gere com:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Firebase

### 1. Firestore

No Firebase Console:

`Build → Firestore Database → Create database`

Não é necessário criar coleções manualmente. O InstaPilot cria automaticamente:

- `posts`
- `instagram_connections`

### 2. Storage

Ative:

`Build → Storage → Get started`

O backend envia as imagens para `post-media/...` e gera uma URL assinada para a Meta conseguir ler a mídia.

### 3. Firebase Admin SDK

No Firebase Console:

`Project settings → Service accounts → Firebase Admin SDK → Generate new private key`

Do JSON baixado, use:

- `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
- `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
- `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY`

Nunca envie esse JSON para o GitHub.

### 4. Web app

Em `Project settings → General → Your apps`, registre um Web App e copie os dados de `firebaseConfig` para as variáveis `NEXT_PUBLIC_FIREBASE_*`.

## Meta / Instagram

Use uma conta Instagram `Creator` ou `Business`.

No Meta for Developers configure `Instagram API with Instagram Login` e os escopos:

```text
instagram_business_basic
instagram_business_content_publish
```

Em produção, configure a Redirect URI como:

```text
https://SEU-DOMINIO.vercel.app/api/instagram/callback
```

E coloque a mesma URL em `INSTAGRAM_REDIRECT_URI` na Vercel.

## Vercel

Em `Project → Settings → Environment Variables`, cadastre todas as variáveis do `.env.example`.

Depois faça um novo deploy.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## PWA / celular

Depois do deploy HTTPS:

- iPhone: Safari → Compartilhar → Adicionar à Tela de Início
- Android: Chrome → Instalar app / Adicionar à tela inicial

## Segurança

- `FIREBASE_ADMIN_PRIVATE_KEY`, `INSTAGRAM_APP_SECRET` e `APP_ENCRYPTION_KEY` ficam somente no servidor.
- O token do Instagram é salvo criptografado no Firestore.
- Não coloque credenciais privadas em variáveis `NEXT_PUBLIC_*`.
