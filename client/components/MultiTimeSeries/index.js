// @flow

import * as d3 from 'd3';

type TimePoint = {
  date: Date,
  value: number,
};

type Line = {
  label: string,
  color: string,
  points: TimePoint[],
};

type Options = {
  container: Element,
  width: ?number,
  height: ?number,
  lines: Array<Line>,
  minDate: ?Date,
  maxDate: ?Date,
  minValue: ?number,
  maxValue: ?number,
}

export default class MultiTimeSeries {
  container: Element;
  height: ?number;
  width: ?number;
  lines: Array<Line>;
  minDate: Date;
  maxDate: Date;
  minValue: number;
  maxValue: number;

  constructor({ container, width, height, lines, minDate, maxDate, minValue, maxValue }: Options) {
    this.container = container;
    this.width = width;
    this.height = height;

    this.lines = lines.map(line => ({
      ...line,
      points: line.points.sort((a, b) => a.date - b.date),
    }));

    // determine the domain of dates, if not provided
    let realMinDate: ?Date = minDate;
    let realMaxDate: ?Date = maxDate;
    if (!realMinDate || !realMaxDate) {
      this.lines.forEach((line) => {
        line.points.forEach((point: TimePoint) => {
          if (!minDate && (!realMinDate || point.date < realMinDate)) realMinDate = point.date;
          if (!maxDate && (!realMaxDate || point.date > realMaxDate)) realMaxDate = point.date;
        });
      });
    }

    if (!realMinDate || !realMaxDate) throw new Error('Failed to determine date domain');

    this.minDate = realMinDate;
    this.maxDate = realMaxDate;

    // TODO auto-determine these from input if not supplied
    this.minValue = minValue;
    this.maxValue = maxValue;
  }

  setDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
    return this;
  }

  render() {
    const { container, height, width, lines, minDate, maxDate, minValue, maxValue } = this;

    if (!width || !height) throw new Error('Dimensions must be set first');

    // destroy previous rendering, if any, and create a new SVG element
    container.innerHTML = '';
    const svg = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    container.appendChild(svg.node());
    svg.attr('width', width);
    svg.attr('height', height);

    // determine chart dimensions - TODO: ensure right margin is big enough for biggest label?
    const margin = { top: 20, right: 100, bottom: 30, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // make a main container element
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // make x and y scales
    const xScale = d3.scaleTime().rangeRound([0, chartWidth]);
    const yScale = d3.scaleLinear().rangeRound([chartHeight, 0]);

    // make a path-drawing function
    const drawLine = d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
    ;

    // set the input domains
    xScale.domain([minDate, maxDate]);
    yScale.domain([minValue, maxValue]);

    // add x-axis along bottom
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .attr('class', 'x-axis')
      .call(d3.axisBottom(xScale))
    ;

    // add y-axis on left
    g.append('g')
      .call(d3.axisLeft(yScale))
      .attr('class', 'y-axis')
      .append('text')
        .attr('fill', '#000')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '0.71em')
        .attr('text-anchor', 'end')
        .text('Percentage')
    ;

    lines.forEach(({ points, color, label }) => {
      // draw this line
      g.append('path')
        .datum(points)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('stroke-width', 1.5)
        .attr('d', drawLine)
      ;

      // draw a dot at the end
      const lastPoint = points[points.length - 1];
      g.append('circle')
        .attr('fill', color)
        .attr('r', '4')
        .attr('cx', xScale(lastPoint.date))
        .attr('cy', yScale(lastPoint.value))
        .attr('stroke-width', '2')
        .attr('stroke', '#fff1e0') // TODO
      ;

      // draw a label at the end
      g.append('text')
        .attr('fill', color)
        .attr('x', xScale(lastPoint.date))
        .attr('y', yScale(lastPoint.value))
        .attr('font-size', '12px')
        .attr('dx', '8px')
        .attr('dy', '.3em')
        .text(`${lastPoint.value}%${label ? ` ${label}` : ''}`)
      ;
    });


    return this;
  }
}
