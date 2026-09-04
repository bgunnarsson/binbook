export interface CardProps {
  title?: string
  body?: string
  variant?: 'default' | 'elevated' | 'outlined'
}

// Styling comes from the project's own stylesheet injected into the canvas.
export default function Card({ title = 'Card title', body = 'Card body text.', variant = 'default' }: CardProps) {
  return (
    <article className={`card card--${variant}`}>
      <h3 className="card__title">{title}</h3>
      <p className="card__body">{body}</p>
    </article>
  )
}
