---
title: Construindo meu próprio blog com Bun
description: Construindo meu blog com Bun HTML CSS sem framework
date: 2026-08-12
tags: [bun, typescript, rss, html,css]
series:
---
Eu queria criar um blog há algum tempo, principalmente porque tenho o costume de construir coisas, estudar assuntos diferentes e descobrir coisas que acho interessantes, mas quase nunca registro nada disso. A ideia do blog nasceu justamente daí: ter um lugar meu onde eu pudesse escrever sobre o que estou fazendo, o que estou aprendendo e até sobre coisas que ainda estou tentando entender.

Quando comecei a pensar em como construir isso, minha primeira ideia foi fazer da maneira mais simples possível. Eu não queria WordPress, banco de dados, CMS ou um servidor rodando uma aplicação só para entregar meus textos. Pensei que poderia fazer tudo apenas com HTML, CSS e JavaScript, deixando os posts como arquivos Markdown dentro do próprio projeto.

A ideia inicial era basicamente ter algo assim:

```text
assets/
└── posts/
    ├── primeiro-post.md
    └── outro-post.md
```

O JavaScript carregaria o arquivo `.md`, alguma biblioteca converteria Markdown para HTML e pronto. Pelo menos era o que eu imaginava no começo.

## Eu não precisava de um servidor, precisava de um build

Conforme comecei a desenvolver, algumas coisas começaram a incomodar. Eu queria que cada artigo tivesse uma URL bonita, como `/2026/08/me-aventurando-em-go-sem-aprender-go/`. Também queria que a homepage fosse construída automaticamente a partir dos artigos, queria metadata para cada página, RSS e, principalmente, queria entregar HTML pronto em vez de depender do JavaScript do navegador para renderizar o conteúdo.

Foi aí que percebi que estava tentando resolver o problema errado. Eu continuava pensando que as alternativas eram ter ou não ter um servidor, mas eu não precisava de um servidor para fazer essas coisas. Eu precisava de um processo de build.

Eu poderia ter escrito esse gerador em Python tranquilamente, provavelmente seria até o caminho mais confortável para mim. Mas justamente por isso resolvi não fazer. Já tenho bastante coisa em Python e nunca tinha colocado nenhum projeto meu em produção usando Bun. O blog parecia uma oportunidade boa para experimentar.

No final, a stack ficou pequena: Bun, TypeScript, HTML, CSS e Markdown. Não tem React, Next, banco de dados ou CMS. O Bun também não fica rodando em produção. Ele existe apenas para transformar meu conteúdo nos arquivos estáticos que serão publicados.

## Os posts são apenas arquivos

Eu queria que escrever continuasse sendo a parte mais simples possível. Hoje os artigos ficam organizados dentro do projeto por ano e mês:

```text
content/
└── 2026/
    └── 08/
        └── primeiro-post.md
```

Cada Markdown possui algumas informações no início do arquivo:

```yaml
---
title: Meu primeiro post
date: 2026-08-10
description: O começo de alguma coisa.
---
```

Depois disso é simplesmente Markdown normal. Durante o build, uso `Bun.Glob` para encontrar todos esses arquivos:

```typescript
const glob = new Bun.Glob("**/*.md");
```

O nome do arquivo vira o slug do artigo e a data determina sua posição na estrutura do site. Dessa forma, `content/2026/08/primeiro-post.md` acaba gerando `dist/2026/08/primeiro-post/index.html`, que por consequência pode ser acessado em `/2026/08/primeiro-post/`.

Eu gostei bastante desse formato porque existe uma relação muito simples entre o que está no meu repositório e o que aparece na internet. Se daqui a alguns anos eu abrir a pasta `content/2026`, vou encontrar exatamente os textos que escrevi naquele ano.

## A primeira pequena surpresa veio do Windows

Enquanto estava construindo essa parte, apareceu um bug interessante. Em determinado momento meu diretório de saída ficou parecido com isso:

```text
dist/2026/08/2026\08\primeiro-post
```

Eu estava desenvolvendo no Windows (isso vai render outro post sobre por que tenho usado Windows) e havia misturado caminhos do filesystem com caminhos que eu estava tratando como URLs. Poderia simplesmente substituir `\` por `/`, mas aí estaria criando uma solução que provavelmente voltaria para me incomodar depois.

Resolvi usar `node:path` para tudo que pertence ao filesystem:

```typescript
import path from "node:path";

const slug = path.basename(filename, ".md");

const outputDir = path.join(
  "dist",
  year,
  month,
  slug
);
```

Para URLs, entretanto, continuo montando o caminho com `/`:

```typescript
const url = `/${year}/${month}/${slug}/`;
```

É uma diferença pequena, mas deixou o build independente do sistema operacional. Posso rodá-lo no Windows durante o desenvolvimento e depois em Linux sem precisar ter condições específicas espalhadas pelo código.

## A homepage também nasce dos Markdown

Depois que os artigos começaram a ser gerados automaticamente, percebi que não havia motivo para manter a homepage manualmente. O build já estava lendo todos os meus textos e conhecia título, descrição, data, slug e URL de cada um deles. Bastava guardar essas informações enquanto os arquivos eram processados.

Criei então uma representação simples para cada artigo:

```typescript
type Post = {
  title: string;
  description: string;
  date: Date;
  slug: string;
  url: string;
};
```

Depois de processar os Markdown, os artigos são ordenados pela data e usados para gerar o `index.html`. Também resolvi agrupá-los por mês, porque gosto da ideia de a homepage funcionar como um arquivo cronológico. Conforme eu escrever, quero conseguir olhar para trás e encontrar agosto de 2026, setembro de 2026, 2027 e assim por diante.

Isso tem bastante relação com o motivo pelo qual criei este blog. Não quero que ele seja apenas uma coleção de tutoriais. Quero que, com o passar do tempo, ele se torne um registro do que eu estava construindo e pensando em diferentes momentos.

## E eu queria RSS

RSS era uma das poucas funcionalidades que eu já sabia que queria antes mesmo de começar. Gosto muito da ideia de poder acompanhar um site sem depender de uma plataforma decidindo o que deve aparecer em um feed. Se alguém quiser acompanhar o que escrevo, existe um `feed.xml`, a pessoa adiciona ao leitor que quiser e acabou.

Também achei curioso estar construindo o blog com Bun, uma tecnologia relativamente nova, e ao mesmo tempo fazendo questão de suportar RSS, uma tecnologia que existe há décadas. No fim, as duas coisas convivem perfeitamente porque o resultado do build continua sendo apenas arquivos.

Hoje o fluxo do blog é basicamente este:

```text
Markdown
    ↓
   Bun
    ↓
Posts + Homepage + RSS
    ↓
  dist/
    ↓
arquivos estáticos
```

Quem hospeda o site não precisa saber o que é Bun, TypeScript ou Markdown. O processo de build acontece antes da publicação e o servidor recebe apenas HTML, CSS, XML e os demais arquivos estáticos.

## Por que não usar algo pronto?

Essa provavelmente é a pergunta mais óbvia. Existem diversas ferramentas que já fazem tudo isso. Eu poderia ter usado Astro, Hugo, Jekyll ou até WordPress e provavelmente teria terminado mais rápido.

Mas terminar mais rápido não era necessariamente o objetivo.

Eu comecei esse blog porque queria um lugar para registrar as coisas que construo e aprendo. Nesse contexto, construir o próprio mecanismo que gera o blog acabou fazendo parte da diversão. Em vez de configurar um gerador de sites, eu precisei pensar em como descobrir os artigos, como representar seus metadados, como gerar URLs, como lidar com diferenças entre sistemas operacionais, como montar a homepage e como gerar o feed.

Não criei meu próprio gerador de site estático porque achei que o mundo precisava de mais um. Fiz porque queria entender o problema e porque achei que seria divertido construir.

Agora tenho um projeto pequeno, que consigo abrir e entender praticamente inteiro, onde um arquivo Markdown que escrevo no meu computador termina como uma página publicada em `valdeirsapara.com.br`.

E talvez daqui a alguns meses eu olhe para esse código e descubra que metade das decisões que tomei foram ruins. Se isso acontecer, ótimo.

Provavelmente vai render outro post.