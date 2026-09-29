# InstaPilot — mini SaaS de aprovação e publicação no Instagram

Painel leve, com **tema claro** e fluxo simples:

1. conectar o Instagram;
2. criar um rascunho;
3. ver o preview;
4. aprovar;
5. publicar pela **API oficial da Meta**.

Este MVP é ideal para você apresentar rápido para o cliente e evoluir depois para agendamento e geração automática.

---

## O que já funciona

- Conexão com Instagram via OAuth (`Instagram API with Instagram Login`)
- Escopos mínimos:
  - `instagram_business_basic`
  - `instagram_business_content_publish`
- Token salvo **criptografado com AES-256-GCM**
- Upload de imagem para Supabase Storage
- Ou uso de **URL pública** da imagem
- Criação de rascunho
- Preview estilo Instagram
- Fila de aprovação
- Botão **Aprovar e publicar**
- Publicação oficial em duas etapas:
  - `/{ig-user-id}/media`
  - `/{ig-user-id}/media_publish`
- Histórico dos posts
- Prevenção básica contra republicação do mesmo item

---

## Stack usada

- **Next.js 15**
- **React 19**
- **TypeScript**
- **Supabase** (Postgres + Storage)
- **Instagram Graph API / Instagram API with Instagram Login**

---

## Estrutura da solução

```text
Painel web (Next.js)
   │
   ├── salva rascunho ───────────────┐
   │                                 ▼
   │                           Supabase Postgres
   │                                 │
   ├── upload imagem ──────────> Supabase Storage
   │
   └── Aprovar e publicar
                │
                ▼
        Route Handler do Next.js
                │
                ├─ descriptografa token
                ├─ POST /media
                └─ POST /media_publish
                         │
                         ▼
                      Instagram
```

---

## O que você precisa para funcionar

### 1) Conta Instagram profissional
A conta precisa ser:
- **Business** ou
- **Creator**

Conta pessoal comum não serve para publicar via API.

### 2) App da Meta
Você precisa criar um app em:

```text
https://developers.facebook.com/
```

Use o fluxo **Instagram API with Instagram Login**.

### 3) Projeto no Supabase
Você vai usar o Supabase para:
- guardar a conexão do Instagram
- guardar os rascunhos
- guardar o histórico
- hospedar as imagens enviadas

### 4) Node.js 20+
Para rodar localmente.

### 5) Deploy (opcional, mas recomendado)
Use:
- **Vercel** para o app
- **Supabase** para banco/storage

Isso já fica muito rápido para demonstrar ao cliente.

---

## Passo a passo rápido para colocar no ar

## 1. Baixe e instale

```bash
npm install
```

---

## 2. Crie o banco no Supabase

No Supabase, abra o **SQL Editor** e execute:

```text
supabase/schema.sql
```

Isso cria:
- tabela `instagram_connections`
- tabela `posts`
- bucket `post-media`

Depois copie:
- **Project URL**
- **Service Role Key**

---

## 3. Gere a chave de criptografia

No terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Guarde o valor gerado. Ele vai para `APP_ENCRYPTION_KEY`.

---

## 4. Configure o app da Meta

No Meta for Developers:

### A. Crie o app
Crie um app novo.

### B. Adicione o produto certo
Adicione o fluxo/produto:

```text
Instagram API with Instagram Login
```

### C. Configure os escopos
O projeto usa:

```text
instagram_business_basic
instagram_business_content_publish
```

### D. Configure a Redirect URI
No local:

```text
http://localhost:3000/api/instagram/callback
```

Em produção:

```text
https://SEU-DOMINIO.com/api/instagram/callback
```

### E. Pegue as credenciais
Você vai precisar de:
- `INSTAGRAM_APP_ID`
- `INSTAGRAM_APP_SECRET`

> Enquanto o app estiver em modo de desenvolvimento, use uma conta de teste/autorizada no app.

---

## 5. Configure o `.env.local`

Copie o exemplo:

```bash
cp .env.example .env.local
```

Preencha assim:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_ENCRYPTION_KEY=COLE_AQUI_SUA_CHAVE_GERADA

NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET=post-media

INSTAGRAM_APP_ID=SEU_APP_ID
INSTAGRAM_APP_SECRET=SEU_APP_SECRET
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/instagram/callback
INSTAGRAM_API_VERSION=v25.0
```

---

## 6. Rode o projeto

```bash
npm run dev
```

Abra:

```text
http://localhost:3000
```

---

## 7. Como usar

1. Clique em **Conectar Instagram**
2. Autorize a conta Business/Creator
3. Faça upload da imagem ou cole a URL pública
4. Escreva a legenda
5. Veja o preview
6. Clique em **Salvar para revisão**
7. Na fila, clique em **Aprovar e publicar**

---

## Como a publicação funciona por trás

O backend faz exatamente duas chamadas principais para a Meta:

### 1. Cria o container do post

```text
POST https://graph.instagram.com/v25.0/{ig-user-id}/media
```

Enviando:
- `image_url`
- `caption`
- `alt_text` (opcional)
- `access_token`

### 2. Publica o container

```text
POST https://graph.instagram.com/v25.0/{ig-user-id}/media_publish
```

Enviando:
- `creation_id`
- `access_token`

---

## Arquivos principais

### Interface
- `components/Dashboard.tsx`
- `components/BrandMark.tsx`
- `app/globals.css`

### API / backend
- `app/api/instagram/connect/route.ts`
- `app/api/instagram/callback/route.ts`
- `app/api/instagram/status/route.ts`
- `app/api/posts/route.ts`
- `app/api/posts/[id]/publish/route.ts`
- `app/api/upload/route.ts`

### Integração com Instagram
- `lib/instagram.ts`

### Criptografia
- `lib/crypto.ts`

### Supabase
- `lib/supabase-admin.ts`
- `supabase/schema.sql`

---

## Deploy rápido na Vercel

### 1. Suba o projeto para GitHub

### 2. Importe na Vercel

### 3. Configure as mesmas variáveis de ambiente da `.env.local`

### 4. Troque no app da Meta a redirect URI para a URL pública

Exemplo:

```text
https://seu-projeto.vercel.app/api/instagram/callback
```

### 5. Teste a conexão do Instagram de novo

---

## Próximos upgrades fáceis

### V2 — agendamento
Adicionar:
- `scheduled_at`
- cron job
- publicação automática de posts já aprovados

### V3 — geração automática
Adicionar:
- banco de ideias
- IA para legenda
- IA/serviço para arte
- geração de rascunho automática

### V4 — multiusuário
Adicionar:
- login
- workspaces
- múltiplas contas Instagram
- permissões por cliente

---

## Observações importantes

- Não exponha `INSTAGRAM_APP_SECRET`
- Não exponha `SUPABASE_SERVICE_ROLE_KEY`
- Não exponha tokens no frontend
- A mídia precisa estar acessível publicamente para a Meta puxar a imagem
- Para vender isso para outros clientes, a Meta pode exigir **App Review**

---

## Resumo prático

Se você quiser mostrar isso rápido para o cliente, o caminho é:

```text
1. Supabase
2. App Meta
3. .env.local
4. npm install
5. npm run dev
6. conectar Instagram
7. criar post
8. aprovar e publicar
```

Esse é o MVP mais rápido para sair do papel com uma base séria e evolutiva.

## Web App / PWA no celular

Este projeto já inclui `manifest.webmanifest`, ícones e Service Worker. Depois de publicar em HTTPS (por exemplo, Vercel), ele pode ser instalado na tela inicial e aberto em modo standalone, semelhante a um aplicativo.

### iPhone / iPad
1. Abra a URL publicada no Safari.
2. Toque em Compartilhar.
3. Escolha **Adicionar à Tela de Início**.
4. Confirme **Adicionar**.

### Android / Chrome
1. Abra a URL publicada no Chrome.
2. Abra o menu do navegador.
3. Escolha **Instalar app** ou **Adicionar à tela inicial**.

### Navegação mobile
No celular, o painel exibe uma barra inferior fixa com atalhos para Início, Criar, Preview e Fila. Inputs usam tamanho adequado para evitar zoom automático no iPhone e ações de publicação recebem áreas de toque maiores.

> Observação: publicação e consulta de dados precisam de internet. O Service Worker mantém somente o shell básico disponível; não publica offline.
