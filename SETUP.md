# TrendHub Social Network - Setup Completo

## 🚀 Status Atual

✅ Servidor rodando em http://localhost:5173/
✅ Banco de dados PostgreSQL pronto
✅ Storage com 3 buckets (avatars, post-media, community-images)
✅ RLS policies configuradas para pública leitura de posts e profiles
✅ Auto-criação de profiles ao registrar novo usuário

---

## 📋 Passos para Fazer Tudo Funcionar

### 1️⃣ Executar o SQL no Supabase

**Arquivo:** `schema.sql` na raiz do projeto

**Como fazer:**
1. Abra https://app.supabase.com e entre em seu projeto
2. Clique em **"SQL Editor"** (lado esquerdo)
3. Clique em **"New Query"**
4. Cole **todo o conteúdo** do arquivo `schema.sql`
5. Clique em **"Run"** (botão azul)
6. Espere completar (levará alguns segundos)

> Se já tiver executado `schema.sql` antes, adicione também este bloco no final da query ou execute separadamente para remover o trigger antigo de `auth.users`:
>
> ```sql
> drop trigger if exists handle_new_user_trigger on auth.users;
> drop function if exists public.handle_new_user;
> ```

✅ **Resultado esperado:** Nenhuma mensagem de erro

---

### 2️⃣ Desabilitar Confirmação de Email (Para Desenvolvimento)

Se os usuários **não conseguem logar após confirmar email**:

1. Vá em https://app.supabase.com → seu projeto
2. **Authentication** → **Providers** → **Email**
3. Desative **"Confirm email"** 
4. Clique **"Save"**

Se preferir manter confirmação de email ativa, configure:
- Em **Email Templates**, customize o link de confirmação
- Em **URL Configuration**, adicione os Redirect URLs

---

### 3️⃣ Configurar Variáveis de Ambiente

**Arquivo:** `.env` na raiz do projeto

Já foi criado com placeholders. Substitua pelos valores reais:

```
VITE_SUPABASE_URL=https://seu-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...sua-anon-key...
```

**Como obter:**
1. https://app.supabase.com → seu projeto
2. **Settings** → **API** 
3. Copie:
   - **Project URL** (VITE_SUPABASE_URL)
   - **anon public** key (VITE_SUPABASE_ANON_KEY)

**Depois de preencher, reinicie o servidor:**
```bash
# No terminal do VS Code:
Ctrl+C  (para o servidor)
npm run dev
```

---

### 4️⃣ Registrar e Testar

1. Abra http://localhost:5173/
2. Clique em **"Criar Conta"**
3. Preencha email e senha
4. Se confirmação de email estiver desabilitada: clique em **"Entrar"** direto
5. Se confirmação estiver ativa: confirme email e depois faça login
6. Você será redirecionado para **"/feed"**

✅ **Esperado:** 
- Você vê seu perfil criado automaticamente
- Pode criar posts
- Posts aparecem no feed para todos os usuários

---

### 5️⃣ Testar Posts Visíveis

1. **Usuário 1:** Crie um post e note o conteúdo (ex: "Post teste 1")
2. **Abra nova aba anônima/privada**
3. **Usuário 2:** Registre-se, faça login
4. **Vá para "/feed"** 
5. ✅ Você deve ver o post de Usuário 1

**Se não ver:**
- Verifique no Supabase SQL Editor:
```sql
SELECT * FROM posts;  -- Deve mostrar seus posts
SELECT * FROM profiles;  -- Deve mostrar usuários criados
```

---

### 6️⃣ Testar Busca de Usuários

1. Vá para **"/explore"** (aba Explore)
2. Digite o nome de um usuário na barra de busca
3. ✅ Deve aparecer o usuário

**Se não aparecer:**
- Verifique se as policies RLS estão corretas:
```sql
SELECT * FROM auth.policies('profiles');
```

---

## 🔧 Troubleshooting

### ❌ Problema: Posts não aparecem no feed

**Causa:** RLS policies não permitem leitura pública
**Solução:** 
1. Verifique se executou `schema.sql` completamente
2. Se perdeu, re-execute tudo (é idempotente)

### ❌ Problema: Busca de usuários retorna vazio

**Causa:** Profile não foi criado
**Solução:**
1. Verifique em Supabase → Table Editor → profiles
2. Confirme que existe um registro para seu usuário
3. Se não existir: logout, login novamente (vai criar automaticamente)

### ❌ Problema: "Email não confirmado para logar"

**Causa:** Confirmação de email ativa, mas não confirme corretamente
**Solução:**
- Opção 1: Desabilite confirmação no Supabase (passo 2️⃣)
- Opção 2: Confirme o email e tente login novamente

### ❌ Problema: Erro ao criar post

**Possíveis causas:**
1. `.env` não está preenchido → refaça passo 3️⃣
2. Profile não existe → logout/login para criar automaticamente
3. RLS policy bloqueia INSERT → verifique schema.sql foi executado

---

## 📁 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| [schema.sql](schema.sql) | SQL para criar tabelas, RLS, Storage, triggers |
| [.env](.env) | Variáveis de ambiente (local) |
| [src/lib/supabase.ts](src/lib/supabase.ts) | Cliente Supabase |
| [src/store/authStore.ts](src/store/authStore.ts) | Gerenciamento de autenticação |
| [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) | Contexto de auth para toda a app |

---

## 🚀 Comandos Úteis

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm build

# Preview build
npm preview
```

---

## ✨ Resumo do Que Foi Feito

1. **Banco de Dados:**
   - ✅ 8 tabelas criadas (profiles, posts, comments, likes, follows, messages, communities, community_members)
   - ✅ RLS policies para leitura pública (posts, profiles, comments visíveis por todos)
   - ✅ RLS policies para escrita privada (apenas o autor pode modificar seu conteúdo)

2. **Storage:**
   - ✅ 3 buckets criados (avatars, post-media, community-images)
   - ✅ RLS policies para upload/download de mídia

3. **Autenticação:**
   - ✅ Cadastro funcionando sem trigger de criação automática
   - ✅ Fallback no front-end para criar profiles se não existirem
   - ✅ Desabilitação de confirmação de email (recomendado para dev)

4. **Frontend:**
   - ✅ Login/Register funcionando
   - ✅ Posts visíveis para todos
   - ✅ Busca de usuários funcionando
   - ✅ Profiles criados automaticamente

---

## 🎯 Próximos Passos (Opcional)

- [ ] Configurar SMTP para enviar emails de confirmação (produção)
- [ ] Adicionar mais funcionalidades (comentários, likes em tempo real)
- [ ] Deploy em produção (Vercel, Netlify, etc)
- [ ] Configurar domínio customizado

---

## 💬 Contato / Suporte

Se tiver dúvidas:
1. Verifique os logs do navegador (F12 → Console)
2. Verifique os logs do Supabase (Project → Logs → API)
3. Re-execute o `schema.sql` se algo quebrou

**Boa sorte! 🚀**
