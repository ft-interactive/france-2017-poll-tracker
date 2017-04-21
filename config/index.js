import fs from 'fs';
import path from 'path';
import bertha from 'bertha-client';
import Immutable from 'immutable';
import article from './article';
import getFlags from './flags';
import getOnwardJourney from './onward-journey';
import makeRollingAverage from './makeRollingAverage';

const spreadsheetKey = '1xrgs3nBLCuwz2UTmIUyLAmFPzp2yxSDQzyiFZN_TqRs' || process.env.SPREADSHEET_KEY;

export default async () => {
  const articleData = await article();
  const flags = await getFlags();
  const onwardJourney = await getOnwardJourney();

  const data = await bertha.get(spreadsheetKey, [
    'candidates',
    'round1',
    'round2',
    'betting',
    'byline',
    'copy',
    'interRoundCopy|object',
  ], { republish: Boolean(process.env.REPUBLISH) });

  const byline = data.byline;

  // const copy = {};
  // data.copy.forEach(({ name, value }) => {
  //   copy[name] = value;
  // });

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

  // calculate rolling averages for first chart up front
  const round1RollingAverages = data.candidates.reduce((result, { key }) => ({
    ...result,
    [key]: makeRollingAverage(data.round1, poll => poll.result[key]),
  }), {});

  // tell each candidate its latest polling average, and order them by it
  data.candidates = data.candidates
    .map(c => ({
      ...c,
      currentPollingAverage: round1RollingAverages[c.key][0].value,
    }))
    .sort((a, b) => (
      b.currentPollingAverage - a.currentPollingAverage
    ))
  ;

  const candidatesByKey = data.candidates.reduce((acc, candidate) => ({
    ...acc,
    [candidate.key]: candidate,
  }), {});

  // identify which scenario it turned out to be (messy, but works with original spreadsheet structure)
  const runOffCandidates = data.candidates.filter(c => c.runoff).map(c => c.key).sort();
  const actualRunOffScenarioNumber = [1, 2, 3, 4, 5, 6]
    .find(x => (
      Immutable.List(Object.keys(data.round2[0][`scenario${x}`])).isSuperset(
        Immutable.List(runOffCandidates),
      )
    ));

  const result = {
    ...articleData,
    flags,
    onwardJourney,
    data,
    byline,
    copy: data.interRoundCopy,

    charts: {
      runOff: {
        candidateA: candidatesByKey[runOffCandidates[0]],
        candidateB: candidatesByKey[runOffCandidates[1]],
        chartData: {
          lines: data.candidates
            .filter(({ key }) => key === runOffCandidates[0] || key === runOffCandidates[1])
            .map(({ color, key, name }) => ({
              color,
              points: makeRollingAverage(data.round2, poll => poll[`scenario${actualRunOffScenarioNumber}`][key]),
              label: name.last,
            })),
          minValue: 20,
          maxValue: 80,
          minDate: '2017-02-01',
          maxDate: '2017-05-20',

          keyDates: [
            { date: '2017-04-23', label: '1st round' },
            { date: '2017-05-07', label: 'Run-off' },
          ],
        },
      },

      round1: {
        lines: data.candidates.map(({ color, name, key }) => ({
          color,
          label: name.last,
          points: round1RollingAverages[key],
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

      // this array must correspond IN ORDER with the scenarioX columns on the round2 sheet
      // round2: [
      //   ['macron', 'lepen'], // scenario1
      //   ['fillon', 'lepen'], // scenario2
      //   ['melenchon', 'lepen'], // etc
      //   ['melenchon', 'fillon'],
      //   ['melenchon', 'macron'],
      //   ['macron', 'fillon'],
      // ].map(([candidateA, candidateB], i) => ({
      //   candidateA: candidatesByKey[candidateA],
      //   candidateB: candidatesByKey[candidateB],
      //   chartData: {
      //     lines: data.candidates
      //       .filter(({ key }) => key === candidateA || key === candidateB)
      //       .map(({ color, key }) => ({
      //         color,
      //         points: makeRollingAverage(data.round2, poll => poll[`scenario${i + 1}`][key]),
      //       })),
      //     minValue: 20,
      //     maxValue: 80,
      //     minDate: '2017-02-01',
      //   },
      // }), {}),
    },
  };

  // console.log('result', result.charts.round2);

  return result;
};
