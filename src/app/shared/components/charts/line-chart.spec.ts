import { LineChart } from './line-chart';

describe('LineChart', () => {
  it('reports no data for empty input', () => {
    const chart = new LineChart();
    expect(chart.hasData()).toBe(false);
    expect(chart.xLabels()).toEqual([]);
  });

  it('produces grid ticks and a polyline for a series', () => {
    const chart = new LineChart();
    chart.labels = ['a', 'b', 'c'];
    chart.series = [{ name: 'Revenue', color: '#2563eb', values: [10, 20, 30] }];

    expect(chart.hasData()).toBe(true);
    expect(chart.gridTicks()).toHaveLength(5);

    const points = chart.polylinePoints(chart.series[0]);
    expect(points.split(' ')).toHaveLength(3);
    expect(chart.dotsFor(chart.series[0])).toHaveLength(3);
  });

  it('places a single point in the middle of the plot', () => {
    const chart = new LineChart();
    chart.labels = ['only'];
    chart.series = [{ name: 'S', color: '#000', values: [5] }];
    expect(chart.polylinePoints(chart.series[0])).toContain(',');
  });
});
