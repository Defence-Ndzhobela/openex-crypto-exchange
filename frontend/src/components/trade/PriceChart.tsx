import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface PriceChartProps {
  data: number[];
  height?: number;
  showAxes?: boolean;
}

export default function PriceChart({ data, height = 400, showAxes = true }: PriceChartProps) {
  const chartData = useMemo(() => ({
    labels: data.map((_, i) => i.toString()),
    datasets: [
      {
        fill: true,
        label: 'BTC/USD',
        data: data,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
      },
    ],
  }), [data]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#1a1a1a',
        titleColor: '#888',
        bodyColor: '#fff',
        borderColor: '#333',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: showAxes,
        grid: { display: false },
        ticks: { display: false },
      },
      y: {
        display: showAxes,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#888',
          font: { size: 10 },
          callback: (val) => `$${val.toLocaleString()}`,
        },
      },
    },
    hover: {
      mode: 'nearest',
      intersect: true,
    },
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
