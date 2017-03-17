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
  keyDates: ?Array<{date: Date, label: string}>
}

let uniqueIdBase = 0;

export default class MultiTimeSeries {
  container: Element;
  height: ?number;
  width: ?number;
  lines: Array<Line>;
  minDate: Date;
  maxDate: Date;
  minValue: number;
  maxValue: number;
  keyDates: ?Array<{date: Date, label: string}>;
  uniqueId: number;

  constructor({
    container, width, height, lines,
    minDate, maxDate, minValue, maxValue,
    keyDates,
  }: Options) {
    this.container = container;
    this.width = width;
    this.height = height;
    this.keyDates = keyDates;

    this.uniqueId = uniqueIdBase;
    uniqueIdBase += 1;

    this.lines = lines.map(line => ({
      ...line,
      points: line.points.sort((a, b) => a.date - b.date),
    }));

    this.lines.sort((a, b) =>
      b.points[b.points.length - 1].value - a.points[a.points.length - 1].value,
    );

    // determine min and max dates, unless provided
    {
      let realMinDate = minDate;
      let realMaxDate = maxDate;
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
    }

    // determine min and max values, unless provided
    this.minValue = minValue || 0;
    this.maxValue = maxValue || 100;
  }

  setDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
    return this;
  }

  render() {
    const {
      container, height, width, lines,
      minDate, maxDate, minValue, maxValue,
      keyDates, uniqueId,
    } = this;

    if (!width || !height) throw new Error('Dimensions must be set first');

    // destroy previous rendering, if any, and create a new SVG element
    container.innerHTML = '';
    const svg = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    container.appendChild(svg.node());
    svg.attr('width', width);
    svg.attr('height', height);

    // determine chart dimensions - TODO: ensure right margin is big enough for biggest label?
    const margin = { top: 20, right: 60, bottom: 30, left: 20 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // add a clipping path for the chart area
    const clipPathId = `multi-time-series-${uniqueId}-clip-path`;
    svg.append('clipPath')
      .attr('id', clipPathId)
      .append('rect')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      // .attr('x', margin.left)
      // .attr('y', margin.top)
    ;

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

    // add background rectangle
    g.append('rect')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr('fill', '#fff4e7')
    ;

    // add x-axis along bottom
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .attr('class', 'x-axis')
      .call(d3.axisBottom(xScale).ticks(d3.timeMonth.every(1))
        .tickFormat(d3.timeFormat('%b')))
    ;

    // add y-axis
    {
      // first just use D3's generic y-axis
      const yAxisGroup = g.append('g')
        .call(d3.axisRight(yScale)
          .ticks(3)
          .tickSize(chartWidth))
        .attr('class', 'y-axis')
      ;

      // then hack it to look right
      yAxisGroup.select('.domain').remove();
      yAxisGroup.selectAll('.tick:not(:first-of-type) line')
        .attr('stroke', '#bbb')
        .attr('stroke-dasharray', '1,4');
      yAxisGroup.selectAll('.tick text')
        .attr('x', '-20')
        // .attr('dy', -4)
      ;
    }

    // add key date markers
    if (keyDates && keyDates.length) {
      keyDates.forEach(({ date, label }) => {
        const xPos = xScale(date);

        const keyDateGroup = g.append('g')
          .attr('class', 'key-date')
          .attr('transform', `translate(${xPos})`);

        keyDateGroup.append('line')
          .attr('x1', 0)
          .attr('y1', 0 - margin.top)
          .attr('x2', 0)
          .attr('y2', chartHeight)
          .attr('stroke', '#333')
          .attr('stroke-width', '1')
          .attr('stroke-dasharray', '5,5');

        keyDateGroup.append('text')
          .attr('font-size', '15')
          .attr('y', '-8')
          .attr('x', '3')
          .attr('fill', '#777')
          .text(label);
      });
    }

    // add lines for the time series
    let previousLabelPos = -Infinity;
    lines.forEach(({ points, color, label }) => {
      // draw this line
      g.append('path')
        .datum(points)
        .attr('fill', 'none')
        .attr('stroke', '#fff4e7')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('stroke-width', '6')
        .attr('class', 'multi-time-series__series-line-backer')
        .attr('d', drawLine)
        .attr('clip-path', `url(#${clipPathId})`)
      ;

      g.append('path')
        .datum(points)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('stroke-width', '3')
        .attr('class', 'multi-time-series__series-line')
        .attr('d', drawLine)
        .attr('clip-path', `url(#${clipPathId})`)
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
      const labelPos = yScale(lastPoint.value);
      g.append('text')
        .attr('fill', color)
        .attr('x', xScale(lastPoint.date))
        .attr('y', Math.max(labelPos, previousLabelPos + 15))
        .attr('font-size', '17px')
        .attr('font-weight', '600')
        .attr('dx', '8px')
        .attr('dy', '.3em')
        .text(`${lastPoint.value}%${label ? ` ${label}` : ''}`)
      ;
      previousLabelPos = labelPos;
    });

    return this;
  }
}
