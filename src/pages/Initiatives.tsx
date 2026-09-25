
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Mic, Music, Sparkles, Book, Globe, Leaf, Users, Calendar } from "lucide-react";
import { SEO } from "@/components/SEO";

interface InitiativeProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const initiatives: InitiativeProps[] = [
  {
    icon: <Music className="h-10 w-10" />,
    title: "Cultural & Musical Events",
    description: "We organize a variety of electronic music events throughout Barcelona, from intimate club nights to outdoor festivals, showcasing both local talent and international artists.",
    color: "bg-electric-blue"
  },
  {
    icon: <Sparkles className="h-10 w-10" />,
    title: "Workshops & Education",
    description: "Our educational programs include production workshops, DJing masterclasses, and courses on music business, designed for all skill levels from beginners to professionals.",
    color: "bg-neon-pink"
  },
  {
    icon: <Users className="h-10 w-10" />,
    title: "Artist Residencies",
    description: "We provide space, time, and resources for electronic music artists and digital creators to develop new work and collaborate with the local community.",
    color: "bg-electric-blue"
  },
  {
    icon: <Globe className="h-10 w-10" />,
    title: "International Exchange",
    description: "Our network facilitates the exchange of artists between Barcelona and other global electronic music hubs, fostering cross-cultural dialogue and collaboration.",
    color: "bg-neon-pink"
  },
  {
    icon: <Leaf className="h-10 w-10" />,
    title: "Sustainability Initiatives",
    description: "We implement and promote eco-responsible practices in event production, including waste reduction, energy efficiency, and sustainable sourcing.",
    color: "bg-electric-blue"
  },
  {
    icon: <Mic className="h-10 w-10" />,
    title: "Music Therapy",
    description: "Through alternative music therapy sessions, we explore the healing potential of electronic sounds and rhythms for mental wellbeing and community building.",
    color: "bg-neon-pink"
  },
  {
    icon: <Book className="h-10 w-10" />,
    title: "Heritage Preservation",
    description: "We document and archive Barcelona's electronic music scene, preserving its history and cultural significance for future generations.",
    color: "bg-electric-blue"
  },
  {
    icon: <Calendar className="h-10 w-10" />,
    title: "Solidarity Projects",
    description: "We develop initiatives that make electronic music culture more accessible to underrepresented communities and those facing socioeconomic barriers.",
    color: "bg-neon-pink"
  }
];

const InitiativeCard = ({ initiative }: { initiative: InitiativeProps }) => {
  return (
    <div className="flex flex-col h-full p-6 rounded-xl bg-white/5 backdrop-blur border border-white/10 hover:border-electric-blue/30 transition-all">
      <div className={`p-3 rounded-full ${initiative.color}/20 w-fit mb-4`}>
        <div className={`p-2 rounded-full ${initiative.color}`}>
          {initiative.icon}
        </div>
      </div>
      <h3 className="text-xl font-semibold text-white mb-3">{initiative.title}</h3>
      <p className="text-white/70 flex-grow">{initiative.description}</p>
      <Button variant="ghost" className="text-electric-blue hover:bg-electric-blue/20 w-fit mt-4">
        Learn More
      </Button>
    </div>
  );
};

const Initiatives = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <SEO 
        title="Our Initiatives | Elektr-Âme"
        description="Discover Elektr-Âme's initiatives: cultural events, workshops, artist residencies, heritage preservation, and solidarity projects in Barcelona's electronic music scene."
        url="https://www.elektr-ame.com/initiatives"
        keywords="initiatives, workshops, events, artist residencies, Barcelona, electronic music, cultural projects"
      />
      <Header />
      
      {/* Hero Section */}
      <div className="relative py-28 bg-gradient-to-b from-deep-purple to-midnight-blue">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-neon-pink filter blur-3xl"></div>
          <div className="absolute bottom-1/3 left-1/3 w-96 h-96 rounded-full bg-electric-blue filter blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Our Initiatives</h1>
            <p className="text-xl text-white/80 mb-8">
              Discover the diverse programs and projects that Elektr-Âme develops to promote electronic music and digital arts in Barcelona.
            </p>
          </div>
        </div>
      </div>
      
      {/* Initiatives Grid */}
      <section className="py-20 bg-gradient-to-b from-midnight-blue to-deep-purple">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {initiatives.map((initiative, index) => (
              <InitiativeCard key={index} initiative={initiative} />
            ))}
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-b from-deep-purple to-dark-blue">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Get Involved</h2>
            <p className="text-lg text-white/80 mb-8">
              Join Elektr-Âme's community and contribute to the growth of electronic music and digital arts in Barcelona. Whether you're an artist, volunteer, or supporter, there's a place for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple">
                Become a Member
              </Button>
              <Button variant="outline" className="border-electric-blue text-electric-blue hover:bg-electric-blue/20">
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Initiatives;
