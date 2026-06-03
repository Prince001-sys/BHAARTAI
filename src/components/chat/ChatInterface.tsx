'use client'

import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '@/store/chatStore'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatRelativeTime } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message } from '@/types'

interface ChatInterfaceProps {
  studySetId: string
  studySetTitle: string
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex gap-4 animate-slide-in ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-xs ${isUser ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>
        {isUser ? 'You' : <span className="material-symbols-outlined text-[16px]">smart_toy</span>}
      </div>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-5 py-3.5 text-sm rounded-2xl ${isUser ? 'bg-white text-black rounded-tr-sm' : 'bg-[#1A1A1A] border border-white/10 text-white rounded-tl-sm'}`}>
          {isUser ? (
            <p className="whitespace-pre-wrap font-medium">{message.content}</p>
          ) : (
            <div className="prose-notes text-sm text-gray-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-1">{formatRelativeTime(message.created_at)}</span>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-white">
        <span className="material-symbols-outlined text-[16px]">smart_toy</span>
      </div>
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center">
        <div className="loading-dots flex gap-1.5">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

export function ChatInterface({ studySetId, studySetTitle }: ChatInterfaceProps) {
  const { messages, isTyping, language, currentChat, setMessages, setCurrentChat, addMessage, setTyping, setLanguage } = useChatStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initChat = async () => {
      setLoading(true)
      try {
        const sessRes = await fetch(`/api/chat/sessions?studySetId=${studySetId}`)
        const { data: sessions } = await sessRes.json()
        
        let chat = sessions?.[0]
        if (!chat) {
          const createRes = await fetch('/api/chat/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studySetId, title: `Chat: ${studySetTitle}`, language }),
          })
          const { data } = await createRes.json()
          chat = data
        }

        setCurrentChat(chat)

        const msgRes = await fetch(`/api/chat/${chat.id}/messages`)
        const { data: msgs } = await msgRes.json()
        setMessages(msgs || [])
      } catch {
        console.error('Failed to init chat')
      } finally {
        setLoading(false)
      }
    }

    initChat()
  }, [studySetId, studySetTitle, language, setCurrentChat, setMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async () => {
    if (!input.trim() || !currentChat || isTyping) return

    const userMessage = input.trim()
    setInput('')
    
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      chat_id: currentChat.id,
      user_id: '',
      role: 'user',
      content: userMessage,
      tokens_used: null,
      created_at: new Date().toISOString(),
    }
    addMessage(tempMsg)
    setTyping(true)

    try {
      const res = await fetch(`/api/chat/${currentChat.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, language }),
      })
      const { data, error } = await res.json()
      
      if (error) throw new Error(error)
      addMessage(data)
    } catch (err) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        chat_id: currentChat.id,
        user_id: '',
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
        tokens_used: null,
        created_at: new Date().toISOString(),
      }
      addMessage(errorMsg)
    } finally {
      setTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const suggestions = [
    'Summarize the main topics',
    'What are the key formulas?',
    'Create a practice problem',
    'Explain this in simple terms',
  ]

  return (
    <div className="flex flex-col h-full bg-[#121212] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0 bg-[#0A0A0A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/5">
            <span className="material-symbols-outlined text-[20px] text-white">smart_toy</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white">AI Study Tutor</p>
            <p className="text-xs text-green-400 font-bold flex items-center gap-1.5 uppercase tracking-widest mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
              Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-gray-500 text-[20px]">language</span>
          <Select value={language} onValueChange={(v) => setLanguage(v as typeof language)}>
            <SelectTrigger className="h-9 w-32 text-xs font-bold rounded-xl border-white/20 bg-[#1A1A1A] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-white/20 text-white">
              <SelectItem value="english" className="font-bold">🇬🇧 English</SelectItem>
              <SelectItem value="hindi" className="font-bold">🇮🇳 Hindi</SelectItem>
              <SelectItem value="hinglish" className="font-bold">🤝 Hinglish</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
                <div className="h-20 w-2/3 bg-white/5 rounded-2xl animate-pulse" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/10">
              <span className="material-symbols-outlined text-[32px] text-white">auto_awesome</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Ask anything about your content</h3>
            <p className="text-sm text-gray-400 mb-8 max-w-sm mx-auto font-medium">Your AI tutor has read your study material and is ready to help.</p>
            <div className="flex flex-wrap gap-3 justify-center max-w-md mx-auto">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); }}
                  className="px-4 py-2 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:border-white/40 hover:text-white bg-[#1A1A1A] transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 shrink-0 bg-[#0A0A0A]">
        <div className="flex gap-3 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your study material..."
            className="flex-1 min-h-[52px] max-h-32 rounded-xl border-white/20 bg-[#1A1A1A] text-white focus-visible:ring-1 focus-visible:ring-white resize-none text-sm p-4 font-medium placeholder:text-gray-600"
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className="h-[52px] w-[52px] shrink-0 rounded-xl bg-white hover:bg-gray-200 text-black flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </div>
        <p className="text-[10px] text-gray-600 mt-3 text-center font-bold uppercase tracking-widest">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
