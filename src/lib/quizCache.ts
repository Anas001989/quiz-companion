/**
 * In-memory cache for quiz data (questions + options).
 * Prefetched on select-character so the questions page can show instantly.
 */
type CachedQuiz = {
  id: string;
  title: string;
  answerMode: string;
  attemptPolicy?: string;
  questions: Array<{
    id: string;
    text: string;
    type: string;
    questionImageUrl?: string | null;
    options: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
      answerImageUrl?: string | null;
    }>;
  }>;
};

const cache = new Map<string, CachedQuiz>();

export function getCachedQuiz(quizId: string): CachedQuiz | null {
  return cache.get(quizId) ?? null;
}

export function setCachedQuiz(quizId: string, quiz: CachedQuiz): void {
  cache.set(quizId, quiz);
}

export function clearCachedQuiz(quizId: string): void {
  cache.delete(quizId);
}

/** Prefetch quiz into cache; call from select-character page. */
export function prefetchQuiz(quizId: string): void {
  if (cache.has(quizId)) return;
  fetch(`/api/teacher/quiz/${quizId}/questions`)
    .then((res) => res.json())
    .then((data) => {
      if (data.quiz) setCachedQuiz(quizId, data.quiz);
    })
    .catch(() => {});
}
