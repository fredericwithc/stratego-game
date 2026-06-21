# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Jogo online (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, execute o arquivo [`supabase/schema.sql`](supabase/schema.sql) **inteiro**. Se o projeto já existia, rode também:
   - `alter table public.rooms add column if not exists combate jsonb;`
   - `alter table public.rooms add column if not exists pecas_capturadas jsonb not null default '{"Vermelho":[],"Azul":[]}'::jsonb;`
3. **Não** use **Database → Replication** (isso é para réplicas/read replicas pagas). Para conferir Realtime: **Database → Publications** → abra `supabase_realtime` e veja se `rooms` está listada. Alternativa: ícone **Realtime** na barra lateral do projeto.
4. Copie `.env.example` para `.env.local` e preencha `REACT_APP_SUPABASE_URL` e `REACT_APP_SUPABASE_ANON_KEY` (Project Settings → API).
5. Rode `npm start` (local) ou `npm run build` + `npm run deploy` (GitHub Pages). **Importante:** o `.env.local` precisa existir **antes** do `npm run build` — o Create React App grava as variáveis no JS na hora do build. Sem isso, o site publicado abre em branco.

### Keep-alive (plano Free — evitar pausa por inatividade)

No plano **grátis**, o Supabase **pausa** o projeto após **7 dias sem requisições** (REST, Realtime, etc.). O jogo online para até você restaurar manualmente no dashboard.

Este repositório inclui o workflow [`.github/workflows/supabase-keepalive.yml`](.github/workflows/supabase-keepalive.yml), que faz um ping leve na tabela `rooms` **a cada ~6 dias** (12:00 UTC nos dias 1, 7, 13, 19, 25 e 31).

**Configuração (uma vez):**

1. No GitHub: **Settings → Secrets and variables → Actions → New repository secret**
2. Crie dois secrets (mesmos valores do `.env.local`):
   - `SUPABASE_URL` — ex.: `https://xxx.supabase.co` (sem `/rest/v1/`)
   - `SUPABASE_ANON_KEY` — chave **anon public** (Project Settings → API)
3. Faça **commit + push** do workflow (se ainda não estiver no GitHub)
4. Teste: **Actions → Supabase Keep-Alive → Run workflow** — deve ficar verde com `HTTP status: 200`

**Verificação:** em **Actions**, confira execuções periódicas com status verde. Falha vermelha = secrets incorretos ou projeto pausado (restaure no dashboard e rode de novo).

**Segurança:** use apenas a anon key (já pública no build do site). **Nunca** coloque a `service_role` nos secrets.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
