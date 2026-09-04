import { useState } from 'react'

export interface CounterProps {
  label?: string
  start?: number
  step?: number
}

// A stateful component: it only "works" once the story is hydrated in the
// canvas — clicking updates React state with no server round-trip.
export default function Counter({ label = 'Count', start = 0, step = 1 }: CounterProps) {
  const [count, setCount] = useState(start)
  return (
    <div className="counter">
      <button
        type="button"
        className="btn btn--primary btn--md"
        onClick={() => setCount((c) => c - step)}
        aria-label="decrement"
      >
        −
      </button>
      <output className="counter__value" aria-label="count">
        {label}: {count}
      </output>
      <button
        type="button"
        className="btn btn--primary btn--md"
        onClick={() => setCount((c) => c + step)}
        aria-label="increment"
      >
        +
      </button>
    </div>
  )
}
