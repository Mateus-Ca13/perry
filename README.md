# Perry

Aplicação web para **receitas, despesas e investimentos** com visão **mês a mês**, interface em **português (pt-BR)** e armazenamento **local** no navegador. Pode ser instalada como **PWA** (Progressive Web App) para uso quase nativo no celular ou desktop.

---

## O que o Perry faz

- **Início (home):** navegação entre meses, resumo (entradas, saídas, investimentos, saldo), frase de contexto, prévias de lançamentos, bloco de investimentos e ação **Concluir mês — registrar sobra** (fechamento do período).
- **Receitas** (`/receitas`) e **despesas** (`/despesas`): listas filtradas por tipo, com a mesma base de transações.
- **Investimentos** (`/investimentos`): visão dedicada a aportes e categorias de investimento.
- **Menu** (`/menu`): ajustes como tema claro/escuro.
- **Dock flutuante:** atalho para adicionar transação; modal de criação/edição (e exclusão ao editar).

Lançamentos podem ser **fixos** (replicados nos meses seguintes de forma coerente com a data) e despesas/investimentos podem ser marcados como **quitado/alocado** para entrarem no resumo mesmo com data futura, conforme a lógica em `src/utils/monthComputation.ts`.

---

## Tecnologias

| Camada        | Tecnologia                          |
|---------------|-------------------------------------|
| UI            | React 19, TypeScript, Tailwind CSS 4 |
| Build         | Vite 8                              |
| Roteamento    | React Router 7                      |
| Ícones        | Lucide React                        |
| PWA / offline | `vite-plugin-pwa` (Workbox)         |

---

## Requisitos

- **Node.js** (versão suportada pelo Vite 8; recomenda-se LTS recente)
- **npm** (ou outro gestor compatível com `package-lock.json`)

---

## Como rodar o projeto

Instalação das dependências:

```bash
npm install
```

Servidor de desenvolvimento (com hot reload):

```bash
npm run dev
```

Build de produção (TypeScript + bundle):

```bash
npm run build
```

Pré-visualização do build:

```bash
npm run preview
```

Lint:

```bash
npm run lint
```

---

## PWA (instalável)

O manifest e o service worker estão configurados em `vite.config.ts` (plugin `VitePWA`):

- Nome de exibição, ícones, `start_url`, orientação e idioma `pt-BR`.
- `registerType: 'autoUpdate'`: atualizações de cache quando houver nova versão publicada.
- Em **desenvolvimento** (`npm run dev`), a PWA fica **desligada** (`devOptions.enabled: false`), o que evita conflitos com HMR. Teste instalação e cache após `npm run build` e `npm run preview` (ou em ambiente de produção).

---

## Dados e privacidade

- As transações são salvas no **`localStorage`** do navegador, na chave `perry_transactions` (ver `src/constants.ts` e `src/utils/storage.ts`).
- Não há backend neste repositório: **os dados não saem do seu dispositivo** salvo se você copiar/exportar manualmente (recurso de exportação não é garantido; confira a versão do código em uso).
- Limpar dados do site no navegador apaga o histórico de transações.

Modelo de transação: tipos `income`, `expense` e `investment`; campos como descrição, valor, data (`YYYY-MM-DD`), categoria, `fixed` e `paid` (comportamento detalhado em `src/types.ts` e no modal de edição).

---

## Rotas

| Rota            | Página        |
|-----------------|---------------|
| `/`             | Início        |
| `/receitas`     | Só receitas   |
| `/despesas`     | Só despesas   |
| `/investimentos`| Investimentos |
| `/menu`         | Menu (tema)   |
| outras          | Redireciona para `/` |

---

## Estrutura do repositório (resumo)

```
src/
  App.tsx                 # Rotas e providers
  main.tsx
  components/             # UI (lista, modais, dock, resumo, etc.)
  context/                # Tema e transações
  pages/                  # Páginas por rota
  utils/                  # Cálculo por mês, formatação, storage, filtros
  types.ts
  constants.ts            # Chave do storage e categorias
```

---

## Licença e contribuição

O `package.json` declara o pacote como **private**. Ajuste licença e guia de contribuição conforme a política do seu repositório.

---

## Documentação adicional (Vite / React)

Para detalhes do template (ESLint, React Compiler, extensão de regras TypeScript), consulte a documentação oficial do [Vite](https://vite.dev) e do [React](https://react.dev).
