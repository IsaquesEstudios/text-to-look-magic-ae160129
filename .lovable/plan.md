

## Comprovantes no Painel do Usuário

Adicionar uma nova página "Comprovantes" no painel do investidor para que ele possa visualizar os comprovantes de pagamento (recebidos e enviados) que o admin cadastrou no perfil dele.

### O que será feito

1. **Nova página `UserComprovantesPage`** -- Exibe as imagens de `user_payment_images` do usuário logado, separadas em duas seções:
   - "Pagamentos Recebidos" (type = `received`)
   - "Pagamentos Enviados" (type = `sent`)
   - Cada imagem mostra a foto e a data, em grid responsivo
   - Somente leitura (sem upload/delete -- isso fica no admin)

2. **Novo item no menu do usuário** -- Adicionar "Comprovantes" com icone `Receipt` (ou `FileImage`) na sidebar do investidor em `PainelLayout.tsx`, entre "Extrato" e os demais

3. **Rota** -- Registrar `/painel/comprovantes` em `routes.tsx`

4. **RLS** -- Ja existe policy `Users can view own payment images` na tabela `user_payment_images`, entao nao precisa de alteracao no banco

### Detalhes Técnicos

- **Arquivo novo**: `src/pages/painel/UserComprovantesPage.tsx`
  - Query em `user_payment_images` filtrando `user_id = auth.uid()` via RLS
  - Separar por `type` ("received" / "sent")
  - Grid de imagens com data, clicavel para abrir em tamanho maior (dialog)

- **Editar**: `src/components/painel/PainelLayout.tsx`
  - Adicionar `{ label: "Comprovantes", icon: FileImage, path: "/painel/comprovantes" }` ao `userNavItems`

- **Editar**: `src/routes.tsx`
  - Lazy import de `UserComprovantesPage`
  - Adicionar `{ path: "comprovantes", element: ... }` em `panelChildren`

