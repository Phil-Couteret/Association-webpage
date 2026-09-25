
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEO } from "@/components/SEO";

const Contact = () => {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col bg-deep-purple">
      <SEO 
        title="Contact Us | Elektr-Âme"
        description="Get in touch with Elektr-Âme. Contact us for inquiries, collaborations, or questions about our electronic music association in Barcelona."
        url="https://www.elektr-ame.com/contact"
        keywords="contact, Barcelona, electronic music, inquiries, collaboration"
      />
      <Header />
      
      <main className="flex-1 pt-16">
        <section className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white sm:text-5xl">
                {t('contact.title')}
              </h1>
            </div>
            
            <p className="mb-12 text-center text-lg text-white/80">
              {t('contact.description')}
            </p>
            
            <div className="rounded-lg bg-black/40 p-8 backdrop-blur-sm">
              <h2 className="mb-6 text-2xl font-semibold text-electric-blue">
                {t('contact.team')}
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4 border-b border-white/10 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-electric-blue/20 text-electric-blue">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Presidente</h3>
                    <p className="text-white/70">Mich</p>
                    <p className="text-electric-blue">presidente at elektr-ame.com</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 border-b border-white/10 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-electric-blue/20 text-electric-blue">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Tesorero</h3>
                    <p className="text-white/70">Jérome</p>
                    <p className="text-electric-blue">tesorero at elektr-ame.com</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 border-b border-white/10 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-electric-blue/20 text-electric-blue">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Secretaria</h3>
                    <p className="text-white/70">Valérie</p>
                    <a href="mailto:secretaria@elektr-ame.com" className="text-electric-blue hover:underline">secretaria at elektr-ame.com</a>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 border-b border-white/10 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-electric-blue/20 text-electric-blue">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Vice presidente</h3>
                    <p className="text-white/70">Phil</p>
                    <a href="mailto:vice-presidente@elektr-ame.com" className="text-electric-blue hover:underline">vice-presidente at elektr-ame.com</a>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-electric-blue/20 text-electric-blue">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Communication and Public Relation</h3>
                    <p className="text-white/70">Rollie</p>
                    <a href="mailto:rrpp@elektr-ame.com" className="text-electric-blue hover:underline">rrpp at elektr-ame.com</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;
