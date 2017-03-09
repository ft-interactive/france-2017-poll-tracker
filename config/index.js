import fs from 'fs';
import path from 'path';
import * as axios from 'axios';
import article from './article';
import getFlags from './flags';
import getOnwardJourney from './onward-journey';
import makeRollingAverage from './makeRollingAverage';

export default async () => {
  const d = await article();
  const flags = await getFlags();
  const onwardJourney = await getOnwardJourney();
  const combinedEndpoint = `https://bertha.ig.ft.com/${process.env.REPUBLISH ? 'republish' : 'view'}/publish/gss/${process.env.SPREADSHEET_KEY}/candidates,round1,round2,options`;

  const data = (await axios.get(combinedEndpoint)).data;
  const byline = data.options.map(item => item.byline);
  // sort all polls by date
  [data.round1, data.round2].forEach((sheet) => {
    sheet.sort((a, b) => new Date(a.date) - new Date(b.date));
  });

  // make candidate colours available to SCSS
  {
    const lines = data.candidates.map(({ key, color }) => `${key}: ${color}`);

    const scss = `$candidates: (\n  ${lines.join(',\n  ')}\n);\n`;

    fs.writeFileSync(path.resolve(__dirname, '..', 'client', 'styles', '_candidate-vars.scss'), scss);
  }

  return {
    ...d,
    flags,
    onwardJourney,
    data,
    byline,

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
        scenario1: {
          lines: data.candidates
            .filter(({ key }) => key === 'macron' || key === 'lepen')
            .map(({ color, name, key }) => ({
              color,
              label: name.last,
              points: makeRollingAverage(data.round2, poll => poll.scenario1[key]),
            })),
          minValue: 0,
          maxValue: 100,
        },

        scenario2: {
          lines: data.candidates
            .filter(({ key }) => key === 'fillon' || key === 'lepen')
            .map(({ color, name, key }) => ({
              color,
              label: name.last,
              points: makeRollingAverage(data.round2, poll => poll.scenario2[key]),
            })),
          minValue: 0,
          maxValue: 100,
        },
      },
    },
  };
};
