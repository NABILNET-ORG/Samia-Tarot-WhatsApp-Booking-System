'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [booking, setBooking] = useState<any>(null)

  useEffect(() => {
    if (sessionId) {
      // Could fetch booking details here
      setBooking({ id: sessionId })
    }
  }, [sessionId])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="card">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-green-600 mb-4">
            Payment Successful!
          </h1>
          <h2 className="text-2xl font-bold text-green-600 mb-4 rtl">
            تم الدفع بنجاح!
          </h2>

          <div className="space-y-4 text-gray-700">
            <p>Your booking has been confirmed!</p>
            <p className="rtl">تم تأكيد حجزك!</p>

            <div className="bg-green-50 p-4 rounded-lg">
              <p className="font-bold mb-2">What happens next:</p>
              <ul className="text-sm text-left space-y-2">
                <li>✅ You'll receive confirmation via WhatsApp</li>
                <li>✅ Your reading will be delivered at scheduled time</li>
                <li>✅ Admin has been notified</li>
              </ul>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg rtl">
              <p className="font-bold mb-2">الخطوات القادمة:</p>
              <ul className="text-sm space-y-2">
                <li>✅ ستستلم تأكيد عبر واتساب</li>
                <li>✅ سيتم إرسال قراءتك في الموعد المحدد</li>
                <li>✅ تم إشعار الإدارة</li>
              </ul>
            </div>
          </div>

          <div className="mt-8">
            <a href="/" className="btn btn-primary">
              🏠 Back to Home / العودة للرئيسية
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
