'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

interface TranscriptSegment {
  text: string
  start: number   // seconds
  duration: number
}

interface Upload {
  id: string
  youtube_video_id?: string | null
  extracted_text?: string | null
  transcript_segments?: string | null
  signedUrl?: string | null
  [key: string]: unknown
}

interface YouTubePanelProps {
  upload: Upload
  studySetTitle: string
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function YouTubePanel({ upload, studySetTitle }: YouTubePanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  // Parse stored transcript segments
  const segments: TranscriptSegment[] = (() => {
    try {
      if (upload.transcript_segments) {
        return JSON.parse(upload.transcript_segments as string)
      }
    } catch {}
    return []
  })()

  // If we have segments, use them; otherwise fall back to raw text split into chunks
  const hasTimeline = segments.length > 0

  // Poll current time from YouTube iframe via postMessage (YouTube IFrame API)
  useEffect(() => {
    if (!hasTimeline) return

    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        if (data?.event === 'infoDelivery' && typeof data?.info?.currentTime === 'number') {
          const t = Math.floor(data.info.currentTime)
          setCurrentTime(t)
        }
      } catch {}
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [hasTimeline])

  // Derive active segment based on current time to avoid setting state in effect
  const activeIndex = hasTimeline
    ? segments.findIndex(
        (seg, i) =>
          currentTime >= seg.start &&
          currentTime < (segments[i + 1]?.start ?? seg.start + seg.duration + 5)
      )
    : -1

  // Auto-scroll the active segment into view when it changes
  useEffect(() => {
    if (!hasTimeline || activeIndex === -1) return
    const el = transcriptRef.current?.querySelector(`[data-idx="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeIndex, hasTimeline])

  // Seek YouTube player to a specific timestamp
  const seekTo = useCallback((seconds: number) => {
    if (!iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }),
      '*'
    )
  }, [])

  // Filter segments by search
  const filteredSegments = searchQuery
    ? segments.filter((s) => s.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : segments

  const videoId = upload.youtube_video_id
  // enablejsapi=1 → lets us control via postMessage
  // cc_load_policy=1 → force captions ON
  // hl=en → interface language English
  // cc_lang_pref=en → prefer English captions
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1&cc_load_policy=1&hl=en&cc_lang_pref=en&rel=0&modestbranding=1`
    : null

  return (
    <div className="w-full h-full flex flex-col overflow-hidden gap-3">
      {/* ── YouTube Embed ── */}
      {embedUrl ? (
        <div className="w-full shrink-0 aspect-video rounded-xl overflow-hidden bg-black border border-white/10 shadow-lg">
          <iframe
            ref={iframeRef}
            className="w-full h-full border-none"
            src={embedUrl}
            title={studySetTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="w-full shrink-0 aspect-video rounded-xl bg-[#1A1A1A] border border-white/10 flex items-center justify-center">
          <p className="text-gray-500 text-sm">Video unavailable</p>
        </div>
      )}

      {/* ── Transcript / Timeline Panel ── */}
      <div className="flex-1 min-h-0 flex flex-col bg-[#121212] rounded-xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">
              {hasTimeline ? 'timeline' : 'description'}
            </span>
            {hasTimeline ? 'Clickable Timeline' : 'Transcript'}
            {hasTimeline && (
              <span className="text-[10px] font-normal text-gray-500 normal-case tracking-normal">
                — click any line to jump
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            {/* Copy button */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(upload.extracted_text || '')
                toast.success('Transcript copied!')
              }}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white font-bold border border-white/10 px-3 py-1.5 rounded-lg bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">content_copy</span>
              Copy
            </button>
          </div>
        </div>

        {/* Search bar (only when we have segments) */}
        {hasTimeline && (
          <div className="px-4 py-2 border-b border-white/5 shrink-0">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-gray-500">
                search
              </span>
              <input
                type="text"
                placeholder="Search transcript..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Transcript body */}
        <div ref={transcriptRef} className="flex-1 overflow-y-auto p-2">
          {hasTimeline ? (
            filteredSegments.length === 0 ? (
              <p className="text-gray-600 text-xs text-center py-8">No results for &quot;{searchQuery}&quot;</p>
            ) : (
              <div className="space-y-0.5">
                {filteredSegments.map((seg) => {
                  const realIdx = segments.indexOf(seg)
                  const isActive = realIdx === activeIndex
                  return (
                    <button
                      key={realIdx}
                      data-idx={realIdx}
                      onClick={() => {
                        seekTo(seg.start)
                      }}
                      className={`w-full text-left flex items-start gap-3 px-3 py-2 rounded-lg transition-all group ${
                        isActive
                          ? 'bg-white/10 border border-white/20'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      {/* Timestamp badge */}
                      <span
                        className={`shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded mt-0.5 transition-colors ${
                          isActive
                            ? 'bg-white text-black'
                            : 'bg-white/10 text-gray-400 group-hover:bg-white/20 group-hover:text-white'
                        }`}
                      >
                        {formatTime(seg.start)}
                      </span>
                      {/* Text */}
                      <span
                        className={`text-sm leading-relaxed transition-colors ${
                          isActive ? 'text-white font-medium' : 'text-gray-400 group-hover:text-gray-200'
                        }`}
                        dangerouslySetInnerHTML={{
                          __html: searchQuery
                            ? seg.text.replace(
                                new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                                '<mark class="bg-yellow-400/30 text-yellow-200 rounded px-0.5">$1</mark>'
                              )
                            : seg.text,
                        }}
                      />
                      {/* Play icon on hover */}
                      <span
                        className={`shrink-0 material-symbols-outlined text-[14px] mt-1 transition-opacity ${
                          isActive ? 'opacity-100 text-white' : 'opacity-0 group-hover:opacity-60 text-gray-400'
                        }`}
                      >
                        play_arrow
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          ) : (
            /* Fallback: plain text transcript */
            <div className="text-sm text-gray-300 leading-relaxed p-3 whitespace-pre-wrap">
              {upload.extracted_text || (
                <span className="text-gray-600 italic">
                  No transcript available. Re-upload the video to generate one.
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
