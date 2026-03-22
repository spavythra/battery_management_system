import React, { useMemo } from 'react'
import {Line} from 'react-chartjs-2'

function Graph({measurements}) {
  const chartData = useMemo(() => {
    if (!Array.isArray(measurements)) {
      return []
    }

    return measurements.map((item) => ({
      time: item.timestamp,
      charge: item.stateOfCharge == null ? 0 : item.stateOfCharge,
    }))
  }, [measurements])

  const data = {
    labels: chartData.map((item) => new Date(item.time).toLocaleTimeString()),
    datasets : [
        {
            label: "Battery Charge",
            data: chartData.map((item) => item.charge),
            borderColor: '#5dc8ff',
            backgroundColor: 'rgba(93, 200, 255, 0.22)',
            tension: 0.35,
            fill: true,
            borderWidth: 2,
            pointRadius: 1,
        }
    ]
}

const options = {
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  }

  if (!chartData.length) {
    return <p className='feedback'>No timeline measurements found for this battery.</p>
  }

  return (<div className='chart'>
    <Line data={data}
    options={options}
    />
    </div>
  )
}

export default Graph