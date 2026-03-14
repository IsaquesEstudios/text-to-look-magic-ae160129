import { Layout } from "@/components/layout/Layout";

export default function RiskDisclosure() {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Aviso de Risco e Isenção de Responsabilidade</h1>
        <p className="text-sm text-muted-foreground mb-8">Última atualização: 14 de março de 2026 · Versão 1.0</p>

        <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20 mb-8">
          <p className="text-sm text-foreground font-medium">LEIA ESTE AVISO ATENTAMENTE. Ele contém informações importantes sobre os riscos associados aos investimentos imobiliários oferecidos pela Discovery Investimentos LLC.</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Finalidade deste Documento</h2>
            <p>Este Aviso é emitido pela Discovery Investimentos LLC com o objetivo de informar os usuários sobre os riscos inerentes a investimentos imobiliários do tipo flipping, bem como delimitar a responsabilidade da Discovery.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Natureza dos Investimentos</h2>
            <p>A Discovery opera no mercado de flipping imobiliário — aquisição de imóveis por meio de leilões, com posterior valorização e revenda. Esta estratégia:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>É uma atividade de investimento de médio a alto risco</li>
              <li>Envolve capital imobilizado por períodos de 4 a 6 meses (ou mais)</li>
              <li>Está sujeita a flutuações do mercado imobiliário norte-americano</li>
              <li>Não é regulada como gestão de valores mobiliários ou fundo de investimento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Status Regulatório</h2>
            <p>A Discovery Investimentos LLC declara que:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Não é registrada como Investment Advisor junto à SEC</li>
              <li>Não é licenciada como instituição financeira, banco ou corretora</li>
              <li>Não é membro da FINRA nem da SIPC</li>
              <li>Os recursos dos Usuários não são protegidos pelo FDIC</li>
            </ul>
            <p className="mt-2 p-3 bg-accent/10 rounded-lg border border-accent/20">Recomendamos fortemente que o Usuário consulte um assessor financeiro independente e licenciado antes de realizar qualquer aporte.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Riscos Específicos</h2>

            <h3 className="text-lg font-medium text-foreground">4.1 Risco de Mercado</h3>
            <p>O mercado imobiliário está sujeito a ciclos econômicos, variações de taxas de juros e crises econômicas que podem reduzir significativamente o valor dos ativos.</p>

            <h3 className="text-lg font-medium text-foreground mt-4">4.2 Risco de Liquidez</h3>
            <p>Imóveis são ativos ilíquidos por natureza. Não há garantia de que o imóvel será vendido dentro do prazo estimado, nem pelo preço esperado.</p>

            <h3 className="text-lg font-medium text-foreground mt-4">4.3 Risco Operacional</h3>
            <p>Reformas podem incorrer em custos superiores ao orçado, problemas estruturais não previstos, atrasos em licenças ou dificuldades com mão de obra.</p>

            <h3 className="text-lg font-medium text-foreground mt-4">4.4 Risco Legal e Regulatório</h3>
            <p>A aquisição em leilão pode envolver disputas legais, dívidas, restrições de zoneamento, questões ambientais ou litígios com anteriores proprietários.</p>

            <h3 className="text-lg font-medium text-foreground mt-4">4.5 Risco de Câmbio</h3>
            <p>Para Usuários fora dos EUA, variações cambiais entre o USD e a moeda local podem reduzir ou ampliar o retorno efetivo.</p>

            <h3 className="text-lg font-medium text-foreground mt-4">4.6 Risco de Perda de Capital</h3>
            <p>Existe a possibilidade de perda parcial ou total do capital investido. O Usuário deve estar financeiramente preparado para suportar essa perda.</p>

            <h3 className="text-lg font-medium text-foreground mt-4">4.7 Risco de Concentração</h3>
            <p>Os recursos podem estar concentrados em um único ativo imobiliário, sem diversificação, o que amplifica os riscos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Ausência de Garantias</h2>
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20 space-y-1">
              <p>A Discovery Investimentos LLC declara expressamente que:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong className="text-foreground">NÃO</strong> garante retorno mínimo sobre qualquer investimento</li>
                <li><strong className="text-foreground">NÃO</strong> garante a devolução integral do capital aportado</li>
                <li><strong className="text-foreground">NÃO</strong> garante que os prazos estimados serão cumpridos</li>
                <li><strong className="text-foreground">NÃO</strong> presta aconselhamento de investimento personalizado</li>
                <li>Resultados históricos <strong className="text-foreground">NÃO</strong> constituem garantia de resultados futuros</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Perfil do Investidor</h2>
            <p>A Plataforma é adequada apenas para Usuários que:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Possuem capacidade financeira para manter o capital imobilizado</li>
              <li>Compreendem e aceitam os riscos inerentes</li>
              <li>Não dependem dos recursos para despesas essenciais</li>
              <li>Têm tolerância a perdas parciais ou totais</li>
              <li>Têm 18 anos ou mais e capacidade legal plena</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Limitação de Responsabilidade</h2>
            <p>A Discovery Investimentos LLC, seus sócios, diretores, funcionários e agentes não serão responsáveis por perdas financeiras decorrentes de flutuações de mercado, atrasos, resultados inferiores às estimativas, decisões baseadas em desempenho histórico ou danos indiretos de qualquer natureza.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Declaração do Usuário</h2>
            <p>Ao utilizar a Plataforma e realizar aportes, o Usuário declara que:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Leu e compreendeu integralmente este Aviso de Risco</li>
              <li>Aceita todos os riscos descritos neste documento</li>
              <li>Não está sendo coagido ou induzido a investir</li>
              <li>Os recursos aportados são de sua livre disponibilidade</li>
              <li>Compreende que a Discovery não é uma instituição financeira regulada</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Contato e Dúvidas</h2>
            <p>E-mail: contato@discoveryinvestimentos.com</p>
            <p>Website: discoveryinvestimentos.com</p>
            <p className="mt-2 text-xs">Data de emissão: 14 de março de 2026</p>
            <p className="mt-2 text-xs">Este Aviso é parte integrante dos Termos de Uso e deve ser lido em conjunto com a Política de Privacidade, a Política de Cookies e a Política de Reembolso.</p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
