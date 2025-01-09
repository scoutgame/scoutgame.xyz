import { prisma } from '@charmverse/core/prisma-client';
async function query() {
  const scout = await prisma.formFieldAnswer.findMany({
    where: {}
  });
  console.log(scout.length);
  // find duplicate answers by fieldId and proposalId
  const answerMap = new Map<string, { id: string; value: any; type: string }[]>();
  scout.forEach((answer) => {
    const key = `${answer.fieldId}-${answer.proposalId}`;
    answerMap.set(key, (answerMap.get(key) || []).concat(answer));
  });
  // grab all answers with more than 1 value from the map
  const duplicateAnswers = Array.from(answerMap.values()).filter((answers) => answers.length > 1); // const duplicateAnswers = scout.filter((answer) => {
  //   const key = `${answer.fieldId}-${answer.proposalId}`;
  //   return answerMap.get(key)!.length > 1;
  // });
  console.log(duplicateAnswers.length);
  //prettyPrint(duplicateAnswers.slice(0, 10));
  const toDelelete = [];
  for (const answer of duplicateAnswers) {
    // find the answer with the highest value
    const highestValueAnswer = answer.reduce((highest, current) => {
      if (typeof current.value === 'string') {
        return highest.value > current.value ? highest : current;
      }
      if (current.value.contentText) {
        if (current.type === 'short_text') {
          return typeof current.value === 'string' ? current : highest;
        }
        return highest.value.contentText.length > current.value?.contentText.length
          ? highest
          : current.value
            ? current
            : highest;
      }
      return highest.value > current.value ? highest : current;
    });
    for (const a of answer) {
      if (a.id !== highestValueAnswer.id) {
        toDelelete.push(a.id);
      }
    }
  }
  console.log('to delete', toDelelete.length);
  // await prisma.formFieldAnswer.deleteMany({
  //   where: {
  //     id: {
  //       in: toDelelete
  //     }
  //   }
  // });
}

query();
