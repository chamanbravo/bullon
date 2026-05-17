import { useState } from 'react'
import { trpc } from '../trpc'

const STATUSES = ['active', 'waiting', 'completed', 'failed', 'delayed', 'paused'] as const
type Status = (typeof STATUSES)[number]

const PAGE_SIZE = 20

type Props = { queueName: string }

export function JobPanel({ queueName }: Props) {
  const [status, setStatus] = useState<Status>('waiting')
  const [page, setPage] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data, isLoading, error, isFetching } = trpc.queues.jobs.list.useQuery(
    { name: queueName, status, start: page * PAGE_SIZE, end: page * PAGE_SIZE + PAGE_SIZE },
    { refetchInterval: 10_000 },
  )

  const queueData = trpc.queues.get.useQuery({ name: queueName })

  function handleStatusChange(s: Status) {
    setStatus(s)
    setPage(0)
    setExpanded(null)
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => (prev === id ? null : id))
  }

  const counts = queueData.data?.counts ?? {}

  return (
    <div className="job-panel">
      <div className="panel-header">
        <h2 className="panel-title">{queueData.data?.displayName ?? queueName}</h2>
        {isFetching && <span className="fetching-indicator">↻</span>}
      </div>

      <div className="status-tabs">
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`tab${status === s ? ' active' : ''}`}
            onClick={() => handleStatusChange(s)}
          >
            {s}
            {counts[s] != null && counts[s]! > 0 && (
              <span className="tab-count">{counts[s]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="panel-body">
        {isLoading && <div className="panel-msg">Loading…</div>}
        {error && <div className="panel-msg error">{error.message}</div>}

        {data && data.length === 0 && (
          <div className="panel-msg">No {status} jobs</div>
        )}

        {data && data.length > 0 && (
          <>
            <table className="job-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Attempts</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {data.map((job) => (
                  <>
                    <tr
                      key={job.id}
                      className={`job-row${expanded === job.id ? ' expanded' : ''}`}
                      onClick={() => toggleExpand(job.id)}
                    >
                      <td className="job-id">{job.id}</td>
                      <td>{job.name}</td>
                      <td>{job.attemptsMade}</td>
                      <td>{new Date(job.timestamp).toLocaleString()}</td>
                    </tr>
                    {expanded === job.id && (
                      <tr key={`${job.id}-detail`} className="detail-row">
                        <td colSpan={4}>
                          <div className="job-detail">
                            {job.failedReason && (
                              <section className="detail-section error">
                                <strong>Error</strong>
                                <pre>{job.failedReason}</pre>
                              </section>
                            )}
                            {job.stacktrace && job.stacktrace.length > 0 && (
                              <section className="detail-section">
                                <strong>Stacktrace</strong>
                                <pre className="stacktrace">{job.stacktrace.join('\n')}</pre>
                              </section>
                            )}
                            <section className="detail-section">
                              <strong>Data</strong>
                              <pre>{JSON.stringify(job.data, null, 2)}</pre>
                            </section>
                            {job.returnValue !== undefined && (
                              <section className="detail-section">
                                <strong>Return value</strong>
                                <pre>{JSON.stringify(job.returnValue, null, 2)}</pre>
                              </section>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>

            <div className="pagination">
              <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                ← Previous
              </button>
              <span>Page {page + 1}</span>
              <button
                disabled={data.length < PAGE_SIZE}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
