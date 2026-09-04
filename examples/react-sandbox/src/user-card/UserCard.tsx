import { useQuery } from '@tanstack/react-query'

export interface UserCardProps {
  name?: string
}

// Uses TanStack Query's useQuery, which needs a QueryClient in context —
// supplied by the withQueryClient decorator (see user-card.binbook.json).
// `initialData` makes it render synchronously for SSR + hydration.
export default function UserCard({ name = 'Ada Lovelace' }: UserCardProps) {
  const { data } = useQuery({
    queryKey: ['role', name],
    queryFn: async () => 'Engineer',
    initialData: 'Member',
  })

  return (
    <article className="card">
      <h3 className="card__title">{name}</h3>
      <p className="card__body">
        Role: <span data-role>{data}</span>
      </p>
    </article>
  )
}
