'use client'

import { useEffect, useRef } from 'react'

export default function RevealOnScroll({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const addVisible = () => el.classList.add('reveal-visible')
          delay ? setTimeout(addVisible, delay) : addVisible()
          obs.disconnect()
        } else {
          // Arm the hide class — only applied when element is off-screen,
          // so no flash of invisible content for above-fold elements
          el.classList.add('will-reveal')
        }
      },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [delay])

  return <div ref={ref} className={className}>{children}</div>
}
