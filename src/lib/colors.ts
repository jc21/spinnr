interface SegmentColor {
  from: string
  to: string
  text: string
}

// Hand-tuned vivid gradients; text colour picked for contrast on each.
const PALETTE: SegmentColor[] = [
  { from: '#818cf8', to: '#4f46e5', text: '#ffffff' },
  { from: '#f472b6', to: '#db2777', text: '#ffffff' },
  { from: '#fcd34d', to: '#f59e0b', text: '#3b2300' },
  { from: '#34d399', to: '#059669', text: '#ffffff' },
  { from: '#60a5fa', to: '#2563eb', text: '#ffffff' },
  { from: '#fb7185', to: '#e11d48', text: '#ffffff' },
  { from: '#c084fc', to: '#9333ea', text: '#ffffff' },
  { from: '#5eead4', to: '#0d9488', text: '#042f2e' },
  { from: '#fdba74', to: '#ea580c', text: '#3b1500' },
  { from: '#67e8f9', to: '#0891b2', text: '#083344' },
  { from: '#f0abfc', to: '#c026d3', text: '#ffffff' },
  { from: '#bef264', to: '#65a30d', text: '#1a2e05' },
]

/** Colour for segment `index` of `count`, avoiding identical neighbours at the wrap-around. */
export function segmentColor(index: number, count: number): SegmentColor {
  let i = index % PALETTE.length
  if (count > 1 && index === count - 1 && i === 0) i = Math.floor(PALETTE.length / 2)
  return PALETTE[i]
}
