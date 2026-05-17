import { trpc } from '../trpc'

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  waiting: '#f59e0b',
  completed: '#3b82f6',
  failed: '#ef4444',
  delayed: '#a855f7',
  paused: '#94a3b8',
}

type Props = {
  selected: string | null
  onSelect: (name: string) => void
}

export function QueueList({ selected, onSelect }: Props) {
  const { data, isLoading, error } = trpc.queues.list.useQuery(undefined, {
    refetchInterval: 10_000,
  })

  if (isLoading) return <div className="sidebar-msg">Loading…</div>
  if (error) return <div className="sidebar-msg error">{error.message}</div>
  if (!data?.length) return <div className="sidebar-msg">No queues configured</div>

  return (
    <ul className="queue-list">
      {data.map((queue) => {
        const nonZero = Object.entries(queue.counts ?? {}).filter(([, v]) => v > 0)
        return (
          <li
            key={queue.name}
            className={`queue-item${selected === queue.name ? ' active' : ''}`}
            onClick={() => onSelect(queue.name)}
          >
            <div className="queue-name">{queue.displayName}</div>
            <div className="queue-badges">
              {nonZero.length === 0 ? (
                <span className="badge empty">empty</span>
              ) : (
                nonZero.map(([status, count]) => (
                  <span
                    key={status}
                    className="badge"
                    style={{ background: STATUS_COLORS[status] ?? '#94a3b8' }}
                    title={status}
                  >
                    {count}
                  </span>
                ))
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
