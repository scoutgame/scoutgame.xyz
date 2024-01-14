import type { ProposalEvaluation } from '@charmverse/core/prisma-client';

import type { AnswerData } from 'lib/proposal/rubric/aggregateResults';
import { aggregateResults } from 'lib/proposal/rubric/aggregateResults';

import type { CardPropertyValue } from './card';
import type { ExtractedDatabaseProposalProperties } from './extractDatabaseProposalProperties';

export function generateResyncedProposalEvaluationForCard({
  properties,
  databaseProperties,
  rubricAnswers,
  rubricCriterias,
  currentStep,
  stepIndex
}: {
  properties: Record<string, CardPropertyValue>;
  databaseProperties: Partial<ExtractedDatabaseProposalProperties>;
  rubricCriterias: { id: string }[];
  rubricAnswers: AnswerData[];
  currentStep: Pick<ProposalEvaluation, 'id' | 'type' | 'title'>;
  stepIndex: number;
}) {
  const cardProperties = JSON.parse(JSON.stringify(properties)) as Record<string, CardPropertyValue>;
  const { allScores, reviewersResults } = aggregateResults({
    answers: rubricAnswers.filter((a) => a.evaluationId === currentStep.id),
    criterias: rubricCriterias.filter((c) => c.id !== currentStep.id)
  });

  const uniqueReviewers = Object.keys(reviewersResults);

  if (databaseProperties.proposalEvaluationAverage) {
    const propertyValue = cardProperties[databaseProperties.proposalEvaluationAverage.id] as
      | string
      | { title: string; value: number | null }[];
    if (Array.isArray(propertyValue)) {
      if (propertyValue.length < stepIndex + 1) {
        propertyValue.push({
          title: currentStep.title,
          value: allScores.average ?? null
        });
      } else {
        propertyValue[stepIndex] = {
          title: currentStep.title,
          value: allScores.average ?? null
        };
      }
    } else {
      cardProperties[databaseProperties.proposalEvaluationAverage.id] = [
        {
          title: currentStep.title,
          value: allScores.average ?? null
        }
      ] as any;
    }
  }

  if (databaseProperties.proposalEvaluationTotal) {
    const propertyValue = cardProperties[databaseProperties.proposalEvaluationTotal.id] as
      | string
      | { title: string; value: number | null }[];
    if (Array.isArray(propertyValue)) {
      if (propertyValue.length < stepIndex + 1) {
        propertyValue.push({
          title: currentStep.title,
          value: allScores.sum ?? null
        });
      } else {
        propertyValue[stepIndex] = {
          title: currentStep.title,
          value: allScores.sum ?? null
        };
      }
    } else {
      cardProperties[databaseProperties.proposalEvaluationTotal.id] = [
        {
          title: currentStep.title,
          value: allScores.sum ?? null
        }
      ] as any;
    }
  }

  if (databaseProperties.proposalEvaluatedBy) {
    const propertyValue = cardProperties[databaseProperties.proposalEvaluatedBy.id] as unknown as {
      title: string;
      value: string[];
    }[];

    if (Array.isArray(propertyValue)) {
      if (propertyValue.length < stepIndex + 1) {
        propertyValue.push({
          title: currentStep.title,
          value: uniqueReviewers
        });
      } else {
        propertyValue[stepIndex] = {
          title: currentStep.title,
          value: uniqueReviewers
        };
      }
    } else {
      cardProperties[databaseProperties.proposalEvaluatedBy.id] = [
        {
          title: currentStep.title,
          value: uniqueReviewers
        }
      ] as any;
    }
  }

  return cardProperties;
}
