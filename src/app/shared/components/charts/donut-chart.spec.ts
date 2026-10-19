import { DonutChart } from './donut-chart';

describe('DonutChart', () => {
  it('reports no data when all segments are zero', () => {
    const chart = new DonutChart();
    chart.segments = [{ label: 'A', value: 0, color: '#000' }];
    expect(chart.hasData()).toBe(false);
    expect(chart.segmentViews()).toEqual([]);
  });

  it('computes cumulative dash offsets as percentages', () => {
    const chart = new DonutChart();
    chart.segments = [
      { label: 'A', value: 3, color: '#000' },
      { label: 'B', value: 1, color: '#111' },
    ];

    const views = chart.segmentViews();
    expect(chart.hasData()).toBe(true);
    expect(views[0].dash).toBe('75 25');
    expect(views[0].offset).toBe('0');
    expect(views[1].dash).toBe('25 75');
    expect(views[1].offset).toBe('-75');
  });
});
