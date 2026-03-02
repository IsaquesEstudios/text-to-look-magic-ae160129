

# Corrigir bordas brancas nos cards do painel administrativo

## Problema

Alguns componentes no painel administrativo usam o `<Card>` sem estilizacao customizada, resultando em bordas visiveis e fundo solido que destoam do restante do painel. O padrao correto usado na maioria das paginas e `bg-card/50 border-border/50`, que cria bordas e fundos mais sutis.

## Paginas/Componentes afetados

As seguintes paginas usam `<Card>` sem o padrao visual correto:

### 1. `src/pages/painel/LeilaoDetailPage.tsx`
- Cards de estatisticas (Total Depositado, Depositos, Meu Total) - linhas 475, 481, 488
- Card do formulario de edicao - linha 415
- Card "Participar do Leilao" - ja tem `border-primary/20`, adicionar `bg-card/50`
- Card "Imoveis / Terrenos" - linha 571
- Card "Depositos" (DepositsAccordion) - linha 113

### 2. `src/pages/painel/AdminLeiloesPage.tsx`
- Cards de leiloes "upcoming" - linha 317
- Cards de leiloes "finished" - linha 368

### 3. `src/components/painel/admin/AuctionInvestorLinking.tsx`
- Card principal - linha 177

## Alteracoes

Adicionar `bg-card/50 border-border/50` em todos os `<Card>` que estao sem essas classes, mantendo quaisquer classes extras ja existentes (como `hover:shadow-md`, `opacity-70`, `border-primary/20`).

Exemplo de antes/depois:
```text
Antes:  <Card>
Depois: <Card className="bg-card/50 border-border/50">

Antes:  <Card className="hover:shadow-md transition-shadow cursor-pointer">
Depois: <Card className="bg-card/50 border-border/50 hover:shadow-md transition-shadow cursor-pointer">
```

## Arquivos editados
- `src/pages/painel/LeilaoDetailPage.tsx` (6 Cards)
- `src/pages/painel/AdminLeiloesPage.tsx` (2 Cards)
- `src/components/painel/admin/AuctionInvestorLinking.tsx` (1 Card)

