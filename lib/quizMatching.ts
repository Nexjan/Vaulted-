import { listings } from './listingsService';
import { Listing, QuizAnswers } from './types';

export function rankListings(answers: QuizAnswers): (Listing & { quizScore: number })[] {
  return [...listings]
    .map((l) => {
      const tags = l.quizTags;
      if (!tags) return { ...l, quizScore: 0 };
      let score = 0;
      if (tags.vibe.includes(answers.vibe)) score++;
      if (tags.setting.includes(answers.setting)) score++;
      if (tags.moment.includes(answers.moment)) score++;
      if (tags.group.includes(answers.group)) score++;
      if (tags.detail.includes(answers.detail)) score++;
      return { ...l, quizScore: score };
    })
    .sort((a, b) => b.quizScore - a.quizScore || b.rating - a.rating);
}
