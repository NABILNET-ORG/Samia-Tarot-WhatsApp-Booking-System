'use client'

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="card">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-red-600 mb-4">
            Payment Cancelled
          </h1>
          <h2 className="text-2xl font-bold text-red-600 mb-4 rtl">
            تم إلغاء الدفع
          </h2>

          <div className="space-y-4 text-gray-700">
            <p>Your payment was cancelled.</p>
            <p className="rtl">تم إلغاء عملية الدفع.</p>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="font-bold mb-2">Want to try again?</p>
              <p className="text-sm">
                Send us a message on WhatsApp and we'll help you complete your booking!
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg rtl">
              <p className="font-bold mb-2">تريد المحاولة مجدداً؟</p>
              <p className="text-sm">
                أرسل لنا رسالة عبر واتساب وسنساعدك في إتمام حجزك!
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            <a
              href="https://wa.me/15556320392"
              target="_blank"
              className="btn btn-primary w-full"
            >
              📱 Contact Us on WhatsApp / تواصل معنا
            </a>
            <a href="/" className="btn btn-secondary w-full">
              🏠 Back to Home / العودة للرئيسية
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
