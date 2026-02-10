export default function Hero() {
  return (
    <section className="relative max-w-6xl mx-auto px-6 pt-24 pb-32 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-100">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
        New: AI-Powered Budgeting
      </div>
      
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6">
        Take control of your <br />
        <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
          financial freedom.
        </span>
      </h1>
      
      <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-500 mb-10 leading-relaxed">
        The all-in-one platform to track expenses, set budgets, and grow your wealth. 
        Simple enough for everyone, powerful enough for experts.
      </p>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button className="bg-black text-white px-8 py-4 rounded-xl font-bold hover:scale-105 transition-transform shadow-xl text-lg">
          Start for Free
        </button>
        <button className="bg-white border border-gray-200 text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition-colors text-lg">
          Book a Demo
        </button>
      </div>

      {/* Decorative Dashboard Element */}
      <div className="mt-20 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10" />
        <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 shadow-2xl overflow-hidden">
          <div className="h-64 md:h-96 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
             <p className="text-gray-400 font-medium">Dashboard Preview Area</p>
          </div>
        </div>
      </div>
    </section>
  );
}