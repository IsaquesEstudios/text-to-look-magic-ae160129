import { Layout } from "@/components/layout/Layout";

export default function TermsOfUse() {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground mb-8">Última atualização: 14 de março de 2026 · Versão 1.0</p>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Aceitação dos Termos</h2>
            <p>Estes Termos de Uso constituem um contrato legalmente vinculante entre você ("Usuário") e a Discovery Investimentos LLC, empresa registrada no Estado de New York, EUA. Ao criar uma conta, acessar ou utilizar o aplicativo e/ou website da Discovery Investimentos, você declara ter lido, compreendido e concordado com todos os termos aqui estabelecidos, bem como com nossa Política de Privacidade.</p>
            <p>Se você não concordar com estes Termos, interrompa imediatamente o uso da Plataforma e não realize qualquer cadastro ou aporte financeiro.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Definições</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Plataforma:</strong> o aplicativo móvel e o website discoveryinvestimentos.com</li>
              <li><strong className="text-foreground">Usuário:</strong> pessoa física maior de 18 anos que se cadastra e utiliza a Plataforma</li>
              <li><strong className="text-foreground">Administrador:</strong> a Discovery Investimentos LLC</li>
              <li><strong className="text-foreground">Créditos:</strong> unidade de valor interno exibida na conta do Usuário</li>
              <li><strong className="text-foreground">Leilão:</strong> processo de aquisição de imóveis coordenado pela Discovery</li>
              <li><strong className="text-foreground">Flipping:</strong> estratégia de compra, reforma/valorização e revenda de imóveis</li>
              <li><strong className="text-foreground">Aporte:</strong> transferência financeira realizada pelo Usuário para a conta bancária da Discovery</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Descrição dos Serviços</h2>
            <p>A Discovery Investimentos LLC oferece uma plataforma de organização e gestão de investimentos imobiliários. Os serviços incluem:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Cadastro e gerenciamento de conta de investidor</li>
              <li>Divulgação de leilões de imóveis disponíveis</li>
              <li>Visualização de informações sobre imóveis</li>
              <li>Acompanhamento do saldo de créditos</li>
              <li>Canal de comunicação entre Usuário e Administrador</li>
            </ul>
            <p className="mt-2">A Plataforma é uma ferramenta de organização e comunicação. Todo aporte financeiro é realizado fora da Plataforma, diretamente para a conta bancária da Discovery Investimentos LLC.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Elegibilidade e Cadastro</h2>
            <p>Para utilizar a Plataforma, o Usuário deve:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Ter no mínimo 18 anos de idade</li>
              <li>Possuir capacidade legal plena para celebrar contratos</li>
              <li>Fornecer informações verdadeiras, completas e atualizadas</li>
              <li>Manter a confidencialidade de suas credenciais de acesso</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Processo de Investimento</h2>
            <h3 className="text-lg font-medium text-foreground">5.1 Aportes Financeiros</h3>
            <p>O Usuário pode realizar aportes financeiros à Discovery Investimentos LLC por meio dos canais de pagamento informados diretamente pelo Administrador. Após a confirmação do recebimento, o valor correspondente em Créditos será registrado na conta do Usuário.</p>
            <p className="mt-2"><strong className="text-foreground">Atenção:</strong> o saldo em Créditos na Plataforma é uma representação contábil interna, sem valor monetário independente.</p>

            <h3 className="text-lg font-medium text-foreground mt-4">5.2 Leilões e Imóveis</h3>
            <p>O Administrador cadastrará periodicamente oportunidades de leilões de imóveis na Plataforma. A decisão final sobre qual leilão os recursos serão alocados é de competência exclusiva do Administrador.</p>

            <h3 className="text-lg font-medium text-foreground mt-4">5.3 Prazos Estimados de Retorno</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Casas residenciais:</strong> estimativa de ~6 meses</li>
              <li><strong className="text-foreground">Terrenos:</strong> estimativa de ~4 meses</li>
            </ul>
            <p className="mt-2 p-3 bg-accent/10 rounded-lg border border-accent/20"><strong className="text-foreground">IMPORTANTE:</strong> Os prazos acima são meramente estimativos e não constituem garantia de prazo ou de retorno financeiro.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Riscos do Investimento</h2>
            <p>O Usuário declara estar ciente dos riscos incluindo:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Risco de mercado: variação nos preços de imóveis</li>
              <li>Risco de liquidez: impossibilidade de resgatar antes do prazo</li>
              <li>Risco operacional: atrasos em reformas, processos legais</li>
              <li>Risco regulatório: mudanças na legislação</li>
              <li>Risco de perda parcial ou total do capital investido</li>
            </ul>
            <p className="mt-2">A Discovery Investimentos LLC não garante rentabilidade mínima. O desempenho passado não é garantia de resultados futuros.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Conduta do Usuário</h2>
            <p>O Usuário compromete-se a fornecer apenas informações verdadeiras, não utilizar a Plataforma para fins ilegais, não tentar acessar contas de outros usuários e não praticar lavagem de dinheiro ou qualquer atividade ilícita.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Idiomas da Plataforma</h2>
            <p>A Plataforma está disponível em Inglês, Espanhol e Português Brasileiro. Em caso de divergência, prevalecerá a versão em Inglês.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Limitação de Responsabilidade</h2>
            <p>A Discovery Investimentos LLC não se responsabiliza por perdas resultantes de decisões de investimento, interrupções temporárias, atos de terceiros, variações de câmbio ou atrasos causados por fatores externos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Propriedade Intelectual</h2>
            <p>Todo o conteúdo da Plataforma é de propriedade exclusiva da Discovery Investimentos LLC e está protegido pelas leis de propriedade intelectual aplicáveis.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">11. Encerramento de Conta</h2>
            <p>O Usuário pode solicitar o encerramento de sua conta pelo e-mail contato@discoveryinvestimentos.com. O encerramento não afeta investimentos em andamento.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">12. Lei Aplicável e Foro</h2>
            <p>Estes Termos são regidos pelas leis do Estado de New York, EUA. Fica eleito o foro da Comarca de Nova York como competente para dirimir quaisquer controvérsias.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">13. Alterações dos Termos</h2>
            <p>A Discovery reserva-se o direito de modificar estes Termos a qualquer tempo, com notificação mínima de 15 dias.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">14. Contato</h2>
            <p>E-mail: contato@discoveryinvestimentos.com</p>
            <p>Website: discoveryinvestimentos.com</p>
            <p>Endereço: Discovery Investimentos LLC – New York, EUA</p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
