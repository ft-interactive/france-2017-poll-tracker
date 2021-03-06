// @flow

import MultiTimeSeries from './components/MultiTimeSeries';

oExpander['o-expander'].init(null, {
  expandedToggleText: 'Show fewer polls',
  collapsedToggleText: 'Show more polls',
});

// set up all charts
[...document.querySelectorAll('[data-multi-time-series]')].forEach((container) => {
  const json = container.getAttribute('data-multi-time-series');

  if (!json) return;

  const settings = JSON.parse(json);

  let oldWidth;
  let oldHeight;

  const chart = new MultiTimeSeries({
    container,
    ...settings,
    lines: settings.lines.map(line => ({
      ...line,
      points: line.points.map(point => ({ ...point, date: new Date(point.date) })),
    })),
    keyDates: settings.keyDates ?
      settings.keyDates.map(kd => ({ ...kd, date: new Date(kd.date) })) :
      undefined,
    minDate: settings.minDate ? new Date(settings.minDate) : undefined,
    maxDate: settings.maxDate ? new Date(settings.maxDate) : undefined,
  });

  // function to [re]size the chart to fit its container, so we can control it from CSS
  const setSizeAndRender = () => {
    const { width, height } = container.getBoundingClientRect();

    // only re-render if dimensions changed
    if (oldWidth !== width || oldHeight !== height) {
      oldWidth = width;
      oldHeight = height;

      chart.setDimensions(width, height).render();
    }
  };

  // handle viewport resizing
  {
    let frame;
    window.addEventListener('resize', () => {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = undefined;
      }

      frame = requestAnimationFrame(() => {
        setSizeAndRender();
      });
    });
  }

  // and once at startup
  setSizeAndRender();
});
