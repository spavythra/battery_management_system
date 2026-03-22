import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Line, Bar } from 'react-chartjs-2'
import Graph from './Graph'
import { fetchBatteries } from './api'

const makeFallbackMeasurements = (stateOfCharge) => {
  if (typeof stateOfCharge !== 'number') {
    return []
  }

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.now() - (11 - index) * 60 * 60 * 1000)
    const jitter = Math.round(Math.random() * 8 - 4)
    const value = Math.max(0, Math.min(100, stateOfCharge + jitter))

    return {
      timestamp: date.toISOString(),
      stateOfCharge: value,
    }
  })
}

const getIssueBuckets = (issues) => {
  const bucket = {
    'Deep Discharge': 0,
    Overheating: 0,
    'Unknown Anomaly': 0,
    'Missing Data': 0,
  }

  ;(issues || []).forEach((issueCode) => {
    if (issueCode === 1) {
      bucket['Deep Discharge'] += 1
    } else if (issueCode === 2) {
      bucket.Overheating += 1
    } else if (issueCode === 4) {
      bucket['Missing Data'] += 1
    } else {
      bucket['Unknown Anomaly'] += 1
    }
  })

  return bucket
}

const ShowcaseCharts = () => {
  const [batteries, setBatteries] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const list = await fetchBatteries()

        if (!isMounted) {
          return
        }

        setBatteries(list)
        setSelectedId(list[0] ? String(list[0].id) : '')
        setError('')
      } catch (requestError) {
        if (isMounted) {
          setError('Unable to load sample batteries for showcase.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [])

  const selectedBattery = useMemo(() => {
    return batteries.find((item) => String(item.id) === String(selectedId)) || null
  }, [batteries, selectedId])

  const measurements = useMemo(() => {
    if (!selectedBattery) {
      return []
    }

    if (Array.isArray(selectedBattery.measurements) && selectedBattery.measurements.length) {
      return selectedBattery.measurements
    }

    return makeFallbackMeasurements(selectedBattery.stateOfCharge)
  }, [selectedBattery])

  const issueData = useMemo(() => {
    if (!selectedBattery) {
      return null
    }

    const bucket = getIssueBuckets(selectedBattery.recentIssues)
    const labels = Object.keys(bucket)

    return {
      labels,
      datasets: [
        {
          label: 'Issue frequency',
          data: labels.map((label) => bucket[label]),
          backgroundColor: ['#ff6e5b', '#ffc561', '#5dc8ff', '#6adfa6'],
          borderRadius: 8,
        },
      ],
    }
  }, [selectedBattery])

  const chargeTrendData = useMemo(() => {
    if (!selectedBattery) {
      return null
    }

    const labels = measurements.map((point) => new Date(point.timestamp).toLocaleTimeString())

    return {
      labels,
      datasets: [
        {
          label: 'State of charge timeline',
          data: measurements.map((point) => point.stateOfCharge || 0),
          borderColor: '#2b4153',
          backgroundColor: 'rgba(43, 65, 83, 0.12)',
          fill: true,
          tension: 0.3,
        },
      ],
    }
  }, [measurements, selectedBattery])

  const trendOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`,
        },
      },
    },
  }

  const issueOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  }

  if (loading) {
    return (
      <div className='detail-page'>
        <p className='feedback'>Loading chart showcase...</p>
      </div>
    )
  }

  if (error || !selectedBattery) {
    return (
      <div className='detail-page'>
        <p className='feedback error'>{error || 'No battery is available for showcase.'}</p>
        <Link className='back-link' to='/'>Back to dashboard</Link>
      </div>
    )
  }

  return (
    <div className='detail-page'>
      <div className='detail-header'>
        <Link className='back-link' to='/'>
          <i className='fas fa-arrow-left'></i> Dashboard
        </Link>
        <h1>Chart Showcase</h1>
        <p>Pick a battery ID and preview sample telemetry visuals.</p>
      </div>

      <section className='showcase-controls'>
        <label htmlFor='showcase-id'>Select battery ID</label>
        <select
          id='showcase-id'
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
        >
          {batteries.map((item) => (
            <option key={item.id} value={item.id}>
              {item.id}
            </option>
          ))}
        </select>
        <Link className='showcase-open-link' to={`/battery/${selectedBattery.id}`}>
          Open full details for {selectedBattery.id}
        </Link>
      </section>

      <section className='detail-grid'>
        <article className='detail-card'>
          <h3>Sample Real-Time Charge Dynamics</h3>
          <Graph measurements={measurements} />
        </article>
        <article className='detail-card'>
          <h3>Sample Issue Pattern</h3>
          <div className='chart'>
            <Bar data={issueData} options={issueOptions} />
          </div>
        </article>
      </section>

      <section className='detail-grid'>
        <article className='detail-card'>
          <h3>Sample Charge Timeline</h3>
          <div className='chart'>
            <Line data={chargeTrendData} options={trendOptions} />
          </div>
        </article>
      </section>
    </div>
  )
}

export default ShowcaseCharts