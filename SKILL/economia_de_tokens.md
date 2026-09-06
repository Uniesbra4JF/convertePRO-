---
name: economia-de-tokens
description: Use em toda tarefa de codificação, edição de arquivos, debugging ou automação na IDE (Claude Code ou similar) para gastar o mínimo de tokens sem perder qualidade ou correção. Acione sempre — leitura de arquivo, chamadas de ferramenta, edição de código, análise de log/erro, tarefa repetitiva — mesmo sem o usuário pedir. Vale mais ainda em sessões longas, arquivos grandes e fluxos com muita ida e volta.
---

# Economia de Tokens

Corte o desperdício, não a substância. Antes de cada ação: essa leitura, chamada ou texto é necessária para o resultado sair correto? Se não, corte.

## Ler

- Nunca leia um arquivo inteiro por uma parte. Localize com `grep`/`rg` primeiro, depois leia só o range.
- Não releia o que já está no contexto e não mudou.
- Após um `str_replace`, releia só a região editada.
- Em JSON/CSV/log grandes, extraia o campo com `jq`/`awk`/`head`/`tail` — nunca despeje o arquivo todo.

## Editar

- `str_replace` sempre que possível. Reescrita completa só quando a mudança é estrutural.
- Mude só o necessário. Não aproveite para reformatar o que não pediu.
- Na resposta, mostre o trecho alterado — não o arquivo inteiro, a menos que peçam.
- Mudança repetitiva em N lugares: escreva um script. Não peça pro modelo repetir manualmente.

## Executar

- Chamadas independentes, no mesmo turno.
- Nunca repita uma chamada cujo resultado já está ali.
- Filtre na origem (`grep`, `head -n`, `--oneline`), não depois de ler tudo.
- Teste só o que a mudança afeta. Suíte completa só antes de merge/release.
- Evite saída volumosa e inútil (`ls -la` recursivo, `cat` de log gigante). Use `find`, `wc -l`, paginação.

## Responder

- Não repita código, arquivo ou log que já está no contexto — referencie por local ("função `foo`, linha 42").
- Resuma stack trace: causa raiz e linha, não o log inteiro.
- Pule explicação de decisão óbvia. Detalhe só o que não é óbvio.
- Não repita o que o sistema já injeta a cada turno.

## Nunca cortar

- Verificação de que o código funciona. Pular isso gera retrabalho e custa mais tokens depois.
- Leitura do trecho diretamente afetado pela mudança.
- Contexto de dependência entre arquivos antes de alterar uma função usada em vários lugares.
- Clareza sobre o que mudou e por quê, quando a mudança não é trivial.
- Validação de input, tratamento de erro, checagem de edge case.

## Nunca ler pasta/arquivo

- pasta ".geminiignore"
- pasta "node_modules"

## Sinal de alerta

Prestes a reler um arquivo pela segunda vez, colar o arquivo inteiro na resposta, rodar a suíte toda por uma mudança de uma linha, ou repetir uma explicação já dada? Pare e escolha a versão mais enxuta.
