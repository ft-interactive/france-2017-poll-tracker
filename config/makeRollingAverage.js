/*
  Calculates rolling average.

  TODO: remove highest and lowest from the 7 to get 5 values for averaging.

  could be more elegant
*/

export default (polls, selectValue, decayFactor = 0.85) => {
  const result = [];

  for (let i = polls.length - 1; i >= 0; i -= 1) {
    const poll = polls[i];
    const rawValue = selectValue(poll);
    const date = new Date(poll.date);

    if (rawValue) {
      const accumulation = [];

      // grab previous 6 values from unique pollsters, too
      const encounteredPollsters = new Set();
      let j = i;
      while (j >= 0 && accumulation.length < 7) {
        const previousPoll = polls[j];
        const previousPollDate = new Date(previousPoll.date);
        const previousPollValueForCandidate = selectValue(previousPoll);

        if (
          previousPollValueForCandidate &&
          !encounteredPollsters.has(previousPoll.pollster)
        ) {
          encounteredPollsters.add(previousPoll.pollster);

          const numDaysAgo = (date.getTime() - previousPollDate.getTime()) / (1000 * 60 * 60 * 24);

          accumulation.push({
            value: previousPollValueForCandidate,
            weight: decayFactor ** numDaysAgo,
          });
        }

        j -= 1;
      }

      // work out the weighted average
      let value;
      {
        // determine total weights
        const weightsTotal = accumulation.reduce((total, item) => total + item.weight, 0);

        value = accumulation.reduce((total, item) =>
          total + (item.value * (item.weight / weightsTotal)),
          0,
        );
      }

      result.push({
        date: poll.date,
        value,
      });
    }
  }

  return result;
};
