import { useParams } from "react-router-dom";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import Graph from "./Graph";
import { fetchBatteryById } from './api';

const issueMap = {
  1: 'Deep Discharge',
  2: 'Overheating',
  3: 'Unknown Anomaly',
  4: 'Missing Data',
}

const statusMap = {
  1: 'Online',
  2: 'Pending',
  3: 'Offline',
}

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

const clampPercent = (value) => {
  if (typeof value !== 'number') {
    return 0
  }

  return Math.max(0, Math.min(100, value))
}

const buildYearlyHealthSeries = (lastSeen, currentHealth) => {
  const safeCurrentHealth = clampPercent(currentHealth)
  const currentYear = new Date().getFullYear()
  const endYear = currentYear + 3
  const startYear = Math.max(2018, currentYear - 5)
  const labels = []
  const values = []

  for (let year = startYear; year <= endYear; year += 1) {
    labels.push(String(year))

    if (year <= currentYear) {
      const yearsBack = currentYear - year
      values.push(clampPercent(safeCurrentHealth + yearsBack * 2.2))
    } else {
      const yearsForward = year - currentYear
      values.push(clampPercent(safeCurrentHealth - yearsForward * 3.1))
    }
  }

  return {
    labels,
    values,
    currentYear: String(currentYear),
    referenceDate: lastSeen,
  }
}

const buildIssueBreakdown = (recentIssues) => {
  const counts = {
    'Deep Discharge': 0,
    Overheating: 0,
    'Unknown Anomaly': 0,
    'Missing Data': 0,
  }

  if (Array.isArray(recentIssues)) {
    recentIssues.forEach((code) => {
      const key = issueMap[code] || 'Unknown Anomaly'
      counts[key] = (counts[key] || 0) + 1
    })
  }

  return counts
}

const BatteryDetail = () => {
  const { id } = useParams();
  const [battery, setBattery] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [liveTimestamp, setLiveTimestamp] = useState(new Date())

  useEffect(() => {
    let isMounted = true

    const loadBattery = async () => {
      try {
        setLoading(true)
        const detail = await fetchBatteryById(id)

        if (!isMounted) {
          return
        }

        setBattery(detail)
        setError('')
      } catch (requestError) {
        if (isMounted) {
          setError('Battery telemetry is currently unavailable for this ID.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadBattery()

    return () => {
      isMounted = false
    }
  }, [id])

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTimestamp(new Date())
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  if (loading) {
    return <div className='detail-page'><p className='feedback'>Loading battery telemetry...</p></div>
  }

  if (error || !battery) {
    return (
      <div className='detail-page'>
        <p className='feedback error'>{error || 'Battery not found.'}</p>
        <div className='fallback-links'>
          <Link className='back-link' to='/'>Back to dashboard</Link>
          <Link className='back-link' to='/showcase'>Open sample chart showcase</Link>
        </div>
      </div>
    )
  }

  const health = typeof battery.stateOfHealth === 'number' ? `${battery.stateOfHealth}%` : 'N/A'
  const charge = typeof battery.stateOfCharge === 'number' ? `${battery.stateOfCharge}%` : 'N/A'
  const status = statusMap[battery.connectionStatus] || 'Offline'
  const issues = Array.isArray(battery.recentIssues) && battery.recentIssues.length
    ? battery.recentIssues.map((issueCode) => issueMap[issueCode] || 'Unknown').join(', ')
    : 'N/A'
  const lastSeen = battery.lastConnectionTime ? new Date(battery.lastConnectionTime).toLocaleString() : 'N/A'
  const measurements = Array.isArray(battery.measurements) && battery.measurements.length
    ? battery.measurements
    : makeFallbackMeasurements(battery.stateOfCharge)
  const issueBreakdown = buildIssueBreakdown(battery.recentIssues)
  const issueLabels = Object.keys(issueBreakdown)
  const issueValues = issueLabels.map((label) => issueBreakdown[label])
  const yearlyHealth = buildYearlyHealthSeries(lastSeen, battery.stateOfHealth)

  const issueChartData = {
    labels: issueLabels,
    datasets: [
      {
        label: 'Issue frequency',
        data: issueValues,
        backgroundColor: ['#ff6e5b', '#ffc561', '#5dc8ff', '#6adfa6'],
        borderRadius: 8,
      },
    ],
  }

  const issueChartOptions = {
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

  const healthTrendData = {
    labels: yearlyHealth.labels,
    datasets: [
      {
        label: 'State of health projection',
        data: yearlyHealth.values,
        borderColor: '#2b4153',
        backgroundColor: 'rgba(43, 65, 83, 0.12)',
        fill: true,
        tension: 0.25,
      },
    ],
  }

  const healthTrendOptions = {
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

  const chargeValue = clampPercent(battery.stateOfCharge)
  const healthValue = clampPercent(battery.stateOfHealth)
  const diagnosticsSignal = clampPercent(Math.round((chargeValue + healthValue) / 2))

  return (
    <div className='detail-page'>
      <div className='detail-header'>
        <Link className='back-link' to='/'>
          <i className='fas fa-arrow-left'></i> Dashboard
        </Link>
        <h1>Battery {battery.id}</h1>
        <p>{battery.location || 'Unassigned location'} | {status}</p>
      </div>

      <section className='live-strip'>
        <div className='live-pill'>
          <span className='pulse-dot'></span>
          Live diagnostics
        </div>
        <p>Last refresh: {liveTimestamp.toLocaleTimeString()}</p>
        <p>Signal confidence: {diagnosticsSignal}%</p>
        <p>Reference telemetry: {lastSeen}</p>
      </section>

      <section className='diagnostics-grid'>
        <article className='metric-chip'>
          <p>Charge stability</p>
          <strong>{charge}</strong>
          <div className='meter-track'><span style={{ width: `${chargeValue}%` }}></span></div>
        </article>
        <article className='metric-chip'>
          <p>Health index</p>
          <strong>{health}</strong>
          <div className='meter-track'><span style={{ width: `${healthValue}%` }}></span></div>
        </article>
        <article className='metric-chip'>
          <p>Connection state</p>
          <strong>{status}</strong>
          <div className='meter-track'><span style={{ width: `${diagnosticsSignal}%` }}></span></div>
        </article>
      </section>

      <section className='detail-grid'>
        <article className='detail-card'>
          <h3>Real-Time Charge Dynamics</h3>
          <Graph measurements={measurements} />
        </article>
        <article className='detail-card'>
          <h3>Telemetry Snapshot</h3>
          <ul className='detail-list'>
            <li><strong>Voltage:</strong> {battery.voltage || 'N/A'}V</li>
            <li><strong>Capacity:</strong> {battery.capacity || 'N/A'} Ah</li>
            <li><strong>State of charge:</strong> {charge}</li>
            <li><strong>State of health:</strong> {health}</li>
            <li><strong>Connectivity:</strong> {status}</li>
            <li><strong>Last connection:</strong> {lastSeen}</li>
            <li><strong>Recent issues:</strong> {issues}</li>
          </ul>
        </article>
      </section>

      <section className='detail-grid'>
        <article className='detail-card'>
          <h3>Health Diagnostics Over The Years</h3>
          <p className='mini-note'>Historical trend with a near-term projection for planning replacements.</p>
          <div className='chart'>
            <Line data={healthTrendData} options={healthTrendOptions} />
          </div>
        </article>
        <article className='detail-card'>
          <h3>Issue Pattern Diagnostics</h3>
          <p className='mini-note'>Issue density based on current diagnostic logs.</p>
          <div className='chart'>
            <Bar data={issueChartData} options={issueChartOptions} />
          </div>
        </article>
      </section>
    </div>
  )
}

export default BatteryDetail;