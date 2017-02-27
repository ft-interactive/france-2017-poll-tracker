/* eslint-disable import/prefer-default-export */

import * as d3 from 'd3';

export default class PollingChart {
  static init() {
    [...document.querySelectorAll('[data-polling-chart]')].forEach((container) => {
      console.log(container);
      const data = JSON.parse(container.getAttribute('data-polling-chart'));

      new PollingChart({
        container,
        series: data.series,
      }).render();

      // TODO hook up to resize
    });
  }

  constructor({ container, series }) {
    this.container = container;
    this.series = series;
  }

  render() {
    // console.log('rendering chart', this);
    const { container, series } = this;
    container.innerHTML = '';

    const data = series[0].values.map(value => ({
      date: new Date(value.date),
      value: Number(value.value),
    })); // TODO

    console.log('data', data);

    const svg = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    container.appendChild(svg.node());

    const TOTAL_WIDTH = 960;
    const TOTAL_HEIGHT = 500;
    svg.attr('width', TOTAL_WIDTH);
    svg.attr('height', TOTAL_HEIGHT);

    svg.append('rect')
      .attr('x', '10')
      .attr('y', '10')
      .attr('width', '100')
      .attr('height', '100')
      .attr('fill', 'red')
    ;

    const margin = { top: 20, right: 20, bottom: 30, left: 50 },
      width = TOTAL_WIDTH - margin.left - margin.right,
      height = TOTAL_HEIGHT - margin.top - margin.bottom,
      g = svg.append('g').attr('transform', 'translate(' + margin.left + 'px,' + margin.top + 'px)');

    const x = d3.scaleTime().rangeRound([0, width]);

    const y = d3.scaleLinear().rangeRound([height, 0]);

    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.value));

    x.domain(d3.extent(data, d => d.date));
    y.domain(d3.extent(data, d => d.value));

    g.append('g')
        .attr('transform', 'translate(0,' + height + 'px)')
        .call(d3.axisBottom(x))
      .select('.domain')
        .remove();

    g.append('g')
        .call(d3.axisLeft(y))
      .append('text')
        .attr('fill', '#000')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '0.71em')
        .attr('text-anchor', 'end')
        .text('Price ($)');

    g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('stroke-width', 1.5)
        .attr('d', line);
  }
}
