const fs = require('fs')
const path = require('path')

const ISSUE_TO_MEANING = {
  1: 'Deep Discharge',
  2: 'Overheating',
  3: 'Unknown Anomaly',
  4: 'Missing Data',
}

function generateMeasurements(baseCharge) {
  if (typeof baseCharge !== 'number') {
    return []
  }

  return Array.from({ length: 24 }, (_, index) => {
    const date = new Date(Date.now() - (23 - index) * 60 * 60 * 1000)
    const drift = Math.round(Math.sin(index / 3) * 6)
    const stateOfCharge = Math.max(0, Math.min(100, baseCharge + drift))

    return {
      timestamp: date.toISOString(),
      stateOfCharge,
    }
  })
}

function readBatteries() {
  const fullPath = path.join(process.cwd(), 'public', 'batteryAPI.json')
  const data = fs.readFileSync(fullPath, 'utf-8')
  const parsed = JSON.parse(data)

  return parsed.map((battery) => ({
    ...battery,
    recentIssues: Array.isArray(battery.recentIssues) ? battery.recentIssues : [],
  }))
}

module.exports = (req, res) => {
  try {
    const id = typeof req.query.id === 'string' ? req.query.id : ''
    const normalizedId = String(id)
    const batteries = readBatteries()

    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300')

    if (!id) {
      return res.status(200).json(batteries)
    }

    const battery = batteries.find((item) => String(item.id) === normalizedId)

    if (!battery) {
      return res.status(404).json({ message: 'Battery not found' })
    }

    return res.status(200).json({
      ...battery,
      issueLabels: battery.recentIssues.map((code) => ISSUE_TO_MEANING[code] || 'Unknown'),
      measurements: generateMeasurements(battery.stateOfCharge),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load battery data' })
  }
}
