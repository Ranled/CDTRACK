import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface UseInstallPromptReturn {
  // true on Android/Desktop Chrome/Edge when the app is installable
  canInstall: boolean
  // true on iOS Safari — no prompt API, must show manual instructions
  isIOS: boolean
  // true once the app is already installed (running standalone)
  isInstalled: boolean
  // Call this to trigger the native install prompt (Android/Desktop only)
  triggerInstall: () => Promise<void>
}

export function useInstallPrompt(): UseInstallPromptReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)

  // Detect iOS (iPhone, iPad, iPod)
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)

  // Detect if already installed (running as standalone PWA)
  const isInstalled =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true

  useEffect(() => {
    if (isInstalled) return // already installed — hide the button

    const handler = (e: Event) => {
      e.preventDefault() // stop the browser's default mini-infobar
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Clean up if the app gets installed during the session
    const installed = () => setCanInstall(false)
    window.addEventListener('appinstalled', installed)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installed)
    }
  }, [isInstalled])

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setCanInstall(false)
      setDeferredPrompt(null)
    }
  }, [deferredPrompt])

  return { canInstall, isIOS, isInstalled, triggerInstall }
}
