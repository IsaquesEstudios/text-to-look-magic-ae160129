import { Layout } from "@/components/layout/Layout";
import { useTranslation } from "@/hooks/useTranslation";

export default function PrivacyPolicy() {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground mb-8">Última atualização: 14 de março de 2026 · Versão 1.0</p>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Apresentação</h2>
            <p>A Discovery Investimentos LLC, pessoa jurídica registrada no Estado de New York, EUA, opera a plataforma digital de investimentos imobiliários acessível pelo website discoveryinvestimentos.com e pelo aplicativo móvel Discovery Investimentos (doravante denominados conjuntamente como "Plataforma").</p>
            <p>Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos, compartilhamos e protegemos as informações pessoais dos nossos usuários. Ao se cadastrar ou utilizar a Plataforma, você declara ter lido, compreendido e concordado com os termos desta Política.</p>
            <p>Esta Política está em conformidade com a Lei Geral de Proteção de Dados (LGPD – Lei 13.709/2018), com o Regulamento Geral sobre a Proteção de Dados da União Europeia (GDPR) e com as leis de privacidade do Estado de Nova York, EUA.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Dados Coletados</h2>
            <h3 className="text-lg font-medium text-foreground">2.1 Dados fornecidos diretamente pelo usuário</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nome completo</li>
              <li>Endereço de e-mail</li>
              <li>Número de telefone / WhatsApp</li>
              <li>Endereço residencial completo (logradouro, cidade, estado, CEP/ZIP, país)</li>
              <li>Documento de identidade (CPF, RG, passaporte ou equivalente)</li>
              <li>Informações de contato emergencial</li>
            </ul>
            <h3 className="text-lg font-medium text-foreground mt-4">2.2 Dados coletados automaticamente</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Endereço IP e informações de conexão</li>
              <li>Tipo e versão do dispositivo e sistema operacional</li>
              <li>Dados de uso da Plataforma (páginas acessadas, tempo de sessão, cliques)</li>
              <li>Localização aproximada baseada no IP (não coletamos GPS)</li>
              <li>Cookies e identificadores de sessão</li>
            </ul>
            <h3 className="text-lg font-medium text-foreground mt-4">2.3 Dados financeiros e de investimento</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Valores depositados e histórico de créditos na conta do usuário</li>
              <li>Participações em leilões de imóveis</li>
              <li>Histórico de transações dentro da Plataforma</li>
            </ul>
            <p className="mt-2"><strong className="text-foreground">Importante:</strong> a Discovery Investimentos LLC não armazena dados de cartão de crédito, conta bancária ou outros instrumentos de pagamento.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Finalidade do Tratamento de Dados</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Criação, gerenciamento e autenticação de conta de usuário</li>
              <li>Prestação dos serviços de organização e gestão de investimentos imobiliários</li>
              <li>Comunicação sobre leilões disponíveis, atualizações e retornos</li>
              <li>Cumprimento de obrigações legais, regulatórias e contratuais</li>
              <li>Prevenção a fraudes, lavagem de dinheiro e outras atividades ilícitas (KYC/AML)</li>
              <li>Melhoria contínua da Plataforma e dos serviços oferecidos</li>
              <li>Envio de notificações relevantes ao investimento do usuário</li>
              <li>Suporte ao cliente e resolução de disputas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Base Legal para o Tratamento</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Execução de contrato:</strong> necessário para a prestação dos serviços contratados</li>
              <li><strong className="text-foreground">Consentimento:</strong> para comunicações de marketing e uso de cookies não essenciais</li>
              <li><strong className="text-foreground">Legítimo interesse:</strong> para melhorias da Plataforma e segurança da informação</li>
              <li><strong className="text-foreground">Obrigação legal:</strong> para cumprimento de normas regulatórias e fiscais</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Compartilhamento de Dados</h2>
            <p>A Discovery Investimentos LLC não vende, aluga ou comercializa seus dados pessoais. Podemos compartilhar informações nas seguintes situações:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Prestadores de serviços tecnológicos (hospedagem, infraestrutura de nuvem, segurança)</li>
              <li>Autoridades governamentais, judiciais ou regulatórias, quando exigido por lei</li>
              <li>Parceiros de negócio envolvidos nos processos de leilão imobiliário, sob acordos de confidencialidade</li>
              <li>Em caso de fusão, aquisição ou reestruturação societária, com notificação prévia ao usuário</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Armazenamento e Segurança</h2>
            <p>Seus dados são armazenados em servidores seguros localizados nos Estados Unidos da América. Adotamos as seguintes medidas:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Criptografia de dados em trânsito (TLS/SSL) e em repouso (AES-256)</li>
              <li>Controle de acesso baseado em função (RBAC)</li>
              <li>Autenticação de dois fatores (2FA) para administradores</li>
              <li>Monitoramento contínuo e auditoria de acessos</li>
              <li>Backups regulares com procedimentos de recuperação de desastres</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Transferência Internacional de Dados</h2>
            <p>Sendo a Discovery Investimentos LLC uma empresa norte-americana com usuários internacionais, seus dados podem ser transferidos e processados nos Estados Unidos da América. Adotamos salvaguardas contratuais adequadas para proteger seus dados em conformidade com as legislações aplicáveis.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Direitos do Usuário</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Acesso:</strong> solicitar cópia de todos os dados pessoais que mantemos sobre você</li>
              <li><strong className="text-foreground">Correção:</strong> solicitar a correção de dados incompletos, inexatos ou desatualizados</li>
              <li><strong className="text-foreground">Exclusão:</strong> solicitar a eliminação de seus dados, respeitados os prazos legais</li>
              <li><strong className="text-foreground">Portabilidade:</strong> receber seus dados em formato estruturado e legível</li>
              <li><strong className="text-foreground">Oposição:</strong> opor-se ao tratamento baseado em legítimo interesse</li>
              <li><strong className="text-foreground">Revogação de consentimento:</strong> retirar o consentimento a qualquer momento</li>
            </ul>
            <p className="mt-2">Para exercer qualquer destes direitos, entre em contato: contato@discoveryinvestimentos.com</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Cookies</h2>
            <p>Utilizamos cookies e tecnologias similares para melhorar sua experiência na Plataforma. Para informações detalhadas, consulte nossa Política de Cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Menores de Idade</h2>
            <p>A Plataforma é destinada exclusivamente a pessoas com 18 anos ou mais. Não coletamos intencionalmente dados de menores de idade.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">11. Alterações nesta Política</h2>
            <p>A Discovery Investimentos LLC reserva-se o direito de atualizar esta Política a qualquer momento. Alterações significativas serão comunicadas por e-mail e/ou notificação no aplicativo com antecedência mínima de 15 dias.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">12. Contato e Encarregado de Dados (DPO)</h2>
            <p>E-mail: contato@discoveryinvestimentos.com</p>
            <p>Website: discoveryinvestimentos.com</p>
            <p>Endereço: Discovery Investimentos LLC – New York, EUA</p>
            <p className="mt-2">Usuários brasileiros também podem apresentar reclamações à Autoridade Nacional de Proteção de Dados (ANPD) por meio do portal gov.br/anpd.</p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
