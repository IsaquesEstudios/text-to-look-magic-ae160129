import { Layout } from "@/components/layout/Layout";

export default function RefundPolicy() {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Política de Reembolso e Cancelamento</h1>
        <p className="text-sm text-muted-foreground mb-8">Última atualização: 14 de março de 2026 · Versão 1.0</p>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Introdução</h2>
            <p>Esta Política de Reembolso e Cancelamento estabelece as condições e procedimentos aplicáveis a solicitações de devolução de aportes financeiros realizados por Usuários da plataforma da Discovery Investimentos LLC.</p>
            <p>Por se tratar de uma plataforma de investimento imobiliário, as regras de reembolso diferem de serviços de consumo convencionais.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Natureza dos Aportes Financeiros</h2>
            <p>Os recursos transferidos pelo Usuário têm natureza de aporte de investimento imobiliário. Ao realizar um aporte, o Usuário está:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Comprometendo capital para participação em operações de flipping imobiliário</li>
              <li>Ciente de que os recursos serão imobilizados durante o ciclo do investimento</li>
              <li>Ciente dos prazos estimados: ~6 meses para casas e ~4 meses para terrenos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Período de Reflexão (48 horas)</h2>
            <p>A Discovery oferece um período de reflexão de 48 horas contadas a partir da confirmação do recebimento do aporte. Dentro deste prazo, o Usuário pode solicitar o cancelamento e reembolso integral, desde que:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>O aporte ainda não tenha sido comprometido em um leilão específico</li>
              <li>A solicitação seja realizada formalmente por e-mail dentro do prazo</li>
              <li>O Usuário forneça os dados bancários para a devolução</li>
            </ul>
            <p className="mt-2">Reembolsos dentro da janela de 48 horas serão processados em até 5 dias úteis.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Solicitações Após Início do Investimento</h2>
            <h3 className="text-lg font-medium text-foreground">4.1 Saída Antecipada Consensual</h3>
            <p>O Usuário pode solicitar a saída antecipada mediante negociação com a Discovery. Neste caso:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A Discovery avaliará a possibilidade conforme a fase do investimento</li>
              <li>Poderá haver desconto sobre o valor aportado (haircut)</li>
              <li>A saída antecipada não é garantida</li>
              <li>Prazo de até 30 dias corridos quando aprovado</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-4">4.2 Situações de Reembolso Integral</h3>
            <p>O Usuário terá direito ao reembolso integral (sem penalidade) quando:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A Discovery não alocar o aporte em nenhum leilão dentro de 30 dias</li>
              <li>Encerramento das atividades da Discovery Investimentos LLC</li>
              <li>Descumprimento grave das obrigações contratuais por parte da Discovery</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Resultado do Investimento</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Lucro:</strong> capital inicial + retorno líquido acordado</li>
              <li><strong className="text-foreground">Resultado inferior:</strong> valor efetivamente obtido com a operação</li>
              <li><strong className="text-foreground">Perda total:</strong> situação excepcional decorrente de eventos extraordinários</li>
            </ul>
            <p className="mt-2 p-3 bg-accent/10 rounded-lg border border-accent/20">A Discovery não garante retorno mínimo nem a devolução do capital em caso de perda decorrente de condições de mercado.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Procedimento para Solicitação</h2>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Enviar e-mail para contato@discoveryinvestimentos.com com assunto "Solicitação de Reembolso"</li>
              <li>Informar o valor do aporte, a data e o comprovante</li>
              <li>Indicar os dados bancários para devolução</li>
              <li>Aguardar a análise (resposta em até 5 dias úteis)</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Custos e Taxas</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Taxas bancárias de transferência internacional (quando aplicável)</li>
              <li>Taxa administrativa de saída antecipada (quando aplicável)</li>
              <li>Impostos e encargos tributários eventualmente devidos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Contato</h2>
            <p>E-mail: contato@discoveryinvestimentos.com</p>
            <p>Website: discoveryinvestimentos.com</p>
            <p className="mt-2 text-xs">Data de vigência: 14 de março de 2026</p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
