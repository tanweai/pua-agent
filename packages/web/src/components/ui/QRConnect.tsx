import { useState, useEffect } from 'react'
import { QrCode, Smartphone, Copy, Check, X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function QRConnect({ isOpen, onClose }: Props) {
  const [url, setUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetch('/api/connect')
        .then(r => r.json())
        .then(data => setUrl(data.url))
        .catch(() => {
          // Fallback: use current hostname
          const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname
          setUrl(`http://${host}:${window.location.port}`)
        })
    }
  }, [isOpen])

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  // Generate QR code using a public API (no dependency needed)
  const qrImageUrl = url
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=FAF9F7&color=1A1915&margin=10`
    : ''

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-bg-100 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 pointer-events-auto dialog-enter">
          {/* Close button */}
          <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-bg-200 text-text-400">
            <X size={18} />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-accent-100/10 flex items-center justify-center">
              <Smartphone size={28} className="text-accent-100" />
            </div>
            <h3 className="text-lg font-semibold text-text-100">手机连接 Agent</h3>
            <p className="text-sm text-text-400 mt-1">扫描二维码，在手机上使用 PUA Agent</p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-6">
            {qrImageUrl ? (
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <img
                  src={qrImageUrl}
                  alt="QR Code"
                  width={200}
                  height={200}
                  className="rounded-lg"
                />
              </div>
            ) : (
              <div className="w-[200px] h-[200px] bg-bg-200 rounded-xl flex items-center justify-center">
                <QrCode size={40} className="text-text-400 animate-pulse" />
              </div>
            )}
          </div>

          {/* URL + Copy */}
          <div className="flex items-center gap-2 px-3 py-2 bg-bg-200 rounded-lg">
            <code className="flex-1 text-[13px] text-text-200 font-mono truncate">{url || 'Loading...'}</code>
            <button
              onClick={handleCopy}
              disabled={!url}
              className="p-1.5 rounded-md hover:bg-bg-300 text-text-400 hover:text-text-200 transition-colors"
            >
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-4 space-y-2 text-[12px] text-text-400">
            <p>1. 确保手机和电脑在同一 WiFi 网络</p>
            <p>2. 用手机相机或微信扫描二维码</p>
            <p>3. 在手机浏览器中打开即可使用</p>
          </div>
        </div>
      </div>
    </>
  )
}
