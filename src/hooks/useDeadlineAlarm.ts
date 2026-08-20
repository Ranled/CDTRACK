import { useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatTime } from '@/lib/utils'

/**
 * Synthesizes an audible, pleasant dual-chime alarm sound using the Web Audio API.
 * Works 100% offline with zero external audio assets.
 */
export function playAlarmSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()

    // Gentle 3-tone notification chime (D5 -> A5 -> D6)
    const tones = [
      { freq: 587.33, start: 0.0,  dur: 0.35 },
      { freq: 880.00, start: 0.15, dur: 0.35 },
      { freq: 1174.66, start: 0.30, dur: 0.50 },
    ]

    tones.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start)

      // Envelope: quick attack, smooth exponential decay
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start)
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + start + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + dur + 0.05)
    })
  } catch (err) {
    console.warn('Could not play alarm sound:', err)
  }
}

/**
 * Monitors deadlines and alerts the user 3 hours prior with:
 * 1. Web Audio Chime Alarm
 * 2. System Browser Push Notification
 * 3. Haptic Device Vibration
 * 4. In-App Notification Center Record
 */
export function useDeadlineAlarm() {
  const { user } = useAuth()
  const isCheckingRef = useRef(false)

  const checkDeadlines = useCallback(async () => {
    if (isCheckingRef.current || !user) return
    isCheckingRef.current = true

    try {
      const now = new Date()
      // Look ahead up to 24 hours to find pending deadlines
      const todayStr = now.toISOString().split('T')[0]
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .in('category', ['deadline', 'assignment', 'exam', 'quiz', 'project', 'thesis', 'capstone', 'event'])
        .gte('date', todayStr)
        .lte('date', tomorrowStr)
        .neq('status', 'completed')
        .neq('status', 'cancelled')

      if (error || !events) return

      for (const event of events) {
        // Construct full deadline Date
        const timePart = event.time || '23:59:00'
        const deadlineDate = new Date(`${event.date}T${timePart}`)
        const timeDiffMs = deadlineDate.getTime() - now.getTime()

        const THREE_HOURS_MS = 3 * 60 * 60 * 1000

        // If the deadline is within the 3-hour window (between 0 and 3 hours left)
        if (timeDiffMs > 0 && timeDiffMs <= THREE_HOURS_MS) {
          const storageKey = `cd_alerted_3h_${event.id}`
          const alreadyAlerted = localStorage.getItem(storageKey)

          if (!alreadyAlerted) {
            // Mark as alerted so it sounds only once
            localStorage.setItem(storageKey, Date.now().toString())

            const minsLeftTotal = Math.max(1, Math.round(timeDiffMs / (60 * 1000)))
            const hoursLeft = Math.floor(minsLeftTotal / 60)
            const minsLeft = minsLeftTotal % 60
            const timeRemainingText = hoursLeft > 0
              ? `${hoursLeft}h ${minsLeft}m remaining`
              : `${minsLeft} minutes remaining`

            const coursePrefix = event.course ? `[${event.course}] ` : ''

            // 1. Play Audio Alarm Chime
            playAlarmSound()

            // 2. Trigger Device Vibration if supported
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200, 100, 300])
            }

            // 3. Trigger Native Browser Push Notification
            if ('Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(`⏰ Deadline Alarm (3 Hours Left)`, {
                  body: `${coursePrefix}${event.title} is due in ${timeRemainingText}! (${event.time ? formatTime(event.time) : 'Today'})`,
                  icon: '/logo.png',
                  tag: `deadline-3h-${event.id}`,
                  requireInteraction: true,
                })
              } catch (e) {
                console.warn('Push notification failed:', e)
              }
            }

            // 4. Save In-App Notification to Database
            await supabase.from('notifications').insert({
              user_id: user.id,
              title: `⏰ Urgent: ${coursePrefix}${event.title}`,
              body: `Due in ${timeRemainingText} at ${event.time ? formatTime(event.time) : 'end of today'}. Make sure to submit!`,
              type: 'deadline',
              ref_id: event.id,
              read: false,
            })
          }
        }
      }
    } catch (e) {
      console.warn('Error checking deadline alarm:', e)
    } finally {
      isCheckingRef.current = false
    }
  }, [user])

  useEffect(() => {
    // Check immediately on mount/login
    checkDeadlines()

    // Run interval every 60 seconds
    const interval = setInterval(checkDeadlines, 60 * 1000)

    // Also check whenever tab becomes visible again
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkDeadlines()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [checkDeadlines])

  return { checkDeadlines, playAlarmSound }
}
