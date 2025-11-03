/**
 * 🔮 Home Page - Samia Tarot
 */

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-purple-900 mb-4">
            🔮 Samia Tarot
          </h1>
          <p className="text-xl md:text-2xl text-purple-700 mb-2">
            سامية تاروت
          </p>
          <p className="text-gray-600">
            Professional Spiritual Readings
          </p>
        </div>

        <div className="card mb-8">
          <h2 className="text-2xl font-bold mb-4">Welcome</h2>
          <p className="text-gray-700 mb-4">
            Professional Coffee Cup, Tarot, and Rune readings by Samia.
          </p>
          <p className="text-gray-700 mb-6">
            Book your spiritual guidance session via WhatsApp!
          </p>

          <div className="space-y-4">
            <a
              href="https://wa.me/9613620860"
              target="_blank"
              className="btn btn-primary w-full inline-block"
            >
              📱 Book via WhatsApp
            </a>

            <div className="text-sm text-gray-500">
              Available in Arabic & English
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="card">
            <div className="text-4xl mb-2">☕</div>
            <h3 className="font-bold mb-1">Coffee Cup</h3>
            <p className="text-sm text-gray-600">Traditional readings</p>
          </div>

          <div className="card">
            <div className="text-4xl mb-2">🃏</div>
            <h3 className="font-bold mb-1">Tarot</h3>
            <p className="text-sm text-gray-600">Card guidance</p>
          </div>

          <div className="card">
            <div className="text-4xl mb-2">🗿</div>
            <h3 className="font-bold mb-1">Rune</h3>
            <p className="text-sm text-gray-600">Ancient wisdom</p>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          <a href="/admin" className="text-purple-600 hover:underline">
            Admin Dashboard →
          </a>
        </div>
      </div>
    </div>
  )
}
