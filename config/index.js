import * as axios from 'axios';
import article from './article';
import getFlags from './flags';
import getOnwardJourney from './onward-journey';

export default async () => {
  const d = await article();
  const flags = await getFlags();
  const onwardJourney = await getOnwardJourney();
  const combinedEndpoint = `https://bertha.ig.ft.com/${process.env.REPUBLISH ? 'republish' : 'view'}/publish/gss/${process.env.SPREADSHEET_KEY}/polls,candidates`;

  const data = (await axios.get(combinedEndpoint)).data;

  return {
    ...d,
    flags,
    onwardJourney,
    data,
  };
};
