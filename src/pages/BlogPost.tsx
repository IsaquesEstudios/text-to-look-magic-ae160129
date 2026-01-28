import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Tag, User, Clock, Share2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { CTASection } from "@/components/sections/CTASection";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import cityscape from "@/assets/cityscape.jpg";
import { useEffect } from "react";

// Fake content for articles (will be replaced with real content later)
const fakeArticleContent = {
  pt: {
    author: "Equipe Discovery",
    readTime: "8 min de leitura",
    content: `
      <p class="lead">O mercado imobiliário americano oferece oportunidades únicas para investidores internacionais. Neste guia completo, vamos explorar as principais estratégias e considerações para quem deseja começar a investir em propriedades nos Estados Unidos.</p>
      
      <h2>Por que investir em imóveis nos EUA?</h2>
      <p>Os Estados Unidos possuem um dos mercados imobiliários mais estáveis e transparentes do mundo. Com uma economia diversificada e um sistema legal robusto que protege os direitos de propriedade, o país atrai investidores de todas as partes do globo.</p>
      <p>Além disso, a possibilidade de obter renda passiva em dólar e a valorização histórica dos imóveis tornam esse tipo de investimento particularmente atraente para brasileiros que buscam diversificar seu patrimônio.</p>
      
      <h2>Principais modalidades de investimento</h2>
      <p>Existem diversas formas de investir em imóveis nos Estados Unidos, cada uma com suas características e níveis de retorno:</p>
      <ul>
        <li><strong>House Flipping:</strong> Compra de imóveis para reforma e revenda rápida, com potencial de retorno entre 15% e 30%.</li>
        <li><strong>Leilões de Terrenos:</strong> Aquisição de terrenos em leilões judiciais com descontos significativos sobre o valor de mercado.</li>
        <li><strong>Aluguel de Longo Prazo:</strong> Investimento focado em renda passiva mensal através de locação.</li>
        <li><strong>Vacation Rentals:</strong> Propriedades para aluguel de temporada em regiões turísticas.</li>
      </ul>
      
      <h2>O processo de investimento</h2>
      <p>Investir em imóveis nos EUA como estrangeiro envolve algumas etapas importantes:</p>
      <ol>
        <li><strong>Abertura de conta bancária:</strong> Necessário para movimentação financeira no país.</li>
        <li><strong>Obtenção do ITIN:</strong> Número de identificação fiscal para não-residentes.</li>
        <li><strong>Estruturação societária:</strong> Criação de LLC para proteção patrimonial.</li>
        <li><strong>Due diligence:</strong> Análise detalhada da propriedade e mercado local.</li>
        <li><strong>Fechamento do negócio:</strong> Processo de closing com title company.</li>
      </ol>
      
      <h2>Aspectos tributários</h2>
      <p>É fundamental entender as obrigações fiscais tanto nos EUA quanto no Brasil. A renda obtida com imóveis americanos está sujeita à tributação nos Estados Unidos, mas existem tratados que evitam a bitributação.</p>
      <p>Recomendamos sempre contar com assessoria especializada para garantir conformidade com todas as regulamentações aplicáveis.</p>
      
      <h2>Conclusão</h2>
      <p>Investir em imóveis nos Estados Unidos pode ser uma excelente estratégia de diversificação e proteção patrimonial. Com o parceiro certo e conhecimento adequado do mercado, é possível obter retornos consistentes e construir um portfólio sólido de propriedades no exterior.</p>
      <p>A Discovery Investments está pronta para guiá-lo em cada etapa dessa jornada, oferecendo expertise local e suporte completo para investidores brasileiros.</p>
    `,
  },
  en: {
    author: "Discovery Team",
    readTime: "8 min read",
    content: `
      <p class="lead">The American real estate market offers unique opportunities for international investors. In this comprehensive guide, we'll explore the main strategies and considerations for those looking to start investing in properties in the United States.</p>
      
      <h2>Why invest in US real estate?</h2>
      <p>The United States has one of the most stable and transparent real estate markets in the world. With a diversified economy and a robust legal system that protects property rights, the country attracts investors from all over the globe.</p>
      <p>Additionally, the possibility of obtaining passive income in dollars and the historical appreciation of properties make this type of investment particularly attractive for international investors seeking to diversify their assets.</p>
      
      <h2>Main investment modalities</h2>
      <p>There are several ways to invest in real estate in the United States, each with its own characteristics and return levels:</p>
      <ul>
        <li><strong>House Flipping:</strong> Purchasing properties for renovation and quick resale, with potential returns between 15% and 30%.</li>
        <li><strong>Land Auctions:</strong> Acquiring land at judicial auctions with significant discounts on market value.</li>
        <li><strong>Long-term Rentals:</strong> Investment focused on monthly passive income through leasing.</li>
        <li><strong>Vacation Rentals:</strong> Properties for seasonal rental in tourist regions.</li>
      </ul>
      
      <h2>The investment process</h2>
      <p>Investing in US real estate as a foreigner involves some important steps:</p>
      <ol>
        <li><strong>Opening a bank account:</strong> Required for financial transactions in the country.</li>
        <li><strong>Obtaining an ITIN:</strong> Tax identification number for non-residents.</li>
        <li><strong>Corporate structuring:</strong> Creating an LLC for asset protection.</li>
        <li><strong>Due diligence:</strong> Detailed analysis of the property and local market.</li>
        <li><strong>Closing the deal:</strong> Closing process with a title company.</li>
      </ol>
      
      <h2>Tax aspects</h2>
      <p>It's essential to understand tax obligations in both the US and your home country. Income from American properties is subject to taxation in the United States, but there are treaties that avoid double taxation.</p>
      <p>We always recommend having specialized advice to ensure compliance with all applicable regulations.</p>
      
      <h2>Conclusion</h2>
      <p>Investing in real estate in the United States can be an excellent strategy for diversification and asset protection. With the right partner and adequate market knowledge, it's possible to obtain consistent returns and build a solid portfolio of properties abroad.</p>
      <p>Discovery Investments is ready to guide you through every step of this journey, offering local expertise and complete support for international investors.</p>
    `,
  },
  es: {
    author: "Equipo Discovery",
    readTime: "8 min de lectura",
    content: `
      <p class="lead">El mercado inmobiliario estadounidense ofrece oportunidades únicas para inversores internacionales. En esta guía completa, exploraremos las principales estrategias y consideraciones para quienes desean comenzar a invertir en propiedades en Estados Unidos.</p>
      
      <h2>¿Por qué invertir en inmuebles en EE.UU.?</h2>
      <p>Estados Unidos tiene uno de los mercados inmobiliarios más estables y transparentes del mundo. Con una economía diversificada y un sistema legal robusto que protege los derechos de propiedad, el país atrae inversores de todas partes del mundo.</p>
      <p>Además, la posibilidad de obtener ingresos pasivos en dólares y la valorización histórica de los inmuebles hacen que este tipo de inversión sea particularmente atractivo para inversores internacionales que buscan diversificar su patrimonio.</p>
      
      <h2>Principales modalidades de inversión</h2>
      <p>Existen diversas formas de invertir en inmuebles en Estados Unidos, cada una con sus características y niveles de retorno:</p>
      <ul>
        <li><strong>House Flipping:</strong> Compra de inmuebles para reforma y reventa rápida, con potencial de retorno entre 15% y 30%.</li>
        <li><strong>Subastas de Terrenos:</strong> Adquisición de terrenos en subastas judiciales con descuentos significativos sobre el valor de mercado.</li>
        <li><strong>Alquiler a Largo Plazo:</strong> Inversión enfocada en ingresos pasivos mensuales a través de arrendamiento.</li>
        <li><strong>Alquileres Vacacionales:</strong> Propiedades para alquiler de temporada en regiones turísticas.</li>
      </ul>
      
      <h2>El proceso de inversión</h2>
      <p>Invertir en inmuebles en EE.UU. como extranjero implica algunos pasos importantes:</p>
      <ol>
        <li><strong>Apertura de cuenta bancaria:</strong> Necesario para movimientos financieros en el país.</li>
        <li><strong>Obtención del ITIN:</strong> Número de identificación fiscal para no residentes.</li>
        <li><strong>Estructuración societaria:</strong> Creación de LLC para protección patrimonial.</li>
        <li><strong>Due diligence:</strong> Análisis detallado de la propiedad y mercado local.</li>
        <li><strong>Cierre del negocio:</strong> Proceso de closing con title company.</li>
      </ol>
      
      <h2>Aspectos tributarios</h2>
      <p>Es fundamental entender las obligaciones fiscales tanto en EE.UU. como en su país de origen. Los ingresos obtenidos con inmuebles estadounidenses están sujetos a tributación en Estados Unidos, pero existen tratados que evitan la doble tributación.</p>
      <p>Siempre recomendamos contar con asesoría especializada para garantizar el cumplimiento de todas las regulaciones aplicables.</p>
      
      <h2>Conclusión</h2>
      <p>Invertir en inmuebles en Estados Unidos puede ser una excelente estrategia de diversificación y protección patrimonial. Con el socio adecuado y conocimiento apropiado del mercado, es posible obtener retornos consistentes y construir un portafolio sólido de propiedades en el exterior.</p>
      <p>Discovery Investments está lista para guiarlo en cada etapa de este viaje, ofreciendo experiencia local y soporte completo para inversores internacionales.</p>
    `,
  },
};

const BlogPost = () => {
  const { t, lang } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Find the post by slug
  const post = t.blog.posts.find((p) => p.slug === slug);

  useEffect(() => {
    if (!post) {
      navigate(`/${lang}/blog`, { replace: true });
    }
  }, [post, navigate, lang]);

  if (!post) {
    return null;
  }

  const articleContent = fakeArticleContent[lang as keyof typeof fakeArticleContent];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="section-graphite pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={cityscape}
            alt={post.title}
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/60" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            {/* Breadcrumb */}
            <Breadcrumb className="mb-8">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={`/${lang}`} className="text-muted-foreground hover:text-foreground">
                      Home
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={`/${lang}/blog`} className="text-muted-foreground hover:text-foreground">
                      Blog
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-foreground/80 line-clamp-1 max-w-[200px]">
                    {post.title}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Category */}
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-discovery-green text-primary-foreground text-xs font-semibold rounded-full mb-4">
              <Tag size={12} />
              {post.category}
            </span>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
              <span className="inline-flex items-center gap-2">
                <User size={16} />
                {articleContent.author}
              </span>
              <span className="inline-flex items-center gap-2">
                <Calendar size={16} />
                {post.date}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock size={16} />
                {articleContent.readTime}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Article Content */}
      <section className="section-light py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex gap-12"
            >
              {/* Main Content */}
              <article className="flex-1">
                {/* Featured Image */}
                <div className="relative rounded-2xl overflow-hidden mb-10 aspect-video">
                  <img
                    src={cityscape}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Article Body */}
                <div
                  className="prose prose-lg max-w-none
                    prose-headings:text-discovery-dark prose-headings:font-bold prose-headings:mt-10 prose-headings:mb-4
                    prose-p:text-discovery-text prose-p:leading-relaxed prose-p:mb-4
                    prose-a:text-discovery-green prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-discovery-dark
                    prose-ul:my-4 prose-ul:pl-6 prose-li:text-discovery-text prose-li:mb-2
                    prose-ol:my-4 prose-ol:pl-6
                    [&_.lead]:text-xl [&_.lead]:text-discovery-text/80 [&_.lead]:leading-relaxed [&_.lead]:mb-8 [&_.lead]:font-medium
                  "
                  dangerouslySetInnerHTML={{ __html: articleContent.content }}
                />

                {/* Share Section */}
                <div className="mt-12 pt-8 border-t border-discovery-green/10">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-discovery-text font-medium">
                        {lang === "pt" ? "Compartilhar:" : lang === "es" ? "Compartir:" : "Share:"}
                      </span>
                      <Button variant="outline" size="icon" className="rounded-full">
                        <Share2 size={18} />
                      </Button>
                    </div>
                    <Link to={`/${lang}/blog`}>
                      <Button variant="outline" className="gap-2">
                        <ArrowLeft size={18} />
                        {lang === "pt" ? "Voltar ao Blog" : lang === "es" ? "Volver al Blog" : "Back to Blog"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </article>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      <section className="section-graphite py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              {lang === "pt" ? "Artigos Relacionados" : lang === "es" ? "Artículos Relacionados" : "Related Articles"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {t.blog.posts
                .filter((p) => p.slug !== slug)
                .slice(0, 2)
                .map((relatedPost, index) => (
                  <motion.article
                    key={relatedPost.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-xl overflow-hidden border border-border hover:border-discovery-green/30 transition-all group"
                  >
                    <Link to={`/${lang}/blog/${relatedPost.slug}`} className="flex gap-4 p-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={cityscape}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-discovery-green font-medium">
                          {relatedPost.category}
                        </span>
                        <h3 className="text-sm font-semibold text-card-foreground mt-1 line-clamp-2 group-hover:text-discovery-green transition-colors">
                          {relatedPost.title}
                        </h3>
                        <span className="text-xs text-muted-foreground mt-2 block">
                          {relatedPost.date}
                        </span>
                      </div>
                    </Link>
                  </motion.article>
                ))}
            </div>
          </div>
        </div>
      </section>

      <CTASection
        title={t.home.cta.title}
        description={t.home.cta.description}
        ctaText={t.home.cta.button}
      />
    </Layout>
  );
};

export default BlogPost;
