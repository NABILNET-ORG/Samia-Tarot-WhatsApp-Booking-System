/**
 * 🌐 AI Translation Helper
 * Translate names between Arabic and English using GPT-4
 */

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
})

export type TranslatedName = {
  original: string
  translated: string
  originalLanguage: 'arabic' | 'english'
  translatedLanguage: 'arabic' | 'english'
}

export class NameTranslator {
  /**
   * Detect if name is in Arabic or English
   */
  static detectLanguage(name: string): 'arabic' | 'english' {
    // Check for Arabic characters
    const arabicPattern = /[\u0600-\u06FF]/
    return arabicPattern.test(name) ? 'arabic' : 'english'
  }

  /**
   * Translate name using GPT-4
   */
  static async translateName(name: string): Promise<TranslatedName> {
    try {
      const originalLanguage = this.detectLanguage(name)
      const targetLanguage = originalLanguage === 'arabic' ? 'english' : 'arabic'

      console.log(`🌐 Translating name: "${name}" (${originalLanguage} → ${targetLanguage})`)

      const prompt =
        originalLanguage === 'arabic'
          ? `Translate this Arabic name to English. Provide only the English transliteration/translation, nothing else.

Arabic name: ${name}

English translation (first name and last name if applicable):`
          : `Translate this English name to Arabic. Provide only the Arabic translation, nothing else.

English name: ${name}

Arabic translation (الاسم الأول والاسم الأخير إذا كان مطبقاً):`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Using mini for faster, cheaper translations
        messages: [
          {
            role: 'system',
            content:
              originalLanguage === 'arabic'
                ? 'You are a professional Arabic to English name translator. Translate names accurately and naturally. Only provide the translated name, nothing else.'
                : 'You are a professional English to Arabic name translator. Translate names accurately and naturally. Only provide the translated name in Arabic script, nothing else.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 100,
      })

      const translated = completion.choices[0].message.content?.trim() || name

      console.log(`✅ Translation: "${name}" → "${translated}"`)

      return {
        original: name,
        translated,
        originalLanguage,
        translatedLanguage: targetLanguage,
      }
    } catch (error: any) {
      console.error('❌ Translation error:', error)
      // Fallback: return original name if translation fails
      return {
        original: name,
        translated: name,
        originalLanguage: this.detectLanguage(name),
        translatedLanguage: this.detectLanguage(name),
      }
    }
  }

  /**
   * Translate customer name and prepare both versions
   */
  static async translateCustomerName(customerName: string): Promise<{
    englishName: string
    arabicName: string
    originalLanguage: 'arabic' | 'english'
  }> {
    const translation = await this.translateName(customerName)

    if (translation.originalLanguage === 'arabic') {
      return {
        englishName: translation.translated,
        arabicName: translation.original,
        originalLanguage: 'arabic',
      }
    } else {
      return {
        englishName: translation.original,
        arabicName: translation.translated,
        originalLanguage: 'english',
      }
    }
  }
}
