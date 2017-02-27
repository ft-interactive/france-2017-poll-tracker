import * as axios from 'axios';
import article from './article';
import getFlags from './flags';
import getOnwardJourney from './onward-journey';

export default async () => {
  const d = await article();
  const flags = await getFlags();
  const onwardJourney = await getOnwardJourney();
  const endpointProfiles = `https://bertha.ig.ft.com/${process.env.REPUBLISH ? 'republish' : 'view'}/publish/gss/${process.env.SPREADSHEET_PROFILES}/data`;
  const endpointPolls = `https://bertha.ig.ft.com/${process.env.REPUBLISH ? 'republish' : 'view'}/publish/gss/${process.env.SPREADSHEET_POLLS}/data,data_round2,microcopy`;

  const combinedEndpoint = `https://bertha.ig.ft.com/${process.env.REPUBLISH ? 'republish' : 'view'}/publish/gss/${process.env.SPREADSHEET_KEY}/polls,candidates`;
  /*
  An experimental demo that gets content from the API
  and overwrites some model values. This requires the Link File
  to have been published. Also next-es-interface.ft.com probably
  isn't a reliable source. Also this has no way to prevent development
  values being seen in productions... use with care.

  try {
    const a = (await axios(`https://next-es-interface.ft.com/content/${d.id}`)).data;
    d.headline = a.title;
    d.byline = a.byline;
    d.summary = a.summaries[0];
    d.title = d.title || a.title;
    d.description = d.description || a.summaries[1] || a.summaries[0];
    d.publishedDate = new Date(a.publishedDate);
    f.comments = a.comments;
  } catch (e) {
    console.log('Error getting content from content API');
  }

  */

  const combined = (await axios.get(combinedEndpoint)).data;
  const profiles = (await axios.get(endpointProfiles)).data;
  const polls = (await axios.get(endpointPolls)).data;
  profiles.pop(); // Remove Bayrou for now


  const data = {
    candidates: profiles,
    polls,
    microcopy: polls.microcopy,
  };

  return {
    ...d,
    flags,
    onwardJourney,
    data,
    pollingChartData: {
      series: combined.candidates.map(candidate => ({
        label: `${candidate.name.first} ${candidate.name.last}`,
        shortLabel: candidate.name.last,
        color: '#0000ff', // TODO
        values: combined.polls.reduce((accumulator, poll) => {
          const value = poll.result[candidate.key];

          if (value) {
            accumulator.push({
              date: poll.end, // TODO is this the right date to use?
              value,
            });
          }
          return accumulator;
        }, []),
      })),
      yDomain: [0, 60],
      xDomain: [],
    },
  };
};
