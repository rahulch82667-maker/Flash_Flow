import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] selection:bg-blue-100">
      <Navbar />
      <Hero />
      
      {/* Short Feature Highlight */}
      <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-12">
        {[
          { title: "Real-time Sync", desc: "Connect your bank accounts securely." },
          { title: "Smart Reports", desc: "Weekly insights into your spending habits." },
          { title: "Secure by Design", desc: "Bank-grade encryption for all your data." }
        ].map((feature, i) => (
          <div key={i} className="space-y-3">
            <h3 className="font-bold text-xl text-gray-900">{feature.title}</h3>
            <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>

    </div>
  );
}