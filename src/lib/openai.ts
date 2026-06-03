import { GoogleGenerativeAI } from '@google/generative-ai'

let geminiClient: GoogleGenerativeAI | null = null

export function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set')
    }
    geminiClient = new GoogleGenerativeAI(apiKey)
  }
  return geminiClient
}

// Use Gemini 2.5 Flash for fast generation tasks, Pro for complex tasks
export const AI_MODEL = 'gemini-2.5-flash'
export const AI_MODEL_FAST = 'gemini-2.5-flash'

/**
 * Converts raw Gemini API errors into clear, user-friendly messages.
 */
export function getOpenAIErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { status?: number; code?: string; message?: string }
    const msg = (e.message || '').toLowerCase()

    if (msg.includes('quota') || msg.includes('resource_exhausted') || msg.includes('rate_limit')) {
      return 'Gemini API rate limit hit. Please wait 30 seconds and try again.'
    }
    if (msg.includes('invalid') && msg.includes('key')) {
      return 'Invalid Gemini API key. Please update the GEMINI_API_KEY in your .env.local file.'
    }
    if (msg.includes('permission') || msg.includes('403')) {
      return 'Gemini API key does not have permission. Check your Google AI Studio key.'
    }
    if (e.message) return e.message
  }
  return 'AI service error. Please try again.'
}

export async function generateNotes(extractedText: string): Promise<{
  summary: string
  detailed_notes: string
  revision_notes: string
  exam_notes: string
  tokens_used: number
}> {
  const client = getGeminiClient()
  const model = client.getGenerativeModel({
    model: AI_MODEL,
    generationConfig: { responseMimeType: 'application/json' },
  })

  const prompt = `You are an expert study assistant for Indian students (JEE, NEET, Class 11-12, College).
Generate comprehensive study notes from the provided content.
Always respond in valid JSON format.

Generate detailed study notes from this content. Return a JSON object with these exact keys:
- "summary": A concise 3-5 paragraph overview of the main topics
- "detailed_notes": Comprehensive notes with headings, bullet points, key concepts, formulas (use markdown)
- "revision_notes": Short, bullet-point revision notes for quick review before exam
- "exam_notes": Key points, important definitions, and likely exam questions

Content to analyze:
${extractedText.slice(0, 15000)}`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const parsed = JSON.parse(text)

  return {
    summary: parsed.summary || '',
    detailed_notes: parsed.detailed_notes || '',
    revision_notes: parsed.revision_notes || '',
    exam_notes: parsed.exam_notes || '',
    tokens_used: result.response.usageMetadata?.totalTokenCount || 0,
  }
}

export async function generateFlashcards(extractedText: string, count = 12): Promise<{
  flashcards: Array<{ question: string; answer: string; difficulty: string }>
  tokens_used: number
}> {
  const client = getGeminiClient()
  const model = client.getGenerativeModel({
    model: AI_MODEL,
    generationConfig: { responseMimeType: 'application/json' },
  })

  const prompt = `You are an expert study assistant for Indian students.
Generate flashcards from study material. Return valid JSON only.

Generate ${count} flashcards from this content. Return a JSON object with a "flashcards" array.
Each flashcard must have: "question", "answer", "difficulty" (easy/medium/hard).
Make questions specific, answers concise but complete.

Content:
${extractedText.slice(0, 12000)}`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const parsed = JSON.parse(text)

  return {
    flashcards: parsed.flashcards || [],
    tokens_used: result.response.usageMetadata?.totalTokenCount || 0,
  }
}

export async function generateQuiz(
  extractedText: string,
  difficulty: string,
  count = 10
): Promise<{
  questions: Array<{
    question: string
    option_a: string
    option_b: string
    option_c: string
    option_d: string
    correct_answer: string
    explanation: string
  }>
  tokens_used: number
}> {
  const client = getGeminiClient()
  const model = client.getGenerativeModel({
    model: AI_MODEL,
    generationConfig: { responseMimeType: 'application/json' },
  })

  const prompt = `You are an expert quiz creator for Indian students (JEE, NEET, Class 11-12).
Create MCQ questions at ${difficulty} difficulty. Return valid JSON only.

Create ${count} multiple-choice questions from this content at ${difficulty} difficulty.
Return a JSON object with a "questions" array. Each question must have:
- "question": The question text
- "option_a": First option
- "option_b": Second option
- "option_c": Third option
- "option_d": Fourth option
- "correct_answer": Must be exactly "A", "B", "C", or "D"
- "explanation": Brief explanation of the correct answer

Content:
${extractedText.slice(0, 12000)}`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const parsed = JSON.parse(text)

  return {
    questions: parsed.questions || [],
    tokens_used: result.response.usageMetadata?.totalTokenCount || 0,
  }
}

export async function chatWithAI(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  context: string,
  language: string
): Promise<{ answer: string; tokens_used: number }> {
  const client = getGeminiClient()
  const model = client.getGenerativeModel({ model: AI_MODEL_FAST })

  const langInstruction =
    language === 'hindi'
      ? 'Always respond in Hindi.'
      : language === 'hinglish'
      ? 'Respond in Hinglish (mix of Hindi and English, like how Indian students talk).'
      : 'Respond in clear, simple English.'

  const systemPrompt = `You are an expert AI tutor helping Indian students understand their study material.
${langInstruction}
Be friendly, clear, and thorough. Use examples where helpful.
Only answer questions related to the study material provided below.
If asked something unrelated, politely redirect to the study material.

Study Material Context:
${context.slice(0, 8000)}`

  // Build Gemini chat history (all except the last user message)
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const lastMessage = messages[messages.length - 1]

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Understood! I will help you study this material. What would you like to know?' }] },
      ...history,
    ],
  })

  const result = await chat.sendMessage(lastMessage?.content || '')
  const answer = result.response.text()

  return {
    answer,
    tokens_used: result.response.usageMetadata?.totalTokenCount || 0,
  }
}
