import { Navbar } from "./components/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            La tua carta fedeltà universale
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Un'unica carta NFC per tutti i tuoi negozi preferiti. 
            Guadagna punti ovunque tu vada.
          </p>
          <div className="flex justify-center gap-4">
            <a 
              href="/auth" 
              className="bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Inizia Ora
            </a>
            <a 
              href="#how-it-works" 
              className="border border-gray-300 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Scopri di più
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
