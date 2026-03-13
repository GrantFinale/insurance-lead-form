import Link from "next/link";

const insuranceTypes = [
  { name: "auto", label: "Auto Insurance", desc: "Compare car insurance rates from top providers", icon: "🚗", savings: "Save up to $694/year!" },
  { name: "home", label: "Home Insurance", desc: "Protect your home with the right coverage", icon: "🏠", savings: "Save up to $400/year!" },
  { name: "health", label: "Health Insurance", desc: "Find affordable health coverage plans", icon: "🏥", savings: "Compare top plans" },
  { name: "life", label: "Life Insurance", desc: "Secure your family's financial future", icon: "👨‍👩‍👧‍👦", savings: "From $15/month" },
  { name: "business", label: "Business Insurance", desc: "Coverage to protect your business", icon: "🏢", savings: "Custom quotes" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-indigo-700">InsureCompare</div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
            {insuranceTypes.map(t => (
              <Link key={t.name} href={`/quote?type=${t.name}`} className="hover:text-indigo-600 transition-colors">
                {t.label.replace(" Insurance", "")}
              </Link>
            ))}
          </nav>
          <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600">Admin</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Compare quotes on<br />coverage that&apos;s right for you
          </h1>
          <p className="text-xl text-indigo-200 mb-12 max-w-2xl mx-auto">
            Compare personalized quotes on the right coverage for your home, car and more
          </p>

          {/* Insurance Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {insuranceTypes.map((type) => (
              <Link
                key={type.name}
                href={`/quote?type=${type.name}`}
                className="bg-white rounded-xl p-6 text-left hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="text-3xl mb-3">{type.icon}</div>
                <div className="text-sm font-bold text-indigo-700 group-hover:text-indigo-800 mb-1">{type.label}</div>
                <div className="text-xs text-gray-500 mb-2">{type.desc}</div>
                <div className="text-xs font-semibold text-emerald-600">{type.savings}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-8">Trusted by millions of Americans</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { stat: "5M+", label: "Quotes compared" },
              { stat: "50+", label: "Insurance partners" },
              { stat: "$500", label: "Average savings" },
              { stat: "4.8★", label: "Customer rating" },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-3xl font-bold text-indigo-700">{item.stat}</div>
                <div className="text-sm text-gray-500 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>&copy; 2026 InsureCompare. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
