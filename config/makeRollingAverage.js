const round = (number, dp = 1) => Math.round(number * (10 ** dp)) / (10 ** dp);

export default (polls, selectValue, decayFactor = 0.75) => {
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

      // delete highest and lowest values
      if (accumulation.length >= 7) {
        let lowestValue = Infinity;
        let highestValue = -Infinity;
        let indexOfLowest;
        let indexOfHighest;

        accumulation.forEach(({ value }, index) => {
          if (value < lowestValue) {
            lowestValue = value;
            indexOfLowest = index;
          }
          if (value > highestValue) {
            highestValue = value;
            indexOfHighest = index;
          }
        });

        accumulation.splice(indexOfLowest, 1);
        accumulation.splice(indexOfHighest, 1);
      }

      // work out the weighted average of the remaining items
      const weightsTotal = accumulation.reduce((total, { weight }) => total + weight, 0);
      const weightedValue = accumulation.reduce((total, { value, weight }) =>
        total + (value * (weight / weightsTotal)),
        0,
      );

      result.push({
        date: poll.date,
        value: round(weightedValue),
      });
    }
  }

  return result;
};
