'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import Link from 'next/link'
import { useSubscriptionStore } from '@/store/subscriptionStore'
import { validateFile, isValidYouTubeUrl, extractYouTubeVideoId, formatBytes } from '@/lib/utils'

interface UploadedFile {
  file: File
  progress: number
  status: 'idle' | 'uploading' | 'done' | 'error'
  error?: string
  studySetId?: string
}

export default function UploadPage() {
  const router = useRouter()
  const { canUpload, plan, uploadsUsedToday, incrementUploads } = useSubscriptionStore()
  const [activeTab, setActiveTab] = useState<'file' | 'youtube'>('file')
  
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [youtubeTitle, setYoutubeTitle] = useState('')
  const [youtubeLoading, setYoutubeLoading] = useState(false)
  const [youtubeProgress, setYoutubeProgress] = useState(0)

  const remainingUploads = plan === 'pro' ? 'Unlimited' : Math.max(0, 3 - uploadsUsedToday)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!canUpload()) {
      toast.error('Daily upload limit reached. Upgrade to Pro for unlimited uploads.', {
        action: { label: 'Upgrade', onClick: () => router.push('/pricing') },
      })
      return
    }

    const file = acceptedFiles[0]
    if (!file) return

    const validation = validateFile(file)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    const fileObj: UploadedFile = {
      file,
      progress: 0,
      status: 'uploading',
    }
    setUploadedFile(fileObj)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', file.name.replace(/\.[^/.]+$/, ''))

    try {
      const progressInterval = setInterval(() => {
        setUploadedFile((prev) => 
          prev && prev.status === 'uploading' 
            ? { ...prev, progress: Math.min(prev.progress + 8, 85) } 
            : prev
        )
      }, 150)

      const res = await fetch('/api/uploads', { method: 'POST', body: formData })
      clearInterval(progressInterval)
      const { data, error } = await res.json()

      if (!res.ok || error) {
        throw new Error(error || 'Upload failed')
      }

      setUploadedFile((prev) => 
        prev ? { ...prev, progress: 100, status: 'done', studySetId: data.studySet?.id } : null
      )
      incrementUploads()
      toast.success('File uploaded! Processing notes...')

      if (data.upload?.id) {
        fetch('/api/ai/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uploadId: data.upload.id }),
        })
      }

      if (data.studySet?.id) {
        setTimeout(() => router.push(`/study/${data.studySet.id}`), 1500)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed'
      setUploadedFile((prev) => prev ? { ...prev, status: 'error', error: errorMsg, progress: 0 } : null)
      toast.error(errorMsg)
    }
  }, [canUpload, incrementUploads, router])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    maxSize: 25 * 1024 * 1024,
    disabled: uploadedFile?.status === 'uploading' || uploadedFile?.status === 'done',
  })

  const handleYouTubeSubmit = async () => {
    if (!youtubeUrl.trim()) {
      toast.error('Please enter a YouTube URL.')
      return
    }
    if (!isValidYouTubeUrl(youtubeUrl)) {
      toast.error('Invalid YouTube URL.')
      return
    }
    if (!canUpload()) {
      toast.error('Daily upload limit reached. Upgrade to Pro for unlimited uploads.', {
        action: { label: 'Upgrade', onClick: () => router.push('/pricing') },
      })
      return
    }

    const videoId = extractYouTubeVideoId(youtubeUrl)
    setYoutubeLoading(true)
    setYoutubeProgress(20)
    try {
      const res = await fetch('/api/uploads/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl, title: youtubeTitle || `YouTube: ${videoId}` }),
      })
      setYoutubeProgress(60)
      
      const { data, error } = await res.json()
      if (!res.ok || error) throw new Error(error || 'Failed to add YouTube video')

      setYoutubeProgress(90)
      incrementUploads()
      toast.success('YouTube video added! Transcribing transcript...')

      if (data.upload?.id) {
        fetch('/api/ai/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uploadId: data.upload.id }),
        })
      }

      setYoutubeProgress(100)
      if (data.studySet?.id) {
        setTimeout(() => router.push(`/study/${data.studySet.id}`), 1200)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to process YouTube video')
      setYoutubeProgress(0)
    } finally {
      setYoutubeLoading(false)
    }
  }

  return (
    <div className="flex-1 min-h-screen bg-[#121212] flex flex-col items-center selection:bg-white selection:text-black pt-16 px-6">
      <div className="w-full max-w-3xl">
        
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Create Study Set</h2>
          <p className="text-gray-400">Upload your material, and let AI generate your notes & flashcards instantly.</p>
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-4 text-sm font-bold tracking-wide transition-colors ${
                activeTab === 'file' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Upload PDF/Image
            </button>
            <button
              onClick={() => setActiveTab('youtube')}
              className={`flex-1 py-4 text-sm font-bold tracking-wide transition-colors ${
                activeTab === 'youtube' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              YouTube Video
            </button>
          </div>

          <div className="p-8 md:p-12">
            {activeTab === 'file' && (
              <div>
                {!uploadedFile ? (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
                      isDragActive
                        ? 'border-white bg-white/5'
                        : 'border-white/20 hover:border-white/50 hover:bg-white/5'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6 border border-white/10 text-white">
                      <span className="material-symbols-outlined text-[32px]">folder_open</span>
                    </div>
                    <p className="text-lg font-bold text-white mb-2">
                      {isDragActive ? 'Drop it here...' : 'Drag & drop file here'}
                    </p>
                    <p className="text-sm text-gray-500 font-medium">
                      PDF, JPG, PNG up to 25MB
                    </p>
                  </div>
                ) : (
                  <div className="bg-[#121212] border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white border border-white/10">
                        <span className="material-symbols-outlined">
                          {uploadedFile.file.type === 'application/pdf' ? 'description' : 'image'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate">{uploadedFile.file.name}</p>
                        <p className="text-sm text-gray-400">{formatBytes(uploadedFile.file.size)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-white">
                          {uploadedFile.status === 'uploading' ? 'Uploading...' : 
                           uploadedFile.status === 'done' ? 'Complete' : 'Failed'}
                        </span>
                        <span className={uploadedFile.status === 'done' ? 'text-green-400' : 'text-gray-400'}>
                          {uploadedFile.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-[#27272A] rounded-full h-2 overflow-hidden border border-white/5">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            uploadedFile.status === 'error' ? 'bg-red-500' : 
                            uploadedFile.status === 'done' ? 'bg-green-500' : 'bg-white'
                          }`}
                          style={{ width: `${uploadedFile.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'youtube' && (
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-white block mb-2">YouTube URL</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">link</span>
                    <input
                      className="w-full h-14 pl-12 pr-4 bg-[#121212] border border-white/20 rounded-xl focus:border-white focus:ring-1 focus:ring-white text-white transition-all outline-none"
                      placeholder="https://youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      disabled={youtubeLoading}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-white block mb-2">Title (Optional)</label>
                  <input
                    className="w-full h-14 px-4 bg-[#121212] border border-white/20 rounded-xl focus:border-white focus:ring-1 focus:ring-white text-white transition-all outline-none"
                    placeholder="E.g. Quantum Physics Lecture 1"
                    value={youtubeTitle}
                    onChange={(e) => setYoutubeTitle(e.target.value)}
                    disabled={youtubeLoading}
                  />
                </div>
                <button
                  onClick={handleYouTubeSubmit}
                  disabled={youtubeLoading || !youtubeUrl}
                  className="w-full h-14 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {youtubeLoading ? 'Processing...' : 'Import Video'}
                </button>

                {youtubeLoading && (
                  <div className="space-y-2 pt-4">
                     <div className="flex justify-between text-sm font-bold">
                        <span className="text-white">Extracting transcript...</span>
                        <span className="text-gray-400">{youtubeProgress}%</span>
                      </div>
                      <div className="w-full bg-[#27272A] rounded-full h-2 overflow-hidden border border-white/5">
                        <div className="h-full rounded-full transition-all duration-300 bg-white" style={{ width: `${youtubeProgress}%` }} />
                      </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Clean footer for quota limits */}
          <div className="bg-[#121212] border-t border-white/10 px-8 py-5 flex items-center justify-between">
             <div className="flex items-center gap-2">
               <span className="material-symbols-outlined text-gray-400 text-lg">info</span>
               <span className="text-sm text-gray-400 font-medium">
                 {plan === 'pro' ? 'Pro Plan: Unlimited Uploads' : `Free Plan: ${remainingUploads} uploads remaining today`}
               </span>
             </div>
             {plan === 'free' && (
               <Link href="/pricing" className="text-sm font-bold text-white hover:underline">
                 Upgrade
               </Link>
             )}
          </div>
        </div>
      </div>
    </div>
  )
}
