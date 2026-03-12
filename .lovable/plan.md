
Objetivo: explicar por que o erro continuou na VPS mesmo após você “descartar o local” e definir o caminho de correção.

1) O que está acontecendo
- Você tinha dois problemas diferentes:
  - Git local fora de sincronia (já tratado ao descartar/resetar).
  - Build da VPS falhando (independente do seu estado local).
- No código atual, existe inconsistência real entre `package.json` e `package-lock.json`:
  - `package.json` contém `@capacitor/android`, `@capacitor/core`, `@capacitor/ios`
  - `package-lock.json` não contém esses pacotes
- Como o Dockerfile usa `npm ci`, a build na VPS quebra quando lock e package divergem.
- Por isso, “descartar local” não resolve sozinho: a VPS constrói a partir do repositório remoto + cache de build.

2) Plano de correção (ordem exata)
- Sincronizar lockfile com package:
  - Rodar `npm install`
  - Commitar e enviar o novo `package-lock.json`
- Redeploy na VPS com cache limpo (importantíssimo).
- Confirmar que o deploy está usando Dockerfile (não Nixpacks) e Build Args `VITE_*` no painel da VPS.

3) Comandos recomendados
```bash
git fetch origin
git checkout main
git reset --hard origin/main
npm install
git add package-lock.json
git commit -m "fix: sync package-lock with package.json"
git push origin main
```
Depois: na VPS/Coolify, acionar redeploy com “no cache/clear cache”.

4) Plano B (rápido, menos ideal)
- Trocar `npm ci` por `npm install` no Dockerfile para evitar bloqueio por lock divergente.
- Melhor manter como fallback; o ideal é lockfile consistente.

5) Detalhes técnicos
- `npm ci` é estrito e exige paridade total entre manifest (`package.json`) e lock (`package-lock.json`).
- Reset local só afeta sua máquina; não corrige automaticamente lockfile remoto nem cache da pipeline.
