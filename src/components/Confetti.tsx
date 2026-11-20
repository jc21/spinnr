import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rot: number
  vr: number
  tilt: number
  vt: number
  shape: 'rect' | 'circle'
}

const COLORS = ['#818cf8', '#f472b6', '#fcd34d', '#34d399', '#60a5fa', '#fb7185', '#c084fc', '#ffffff']

/** Lightweight canvas confetti. Re-fires whenever `burst` changes to a non-zero value. */
export function Confetti({ burst }: { burst: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!burst) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const w = window.innerWidth
    const h = window.innerHeight
    const particles: Particle[] = []
    const cannon = (x: number, dir: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = (-60 - Math.random() * 30) * (Math.PI / 180)
        const speed = 9 + Math.random() * 11
        particles.push({
          x,
          y: h * 0.75,
          vx: Math.cos(angle) * speed * dir,
          vy: Math.sin(angle) * speed,
          size: 6 + Math.random() * 7,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          tilt: Math.random() * Math.PI,
          vt: 0.05 + Math.random() * 0.1,
          shape: Math.random() < 0.7 ? 'rect' : 'circle',
        })
      }
    }
    cannon(0, 1, 110)
    cannon(w, -1, 110)

    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      ctx.clearRect(0, 0, w, h)
      const fade = Math.max(0, 1 - Math.max(0, now - start - 2600) / 900)
      let alive = 0
      for (const p of particles) {
        p.vy += 0.28
        p.vx *= 0.985
        p.vy *= 0.985
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        p.tilt += p.vt
        if (p.y > h + 20) continue
        alive++
        ctx.save()
        ctx.globalAlpha = fade
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.scale(1, Math.cos(p.tilt))
        ctx.fillStyle = p.color
        if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }
      if (alive > 0 && fade > 0) raf = requestAnimationFrame(tick)
      else ctx.clearRect(0, 0, w, h)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [burst])

  return <canvas ref={canvasRef} className="confetti" aria-hidden />
}
