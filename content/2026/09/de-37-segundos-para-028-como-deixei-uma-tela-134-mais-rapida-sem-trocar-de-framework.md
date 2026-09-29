---
title: "De 37 segundos para 0,28: como deixei uma tela 134× mais rápida sem trocar de framework"
description: "Uma tela que nunca terminava de carregar num sistema legado, e por que a resposta não foi reescrever o front."
date: 2026-09-28
tags: [performance, django, postgres, sql, legado]
series:
---

Toda vez que um sistema legado fica lento, aparece alguém dizendo que o problema é o framework. "Isso aí é AngularJS, tem que migrar pra React." "Tem que virar SPA." "Tem que reescrever."

Quase nunca é o framework.

Estive com um problema grande na Defensoria: tínhamos uma tela no sistema que demorava horrores pra carregar, e isso era inaceitável. Então abri meu Claude e comecei a investigar e testar. No fim, a tela ficou **134 vezes mais rápida**, e eu não troquei uma linha de framework. Foi SQL, índice, cache e HTML montado no servidor. Coisa que existe há mais de 20 anos.

## Que tela é essa?

É a primeira coisa que o usuário vê quando entra no sistema: a lista de tarefas dele. O que tem pra fazer, o que tá atrasado, o que já foi cumprido, cada um numa aba. É a tela que todo mundo abre todo dia, várias vezes por dia.

E ela simplesmente não abria. Ficava o "Carregando..." girando. E girando. E girando.

## Por que ela nunca terminava?

Dois problemas, um escondendo o outro.

O primeiro: a requisição que buscava as tarefas levava uns **58 segundos**. O servidor tem um tempo limite e mata qualquer requisição que passe dele. Então a resposta não chegava lenta. Ela **não chegava**.

O segundo: o front não tratava erro. A requisição morria no servidor e ninguém avisava o spinner. Ele ficava lá, girando, feliz, pra sempre.

O segundo se resolve em cinco linhas. O primeiro era o problema de verdade.

## O culpado era um OR

Medi aba por aba. Quase todo o tempo vinha de uma só: a de **cumpridas**. Faz todo o sentido: tarefa cumprida nunca sai de lá. É a aba que só cresce, todo dia, desde que o sistema existe.

A consulta tinha mais ou menos esta cara:

```python
Tarefa.objects.filter(
    Q(setor__in=meus_setores)
    | Q(responsavel=eu)
    | Q(atendimento__equipe_itinerante=eu)   # ← repara nesse
).filter(status="cumprida").distinct()
```

Parece inofensiva. Não é.

Repara no terceiro ramo do `OR`: ele depende de um JOIN com outra tabela. E quando **um** lado do `OR` precisa de JOIN, o banco não consegue usar os índices dos **outros** lados. Não tem como. Então o Postgres fazia o que dava pra fazer: pegava **todas as tarefas cumpridas do sistema inteiro**, centenas de milhares de linhas, fazia os JOINs em cima de tudo e só no final descartava o que não era do usuário.

Pra cada pessoa. Toda vez que ela abria a tela.

E tinha mais: outros JOINs com relações "um pra muitos" multiplicavam as linhas, e a consulta precisava de um `DISTINCT` no final pra limpar a sujeira que ela mesma tinha feito.

Ninguém escreveu isso de propósito. Consulta assim nasce pequena, com três filtros, e vai ganhando um `OR` aqui e um JOIN ali ao longo de anos. Com pouca tarefa no banco, funciona. Um dia o banco cresce e ela para de funcionar.

## Então, o que eu fiz?

Nada de novo. E esse é o ponto.

### Quebrei o OR em pedaços

Se o `OR` impede o uso dos índices, então não usa `OR`. Faz uma consulta pra cada ramo, cada uma no seu índice, e junta com `UNION`:

```python
ramos = [Q(setor=s) for s in meus_setores] + [
    Q(responsavel=eu),
    Q(atendimento_id__in=meus_atendimentos),  # lista já pronta, sem JOIN
]

consultas = [base.filter(r).values_list("id", flat=True) for r in ramos]
candidatos = list(consultas[0].union(*consultas[1:]))
```

Isso devolve só os ids que interessam: dezenas, talvez centenas. Não centenas de milhares. **Só depois** eu aplico o resto do filtro em cima desses candidatos:

```python
Tarefa.objects.filter(id__in=candidatos).filter(resto_do_filtro)
```

Um detalhe que me pegou de surpresa: até um inocente `setor__in=[1, 2, 3]` fazia o planejador ignorar o índice. Uma consulta por setor, juntadas depois, foi mais rápido. Contraintuitivo, mas o número não mente.

### Troquei JOIN por EXISTS

Se eu só quero saber **se existe** uma resposta ativa pra tarefa, por que eu tô trazendo todas as respostas?

```python
respostas = Resposta.objects.filter(tarefa=OuterRef("pk"))
Tarefa.objects.filter(Exists(respostas.filter(ativa=True)))
```

`EXISTS` não multiplica linha nenhuma, e para na primeira que acha. O `DISTINCT` foi embora junto.

### Índice parcial

Índice não precisa cobrir a tabela inteira. A maioria das buscas era sobre tarefas **em aberto**, uma fração pequena do total. Então o índice cobre só elas:

```python
models.Index(
    fields=["setor"],
    condition=Q(data_finalizado=None),
    name="tarefa_aberta_setor_idx",
)
```

Índice menor cabe na memória, e o que cabe na memória é rápido. E com `CONCURRENTLY`, porque criar índice em tabela de produção sem isso trava as gravações, e eu não queria descobrir isso do pior jeito.

### Manda só o que a pessoa vai ver

Dentro de cada aba, as tarefas ficam em grupos que abrem e fecham. Antes, o sistema mandava **tudo**, de todos os grupos, mesmo os que a pessoa nunca ia abrir.

Agora vão só os títulos com a contagem ("Setor X — 12 tarefas"). As tarefas de um grupo só são buscadas quando ele é aberto.

E aqui é onde a turma do "tem que ser SPA" costuma torcer o nariz: fiz com **template do Django gerando HTML e jQuery colocando na tela**. É assim que se fazia em 2010, e funciona igualzinho em 2026. Sem build, sem bundler, sem store de estado, e sem 400 MB de `node_modules`.

Por cima, dois caches bobos: 1 hora pro que quase nunca muda e 2 minutos pra lista de cada usuário.

## E aí, funcionou?

Medido em produção, só leitura, na aba de cumpridas de um usuário real:

| Situação | Tempo |
|---|---|
| Antes | 37,7 s |
| Só a consulta nova | 2,3 s |
| Consulta nova + índices | **0,28 s** |

**Umas 134 vezes mais rápido.**

Repara que só reescrever a consulta já deu 16×. Os índices vieram depois e deram mais 8×. Se eu tivesse começado criando índice em cima da consulta velha, não teria adiantado nada: o planejador nem ia usar.

E conferi que as tarefas eram exatamente as mesmas, na mesma ordem, em todas as abas. Otimização que muda o resultado não é otimização. É bug.

De brinde, apareceu um bug antigo. Alguns campos da lista, tipo "última resposta por", vinham de **uma linha qualquer** do JOIN. Estavam errados fazia sabe-se lá quanto tempo, e ninguém tinha notado. Com a consulta nova, passaram a mostrar o certo.

## Nem tudo foi lindo

Subiu pra produção e, dias depois, reclamação: o prazo das tarefas aparecia em branco.

Pra não duplicar código, eu tinha reaproveitado no template o mesmo dicionário que o front antigo usava. Só que ali as datas já vinham convertidas pra **texto**, porque é assim que vão no JSON. E o filtro `date` do Django só sabe formatar data de verdade. Se recebe texto, ele **devolve vazio**. Sem erro. Sem log. Sem nada.

É o pior tipo de bug: o sistema não quebra, só mente.

Resolvi formatando no Python, numa chave separada, sem mexer no que o front antigo espera. A lição é velha, mas eu esqueci: reaproveitou estrutura de dados entre duas camadas? Confere o **tipo**, não só o nome do campo.

## E o Claude nessa história?

Usei o tempo todo. Pra navegar num código que eu não escrevi, levantar hipótese, montar a consulta nova, comparar resultado. Ele acelerou muito.

Mas quem decidiu foram os números medidos em produção. A IA me ajudou a chegar mais rápido nas perguntas certas. A resposta veio da medição. E o bug do prazo em branco passou por mim **e** por ela, e quem pegou foi o usuário.

## Moral da história

Todo mundo quer reescrever. Reescrever é divertido, dá pra usar a tecnologia nova e colocar no currículo.

Mas a tela não tava lenta porque era AngularJS. Tava lenta porque uma consulta varria a tabela inteira pra cada pessoa que abria a página. Se eu tivesse reescrito tudo em React, ia ter um front novinho, bonito, esperando 58 segundos pela mesma consulta.

Antes de trocar o framework, olha a consulta. Na maioria das vezes, o problema tá lá.
