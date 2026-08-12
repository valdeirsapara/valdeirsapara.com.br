# valdeirsapara.com.br

Blog pessoal — gerador estático simples feito com [Bun](https://bun.com), que converte arquivos Markdown em `content/` para HTML em `dist/`.

## Requisitos

- [Bun](https://bun.com) v1.3+

## Instalação

```bash
bun install
```

## Scripts

### Build

Gera o site estático em `dist/` a partir dos arquivos Markdown em `content/`.

```bash
bun run build
```

### Dev

Sobe um servidor local em [http://localhost:3000](http://localhost:3000) servindo os arquivos de `dist/`.

```bash
bun run dev
```

> Rode `bun run build` antes do `dev` (e novamente sempre que alterar algum conteúdo).

## Escrevendo posts

Use o script para criar um post novo já com o frontmatter preenchido:

```bash
bun new-post "Título do post"
```

Isso gera `content/AAAA/MM/titulo-do-post.md` com a data de hoje. Basta editar o `description` e escrever o conteúdo.

### Estrutura de um post

```markdown
---
title: Título do post
description: Resumo curto do post
date: 2026-08-10
tags: [typescript, bun]
series: "série: construindo este blog · 1/3"
---

Aqui começa o conteúdo em Markdown.
```

Um post tem duas partes:

**1. Frontmatter** — o bloco entre os dois `---`. São metadados em YAML lidos pelo [`gray-matter`](https://www.npmjs.com/package/gray-matter) antes de renderizar o Markdown.

| Campo | Obrigatório | Pra que serve |
|---|---|---|
| `title` | sim | Vira o `<title>` da página e o `<h1>` do post. Também aparece na listagem da home. |
| `description` | não | Vira o `<meta name="description">` e o resumo na home. |
| `date` | sim | Define a pasta final da URL (`/AAAA/MM/slug/`) e a ordenação/agrupamento por mês na home. |
| `tags` | não | Lista de textos. Aparecem como pílulas na listagem da home e como `<category>` no RSS. |
| `series` | não | Texto livre exibido na linha de metadados do post (ex: `série: construindo este blog · 1/3`). |

**2. Conteúdo** — tudo depois do segundo `---`. Markdown puro, renderizado pelo [`marked`](https://www.npmjs.com/package/marked) e injetado dentro do `<article>` do template.

### Regras importantes

- Os `---` precisam estar exatamente no início e no fim do bloco, sozinhos na linha.
- O formato dentro é YAML — envolva em aspas se o título tiver `:` (ex: `title: "Node.js: o que aprendi"`).
- A `date` deve ser `AAAA-MM-DD`.
- O slug da URL vem do nome do arquivo, não do `title`. Ou seja, `meu-post.md` vira `/2026/08/meu-post/`.
- Blocos de código aceitam um nome de arquivo depois da linguagem — ` ```ts:src/build.ts ` — que aparece na barra de título do bloco.
- Linguagens de shell (`console`, `bash`, `sh`, `zsh`, `terminal`) são renderizadas como sessão de terminal, sem barra de título.

## Estrutura

```
content/         # posts em Markdown
src/
  build.ts       # gerador estático
  dev.ts         # servidor local
  new-post.ts    # criador de posts
dist/            # saída gerada (ignorada no git)
```
