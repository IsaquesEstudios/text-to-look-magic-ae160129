import { Layout } from "@/components/layout/Layout";

export default function CookiePolicy() {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Política de Cookies</h1>
        <p className="text-sm text-muted-foreground mb-8">Última atualização: 14 de março de 2026 · Versão 1.0</p>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. O que são Cookies?</h2>
            <p>Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você acessa um website ou aplicativo. Eles permitem que a Plataforma reconheça seu dispositivo em visitas futuras, melhore sua experiência e forneça funcionalidades personalizadas.</p>
            <p>Além de cookies tradicionais, também podemos utilizar tecnologias similares, como web beacons, pixels, armazenamento local (localStorage/sessionStorage) e identificadores de dispositivo móvel.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Tipos de Cookies Utilizados</h2>

            <h3 className="text-lg font-medium text-foreground">2.1 Cookies Estritamente Necessários</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Cookies de sessão: mantêm você autenticado durante a navegação</li>
              <li>Cookies de segurança: protegem contra ataques CSRF e fraudes</li>
              <li>Cookies de preferência de idioma: armazenam o idioma selecionado</li>
            </ul>
            <p className="mt-1 text-xs">Base legal: necessários para a execução do contrato. Não requerem consentimento.</p>

            <h3 className="text-lg font-medium text-foreground mt-4">2.2 Cookies de Desempenho e Análise</h3>
            <p>Utilizamos ferramentas de análise para compreender como os usuários interagem com a Plataforma, coletando informações de forma anonimizada e agregada.</p>
            <p className="mt-1 text-xs">Base legal: consentimento do usuário.</p>

            <h3 className="text-lg font-medium text-foreground mt-4">2.3 Cookies Funcionais</h3>
            <p>Permitem que a Plataforma se lembre de suas escolhas, como preferências de exibição, configurações de notificação e dados de formulários preenchidos parcialmente.</p>

            <h3 className="text-lg font-medium text-foreground mt-4">2.4 Cookies de Terceiros</h3>
            <p>Alguns serviços integrados à Plataforma podem definir seus próprios cookies, incluindo serviços de análise, suporte ao cliente e plataformas de autenticação. A Discovery não controla cookies de terceiros.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Duração dos Cookies</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">De sessão:</strong> excluídos automaticamente ao fechar o navegador</li>
              <li><strong className="text-foreground">Persistentes:</strong> permanecem no dispositivo por 30 dias a 2 anos, conforme sua finalidade</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Gerenciamento e Controle de Cookies</h2>
            <h3 className="text-lg font-medium text-foreground">4.1 Configurações da Plataforma</h3>
            <p>Ao acessar a Plataforma pela primeira vez, será exibido um banner de consentimento onde você pode aceitar, recusar ou personalizar as categorias de cookies não essenciais.</p>

            <h3 className="text-lg font-medium text-foreground mt-4">4.2 Configurações do Navegador</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Google Chrome: Configurações {">"} Privacidade e segurança {">"} Cookies</li>
              <li>Mozilla Firefox: Preferências {">"} Privacidade e Segurança</li>
              <li>Safari: Preferências {">"} Privacidade</li>
              <li>Microsoft Edge: Configurações {">"} Cookies e permissões do site</li>
            </ul>
            <p className="mt-2 p-3 bg-accent/10 rounded-lg border border-accent/20"><strong className="text-foreground">Atenção:</strong> desativar cookies essenciais pode comprometer o funcionamento da Plataforma.</p>

            <h3 className="text-lg font-medium text-foreground mt-4">4.3 Dispositivos Móveis</h3>
            <p>Em dispositivos móveis, você pode redefinir o identificador de publicidade nas configurações de privacidade do iOS ou Android.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Alterações nesta Política</h2>
            <p>Esta Política de Cookies pode ser atualizada periodicamente. A data da última atualização estará sempre indicada no topo do documento.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Contato</h2>
            <p>E-mail: contato@discoveryinvestimentos.com</p>
            <p>Website: discoveryinvestimentos.com</p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
