/**
 * Quiz Service
 *
 * Handles all quiz-related API calls:
 * - Quiz list and details
 * - Starting quiz attempts
 * - Submitting quiz answers
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import type {
  GetQuizzesResponse,
  QuizDetail,
  StartQuizResponse,
  SubmitQuizRequest,
  SubmitQuizResponse,
} from './types';

export class QuizService {
  /**
   * Get list of available quizzes
   * @returns Promise with array of quizzes
   */
  async getQuizzes(): Promise<GetQuizzesResponse> {
    return apiClient.get<GetQuizzesResponse>(API_ENDPOINTS.quizzes.list);
  }

  /**
   * Get detailed quiz information including all questions
   * @param quizId - ID of the quiz to fetch
   * @returns Promise with full quiz details
   */
  async getQuizDetail(quizId: number): Promise<QuizDetail> {
    return apiClient.get<QuizDetail>(API_ENDPOINTS.quizzes.detail(quizId));
  }

  /**
   * Start a new quiz attempt
   * @param quizId - ID of the quiz to start
   * @returns Promise with attempt ID and timing info
   */
  async startQuiz(quizId: number): Promise<StartQuizResponse> {
    return apiClient.post<StartQuizResponse>(API_ENDPOINTS.quizzes.start(quizId), {});
  }

  /**
   * Submit completed quiz answers
   * @param attemptId - ID of the quiz attempt
   * @param answers - Array of answers with question IDs and selected choice IDs
   * @returns Promise with score, results, and rewards
   */
  async submitQuiz(
    attemptId: number,
    answers: SubmitQuizRequest['answers']
  ): Promise<SubmitQuizResponse> {
    return apiClient.post<SubmitQuizResponse>(
      API_ENDPOINTS.quizzes.submit(attemptId),
      { answers }
    );
  }
}

// Export singleton instance
export const quizService = new QuizService();
