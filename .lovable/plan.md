

## Plano: Redirecionar para o domínio principal após reset de senha

O arquivo `src/pages/AuthVerifyRedirect.tsx` usa `window.location.origin` para montar a URL de destino após a verificação do token. Quando acessado pelo domínio do Lovable (`text-to-look-magic.lovable.app`), o usuário acaba na tela de reset nesse domínio interno.

A página `ResetPassword.tsx` já redireciona corretamente para `https://app.discoveryinvestimentos.com/` após o reset bem-sucedido — não precisa de alteração.

### Alteração

**`src/pages/AuthVerifyRedirect.tsx`** — Substituir todas as ocorrências de `window.location.origin` pela constante `https://app.discoveryinvestimentos.com`, garantindo que o `redirect_to` enviado ao Supabase sempre aponte para o domínio principal.

Isso faz com que, ao clicar no link do e-mail, o fluxo de verificação do token redirecione o usuário para `https://app.discoveryinvestimentos.com/reset-password` em vez do domínio interno do Lovable.

