import fs from 'fs';
import path from 'path';
import * as axios from 'axios';
import article from './article';
import getFlags from './flags';
import getOnwardJourney from './onward-journey';
import makeRollingAverage from './makeRollingAverage';

export default async () => {
  const articleData = await article();
  const flags = await getFlags();
  const onwardJourney = await getOnwardJourney();
  const combinedEndpoint = `https://bertha.ig.ft.com/${process.env.REPUBLISH ? 'republish' : 'view'}/publish/gss/${process.env.SPREADSHEET_KEY}/candidates,round1,round2,betting,byline,copy`;

  const data = (await axios.get(combinedEndpoint)).data;

  const byline = data.byline;

  const copy = {};
  data.copy.forEach(({ name, value }) => {
    copy[name] = value;
  });

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

  // order candidates by their latest polling average
  {
    const lastRound1Values = data.round1[data.round1.length - 1];
    data.candidates.sort((a, b) => (
      lastRound1Values.result[b.key] - lastRound1Values.result[a.key]
    ));
  }

  return {
    ...articleData,
    flags,
    onwardJourney,
    data,
    byline,
    copy,

    charts: {
      round1: {
        lines: data.candidates.map(({ color, name, key }) => ({
          color,
          label: name.last,
          points: makeRollingAverage(data.round1, poll => poll.result[key]),
        })),
        minValue: 0,
        maxValue: 30,
        maxDate: '2017-05-10',
        keyDates: [
          { date: '2017-04-23', label: '1st round' },
          { date: '2017-05-07', label: 'Run-off' },
        ],
        minDate: '2017-01-01',
      },

      round2: {
        scenario1: {
          lines: data.candidates
            .filter(({ key }) => key === 'macron' || key === 'lepen')
            .map(({ color, key }) => ({
              color,
              points: makeRollingAverage(data.round2, poll => poll.scenario1[key]),
            })),
          minValue: 20,
          maxValue: 80,
          minDate: '2017-02-01',
        },

        scenario2: {
          lines: data.candidates
            .filter(({ key }) => key === 'fillon' || key === 'lepen')
            .map(({ color, key }) => ({
              color,
              points: makeRollingAverage(data.round2, poll => poll.scenario2[key]),
            })),
          minValue: 20,
          maxValue: 80,
          minDate: '2017-02-01',
        },
      },
    },
  };
};
