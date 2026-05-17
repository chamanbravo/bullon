import { useState } from 'react'
import { QueueList } from './components/QueueList'
import { JobPanel } from './components/JobPanel'

export default function App() {
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null)

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="logo">Bullon</span>
        </div>
        <QueueList selected={selectedQueue} onSelect={setSelectedQueue} />
      </aside>
      <main className="main">
        {selectedQueue ? (
          <JobPanel queueName={selectedQueue} />
        ) : (
          <div className="empty-state">
            <p>Select a queue to view jobs</p>
          </div>
        )}
      </main>
    </div>
  )
}
