

## Diagnóstico

O Nelson Ocampo-Rodriguez aparece tanto na página de Registros (pendente) quanto na lista de Usuários porque o componente `AdminUsersList.tsx` carrega todos os perfis sem filtrar por status. Ele deveria aparecer apenas na lista de Usuários **após ser aprovado**.

## Plano

### Arquivo: `src/components/painel/admin/AdminUsersList.tsx`

Adicionar filtro na query para mostrar apenas usuários aprovados, excluindo pendentes e rejeitados:

- Na query (linha 15-19), adicionar `.eq("status", "approved")` ao select
- Isso garante que usuários pendentes/rejeitados apareçam apenas na página de Registros

### Resultado esperado

- Usuários com status `pending` ou `rejected` aparecem **somente** em `/painel/registros`
- Após aprovação, o usuário migra automaticamente para a lista de Usuários em `/painel/usuarios`
- Nelson só aparecerá na lista de usuários depois de ser aprovado na página de registros

