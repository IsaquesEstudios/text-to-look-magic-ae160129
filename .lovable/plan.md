

## Problema

Quando o app nativo reabre, o Capacitor carrega a URL `/auth`. O componente `Auth` renderiza o formulário de login **imediatamente** e só redireciona para `/painel` depois que o `useAuth` termina de carregar (`isLoading` vira `false` e `user` existe). Isso causa o flash da tela de login.

## Solução

Mostrar uma **tela de splash/loading** enquanto `isLoading` é `true`, antes de renderizar qualquer conteúdo do formulário. Só quando a verificação de sessão terminar:
- Se tem usuário → redireciona para `/painel` (sem nunca mostrar o form)
- Se não tem → mostra o formulário de login normalmente

## Alteração

**Arquivo: `src/pages/Auth.tsx`**

Adicionar um early return logo após o hook `useAuth`, antes de qualquer renderização do formulário:

```tsx
const { user, isLoading } = useAuth();
const navigate = useNavigate();

useEffect(() => {
  if (!isLoading && user) {
    navigate("/painel", { replace: true });
  }
}, [user, isLoading, navigate]);

// Enquanto verifica sessão, mostra apenas o logo com spinner
if (isLoading || user) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <img src={discoveryLogo} alt="Discovery" className="h-12 mb-6" />
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
```

A condição `isLoading || user` garante que:
- Durante o carregamento → mostra splash
- Após confirmar que tem usuário (mas antes do redirect completar) → continua mostrando splash
- Sem usuário → renderiza o form normalmente

Nenhuma outra alteração necessária. A mudança é mínima e isolada ao componente `Auth`.

