'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, XCircle } from 'lucide-react'

interface QRScannerProps {
  onScan: (value: string) => void
  onClose: () => void
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerId = 'qr-reader'

  // Use refs to avoid re-triggering effect when callbacks change
  const onScanRef = useRef(onScan)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onScanRef.current = onScan
    onCloseRef.current = onClose
  })

  const handleScan = useCallback((decodedText: string) => {
    onScanRef.current(decodedText)
    scannerRef.current?.stop().catch(() => {})
    onCloseRef.current()
  }, [])

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScan,
        () => {}
      )
      .catch((err) => {
        setError('Unable to access camera. Please allow camera access or enter the code manually.')
        console.error('QR scanner error:', err)
      })

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [handleScan])

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-4 w-full max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-gray-800">Scan QR Code</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        {error ? (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
        ) : (
          <div id={containerId} className="rounded-lg overflow-hidden" />
        )}
      </div>
    </div>
  )
}
