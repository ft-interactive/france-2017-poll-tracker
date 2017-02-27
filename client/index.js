import * as expander from 'o-expander'; // eslint-disable-line
import PollingChart from './components/PollingChart';

expander.init(null, {
  expandedToggleText: 'Show fewer polls',
  collapsedToggleText: 'Show more polls',
});

PollingChart.init();
