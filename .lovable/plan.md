# Redesign completo com o design system Dicovery

## Objetivo
Aplicar a identidade do projeto **Dicovery** a todo o aplicativo Discovery Investments, nas áreas do investidor e do administrador, sem alterar funcionalidades, dados ou regras financeiras.

O material enviado é uma biblioteca de fundamentos e componentes, não um conjunto de telas finais. As telas existentes serão reorganizadas com base nessa biblioteca, sem copiar a página de demonstração do design system.

## Direção visual
- Adotar o visual claro da referência, substituindo o tema escuro e os efeitos de vidro atuais.
- Cores: verde institucional **#008C3A**, verde profundo **#0F3D2E**, verde pálido **#E8F4EC**, fundo **#FAFAF8**, superfícies **#FFFFFF**, textos **#1F2937**, textos secundários **#6B7280** e bordas **#E5E8E5**.
- **Poppins** para títulos e números em destaque; **Inter** para textos e controles.
- Espaçamentos em múltiplos de 4 px, cantos de 4–8 px, botões arredondados conforme a referência, bordas discretas e sombras suaves.
- Ícones lineares e transições curtas de aproximadamente 150 ms, respeitando a preferência por movimento reduzido.
- Preservar a logo e as fotografias reais dos imóveis; não substituir dados por exemplos da biblioteca.

## Aplicação nas telas
1. **Base visual e navegação**
   - Padronizar botões, campos, seletores, etiquetas, tabelas, diálogos, avisos e estados de carregamento.
   - Renovar a barra lateral recolhível no computador e a navegação inferior com menu Mais no celular.
   - Manter os destinos atuais e os indicadores de notificações, sem adicionar o cabeçalho superior da página de demonstração.

2. **Acesso e conta**
   - Redesenhar login, cadastro, aprovação pendente, recuperação de senha, perfil e exclusão de conta.
   - Preservar validações, proteção do login e mensagens existentes.

3. **Área do investidor**
   - Aplicar os novos padrões ao painel, projetos, leilões e detalhes, extrato, comprovantes e contratos.
   - Organizar indicadores financeiros com hierarquia clara e fotografias dos projetos em destaque.

4. **Área administrativa**
   - Redesenhar painel, propriedades, leilões, usuários, registros, atividades e configurações.
   - Incluir os formulários e diálogos associados: cadastro/edição, imagens, investidores, despesas e documentos.
   - Preservar as etapas Compra → Reforma → Venda; terrenos continuam sem Reforma.

5. **Acabamento no celular**
   - Manter as etapas verticalmente, botões simétricos e nomes abreviados na seleção de investidores.
   - Ajustar tabelas, valores longos, formulários e diálogos para evitar cortes ou sobreposições.
   - Preservar as áreas de segurança da tela e os controles acessíveis ao toque.

## Limites do trabalho
- Somente mudanças visuais e de apresentação nas telas ativas e seus elementos compartilhados.
- Não modificar saldo, aportes, taxas, cálculos, permissões, aprovação, notificações ou comportamento de conexão.
- Manter valores em USD com formatação en-US, os idiomas existentes e o prefixo Est. nas projeções.
- Não alterar o banco, funções financeiras, arquitetura SPA ou configuração das lojas.
- Não reativar páginas institucionais antigas que não fazem parte da navegação atual.
- Publicação na web e novas versões das lojas ficam fora desta etapa.

## Detalhes técnicos
- Adaptar os tokens da referência para `src/index.css` e `tailwind.config.ts`, mantendo a integração com os componentes atuais em `src/components/ui/`.
- Reaproveitar a aparência dos componentes Dicovery sem substituir contratos de interação, como `asChild`, seletores e diálogos acessíveis.
- Manter React + Vite; não importar a estrutura de rotas TanStack utilizada pela biblioteca de referência.
- Carregar as fontes da referência pelo fluxo de assets do projeto, sem importação remota dentro do CSS.
- Alterar apenas estilos e estrutura de apresentação dos arquivos envolvidos no redesign; manter hooks e operações de dados intactos.

## Verificação
- Executar os testes existentes, incluindo os cálculos das fases de propriedades.
- Conferir as telas em computador e celular, incluindo estados vazios, carregamento, erro e conteúdo longo.
- Validar fluxos com sessões reais de administrador e investidor quando disponíveis: navegação, abertura de propriedade, formulário de edição e visualização de documentos.
- Não realizar operações financeiras reais apenas para testar o visual; verificar formulários sem confirmar alterações.
- Conferir contraste, fontes, imagens, diálogos e ausência de erros antes de concluir; informar qualquer fluxo que não puder ser verificado.

## Resultado esperado
Todo o aplicativo ativo com a identidade clara e consistente do Dicovery, mantendo os processos atuais de investimento e administração.