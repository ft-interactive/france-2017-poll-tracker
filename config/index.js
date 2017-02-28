import * as axios from 'axios';
import article from './article';
import getFlags from './flags';
import getOnwardJourney from './onward-journey';

export default async () => {
  const d = await article();
  const flags = await getFlags();
  const onwardJourney = await getOnwardJourney();
  const combinedEndpoint = `https://bertha.ig.ft.com/${process.env.REPUBLISH ? 'republish' : 'view'}/publish/gss/${process.env.SPREADSHEET_KEY}/candidates,round1,round2`;

  const data = (await axios.get(combinedEndpoint)).data;

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
          points: data.round1.reduce((result, poll) => {
            // TODO adjust value with weighting logic

            const value = poll.result[key];

            if (value) {
              result.push({
                date: poll.date,
                value,
              });
            }

            return result;
          }, []),
        })),
        minValue: 0,
        maxValue: 60,
      },

      round2: {
        // TODO
        scenario1: {},
        scenario2: {},
      },
    },
  };
};
