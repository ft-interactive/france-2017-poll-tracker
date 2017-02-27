/* eslint-disable import/prefer-default-export */

import * as d3 from 'd3';

export default class PollingChart {
  static init() {
    [...document.querySelectorAll('[data-polling-chart]')].forEach((container) => {
      const data = JSON.parse(container.getAttribute('data-polling-chart'));

      const chart = new PollingChart({
        container,
        data,
      })
      .setDimensions(container.offsetWidth, 400)
      .render();

      window.addEventListener('resize', () => {
        chart.setDimensions(container.offsetWidth, 400).render();
      });
    });
  }

  constructor({ container, data, yMax = 60 }) {
    this.container = container;

    this.polls = data.polls.map(poll => ({
      ...poll,
      date: new Date(poll.date),
    }));

    this.candidates = data.candidates;
    this.yMax = yMax;
  }

  setDimensions(width, height) {
    this.availableWidth = width;
    this.availableHeight = height;
    return this;
  }

  render() {
    const { container, polls, candidates, yMax, availableWidth, availableHeight } = this;

    // destroy previous render, if any
    container.innerHTML = '';

    const svg = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));

    container.appendChild(svg.node());

    svg.attr('width', availableWidth);
    svg.attr('height', availableHeight);

    const margin = { top: 20, right: 20, bottom: 30, left: 50 },
      width = availableWidth - margin.left - margin.right,
      height = availableHeight - margin.top - margin.bottom,
      g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    const x = d3.scaleTime().rangeRound([0, width]);

    const y = d3.scaleLinear().rangeRound([height, 0]);

    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.value));

    x.domain(d3.extent(polls, d => d.date));
    y.domain([0, yMax]);

    g.append('g')
        .attr('transform', `translate(0,${height})`)
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
        .text('Percentage');

    candidates.forEach((candidate) => {
      g.append('path')
        .datum(polls.reduce((accumulator, poll) => {
          const value = poll.result[candidate.key];

          if (value) {
            accumulator.push({
              date: poll.date,
              value,
            });
          }

          return accumulator;
        }, []))
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('stroke-width', 1.5)
        .attr('d', line);
    });

    return this;
  }
}
