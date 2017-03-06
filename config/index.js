import * as axios from 'axios';
import article from './article';
import getFlags from './flags';
import getOnwardJourney from './onward-journey';
import makeRollingAverage from './makeRollingAverage';

export default async () => {
  const d = await article();
  const flags = await getFlags();
  const onwardJourney = await getOnwardJourney();
  const combinedEndpoint = `https://bertha.ig.ft.com/${process.env.REPUBLISH ? 'republish' : 'view'}/publish/gss/${process.env.SPREADSHEET_KEY}/candidates,round1,round2`;

  const data = (await axios.get(combinedEndpoint)).data;

  // sort all polls by date
  [data.round1, data.round2].forEach((sheet) => {
    sheet.sort((a, b) => new Date(a.date) - new Date(b.date));
  });

  return {
    ...d,
    flags,
    onwardJourney,
    data,

    charts: {
      round1: {
        lines: data.candidates.map(({ color, name, key }) => ({
          color,
          label: name.last,
          points: makeRollingAverage(data.round1, poll => poll.result[key]),
        })),
        minValue: 0,
        maxValue: 30,
      },

      round2: {
        // TODO use
        scenario1: {},
        scenario2: {},
      },
    },
  };
};
