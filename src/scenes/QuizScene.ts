/**
 * Quiz Scene
 *
 * Educational quiz interface where players answer questions to earn rewards.
 * Features:
 * - Multiple choice questions
 * - Optional timer
 * - Progress tracking
 * - Score calculation with rewards (XP, coins)
 */

import * as PIXI from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Button } from '../ui/Button';
import { quizService } from '../api/QuizService';
import { usePlayerStore } from '../state/playerStore';
import { GAME_CONFIG, SCENE_NAMES } from '../config/constants';
import type {
  QuizDetail,
  QuizQuestion,
  Answer,
  SubmitQuizResponse,
} from '../api/types';

export class QuizScene extends BaseScene {
  // Quiz data
  private quizId: number = 1; // TODO: Pass from OverworldScene
  private quizData: QuizDetail | null = null;
  private attemptId: number | null = null;
  private currentQuestionIndex: number = 0;
  private selectedAnswers: Map<number, number[]> = new Map(); // questionId -> choice IDs
  private timerStartTime: number = 0;
  private useMockData: boolean = true; // Set to true for testing without backend (change to false when API is ready)

  // UI containers
  private headerContainer: PIXI.Container = new PIXI.Container();
  private questionContainer: PIXI.Container = new PIXI.Container();
  private choicesContainer: PIXI.Container = new PIXI.Container();
  private navigationContainer: PIXI.Container = new PIXI.Container();
  private resultsContainer: PIXI.Container = new PIXI.Container();

  // UI elements
  private titleText!: PIXI.Text;
  private progressText!: PIXI.Text;
  private timerText!: PIXI.Text;
  private questionText!: PIXI.Text;
  private choiceButtons: Button[] = [];
  private prevButton!: Button;
  private nextButton!: Button;
  private submitButton!: Button;
  private exitButton!: Button;

  // State flags
  private isShowingResults: boolean = false;
  private isLoading: boolean = false;

  async load(): Promise<void> {
    const { width, height } = this.getScreenSize();

    // Background
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, width, height);
    bg.fill({ color: GAME_CONFIG.COLORS.BACKGROUND });
    this.container.addChild(bg);

    // Setup UI containers
    this.headerContainer.y = 20;
    this.questionContainer.y = 120;
    this.choicesContainer.y = 300;
    this.navigationContainer.y = height - 100;
    this.resultsContainer.visible = false;

    this.container.addChild(this.headerContainer);
    this.container.addChild(this.questionContainer);
    this.container.addChild(this.choicesContainer);
    this.container.addChild(this.navigationContainer);
    this.container.addChild(this.resultsContainer);

    // Create header UI
    this.createHeader();

    // Create navigation UI
    this.createNavigation();

    // Show loading state
    this.showLoading();

    // Load quiz data
    try {
      console.log('[QuizScene] Loading quiz data for quiz ID:', this.quizId);

      if (this.useMockData) {
        console.log('[QuizScene] Using mock data for testing');
        this.loadMockQuizData();
        this.attemptId = 999; // Mock attempt ID
      } else {
        await this.loadQuizData();
        console.log('[QuizScene] Quiz data loaded successfully');

        console.log('[QuizScene] Starting quiz attempt...');
        await this.startQuizAttempt();
        console.log('[QuizScene] Quiz attempt started, attempt ID:', this.attemptId);
      }

      this.renderCurrentQuestion();
    } catch (error) {
      console.error('[QuizScene] Failed to load quiz:', error);

      // Show detailed error message
      let errorMessage = 'Failed to load quiz. ';
      if (error instanceof Error) {
        errorMessage += error.message;
      }

      this.showError(errorMessage);

      // Add a back button in case of error
      this.showErrorWithBackButton(errorMessage);
    }
  }

  private createHeader(): void {
    const { width } = this.getScreenSize();

    // Title
    this.titleText = new PIXI.Text({
      text: 'Loading...',
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: 24,
        fill: GAME_CONFIG.COLORS.TEXT,
      },
    });
    this.titleText.x = 20;
    this.titleText.y = 0;
    this.headerContainer.addChild(this.titleText);

    // Progress indicator
    this.progressText = new PIXI.Text({
      text: 'Question 0/0',
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: 16,
        fill: GAME_CONFIG.COLORS.SECONDARY,
      },
    });
    this.progressText.x = 20;
    this.progressText.y = 40;
    this.headerContainer.addChild(this.progressText);

    // Timer (optional)
    this.timerText = new PIXI.Text({
      text: '',
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: 16,
        fill: GAME_CONFIG.COLORS.WARNING,
      },
    });
    this.timerText.anchor.set(1, 0);
    this.timerText.x = width - 20;
    this.timerText.y = 40;
    this.headerContainer.addChild(this.timerText);

    // Exit button
    this.exitButton = new Button({
      text: 'X',
      width: 50,
      height: 50,
      backgroundColor: GAME_CONFIG.COLORS.DANGER,
      onClick: () => this.handleExit(),
    });
    this.exitButton.x = width - 70;
    this.exitButton.y = -10;
    this.headerContainer.addChild(this.exitButton);
  }

  private createNavigation(): void {
    const { width } = this.getScreenSize();

    // Previous button
    this.prevButton = new Button({
      text: '< PREV',
      width: 150,
      height: 50,
      onClick: () => this.goToPreviousQuestion(),
    });
    this.prevButton.x = 20;
    this.navigationContainer.addChild(this.prevButton);

    // Next button
    this.nextButton = new Button({
      text: 'NEXT >',
      width: 150,
      height: 50,
      onClick: () => this.goToNextQuestion(),
    });
    this.nextButton.x = width - 170;
    this.navigationContainer.addChild(this.nextButton);

    // Submit button (shown on last question)
    this.submitButton = new Button({
      text: 'SUBMIT',
      width: 200,
      height: 50,
      backgroundColor: GAME_CONFIG.COLORS.SUCCESS,
      onClick: () => {
        console.log('[QuizScene] Submit button onClick fired');
        this.handleSubmit();
      },
    });
    this.submitButton.x = (width - 200) / 2;
    this.submitButton.visible = false;
    this.navigationContainer.addChild(this.submitButton);
    console.log('[QuizScene] Submit button created at position:', this.submitButton.x);
  }

  private async loadQuizData(): Promise<void> {
    this.quizData = await quizService.getQuizDetail(this.quizId);
    this.titleText.text = this.quizData.title;
  }

  private async startQuizAttempt(): Promise<void> {
    const response = await quizService.startQuiz(this.quizId);
    this.attemptId = response.attempt_id;
    this.timerStartTime = Date.now();
  }

  private renderCurrentQuestion(): void {
    if (!this.quizData) return;

    const question = this.quizData.questions[this.currentQuestionIndex];
    const { width } = this.getScreenSize();

    // Clear previous question UI
    this.questionContainer.removeChildren();
    this.choicesContainer.removeChildren();
    this.choiceButtons = [];

    // Update progress
    this.progressText.text = `Question ${this.currentQuestionIndex + 1}/${this.quizData.questions.length}`;

    // Question text
    this.questionText = new PIXI.Text({
      text: question.question_text,
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: 18,
        fill: GAME_CONFIG.COLORS.TEXT,
        wordWrap: true,
        wordWrapWidth: width - 40,
      },
    });
    this.questionText.x = 20;
    this.questionText.y = 0;
    this.questionContainer.addChild(this.questionText);

    // Question type indicator
    const typeText = new PIXI.Text({
      text: this.getQuestionTypeLabel(question.question_type),
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: 12,
        fill: GAME_CONFIG.COLORS.SECONDARY,
      },
    });
    typeText.x = 20;
    typeText.y = this.questionText.height + 10;
    this.questionContainer.addChild(typeText);

    // Points indicator
    const pointsText = new PIXI.Text({
      text: `${question.points} points`,
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: 12,
        fill: GAME_CONFIG.COLORS.WARNING,
      },
    });
    pointsText.x = width - pointsText.width - 20;
    pointsText.y = this.questionText.height + 10;
    this.questionContainer.addChild(pointsText);

    // Render choices
    this.renderChoices(question);

    // Update navigation buttons
    this.updateNavigationButtons();
  }

  private renderChoices(question: QuizQuestion): void {
    const { width } = this.getScreenSize();
    const sortedChoices = [...question.choices].sort((a, b) => a.order_index - b.order_index);
    const selectedChoiceIds = this.selectedAnswers.get(question.id) || [];
    const isMultipleCorrect = question.question_type === 'multiple_correct';

    let yOffset = 0;

    sortedChoices.forEach((choice) => {
      const isSelected = selectedChoiceIds.includes(choice.id);

      const button = new Button({
        text: choice.choice_text,
        width: width - 40,
        height: 60,
        backgroundColor: isSelected ? GAME_CONFIG.COLORS.SECONDARY : GAME_CONFIG.COLORS.PRIMARY,
        onClick: () => this.handleChoiceSelect(question.id, choice.id, isMultipleCorrect),
      });
      button.x = 20;
      button.y = yOffset;

      this.choiceButtons.push(button);
      this.choicesContainer.addChild(button);

      yOffset += 70;
    });

    // Add instruction for multiple correct
    if (isMultipleCorrect) {
      const instructionText = new PIXI.Text({
        text: '(Select all that apply)',
        style: {
          fontFamily: GAME_CONFIG.FONTS.PIXEL,
          fontSize: 12,
          fill: GAME_CONFIG.COLORS.SECONDARY,
        },
      });
      instructionText.x = 20;
      instructionText.y = yOffset + 10;
      this.choicesContainer.addChild(instructionText);
    }
  }

  private getQuestionTypeLabel(type: string): string {
    switch (type) {
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'true_false':
        return 'True or False';
      case 'fill_blank':
        return 'Fill in the Blank';
      case 'multiple_correct':
        return 'Multiple Correct';
      default:
        return type;
    }
  }

  private handleChoiceSelect(questionId: number, choiceId: number, isMultipleCorrect: boolean): void {
    let selected = this.selectedAnswers.get(questionId) || [];

    if (isMultipleCorrect) {
      // Toggle selection for multiple correct
      if (selected.includes(choiceId)) {
        selected = selected.filter(id => id !== choiceId);
      } else {
        selected.push(choiceId);
      }
    } else {
      // Single selection only
      selected = [choiceId];
    }

    this.selectedAnswers.set(questionId, selected);

    // Re-render to show updated selection
    if (this.quizData) {
      this.renderCurrentQuestion();
    }
  }

  private updateNavigationButtons(): void {
    if (!this.quizData) return;

    const isFirstQuestion = this.currentQuestionIndex === 0;
    const isLastQuestion = this.currentQuestionIndex === this.quizData.questions.length - 1;

    this.prevButton.setEnabled(!isFirstQuestion);
    this.nextButton.visible = !isLastQuestion;
    this.submitButton.visible = isLastQuestion;

    // Ensure submit button is enabled when visible
    if (isLastQuestion) {
      this.submitButton.setEnabled(true);
      this.submitButton.eventMode = 'static';
      this.submitButton.cursor = 'pointer';
    }

    console.log('[QuizScene] Navigation updated:', {
      questionIndex: this.currentQuestionIndex,
      totalQuestions: this.quizData.questions.length,
      isLastQuestion,
      submitButtonVisible: this.submitButton.visible,
      submitButtonEventMode: this.submitButton.eventMode,
      submitButtonAlpha: this.submitButton.alpha
    });
  }

  private goToPreviousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.renderCurrentQuestion();
    }
  }

  private goToNextQuestion(): void {
    if (this.quizData && this.currentQuestionIndex < this.quizData.questions.length - 1) {
      this.currentQuestionIndex++;
      this.renderCurrentQuestion();
    }
  }

  private async handleSubmit(): Promise<void> {
    console.log('[QuizScene] Submit button clicked');

    if (this.isLoading || !this.quizData || !this.attemptId) {
      console.log('[QuizScene] Submit blocked:', {
        isLoading: this.isLoading,
        hasQuizData: !!this.quizData,
        hasAttemptId: !!this.attemptId
      });
      return;
    }

    // Check if all questions are answered
    const unansweredCount = this.quizData.questions.filter(
      q => !this.selectedAnswers.has(q.id) || this.selectedAnswers.get(q.id)!.length === 0
    ).length;

    console.log('[QuizScene] Unanswered questions:', unansweredCount);
    console.log('[QuizScene] Selected answers:', Array.from(this.selectedAnswers.entries()));

    if (unansweredCount > 0) {
      this.showError(`You have ${unansweredCount} unanswered question(s).`);
      return;
    }

    this.isLoading = true;
    this.submitButton.setEnabled(false);
    this.submitButton.setText('SUBMITTING...');

    try {
      let results: SubmitQuizResponse;

      if (this.useMockData) {
        // Use mock submission
        results = await this.handleMockSubmit();
      } else {
        // Build answers array
        const answers: Answer[] = Array.from(this.selectedAnswers.entries()).map(
          ([questionId, choiceIds]) => ({
            question_id: questionId,
            selected_choice_ids: choiceIds,
          })
        );

        // Submit quiz
        results = await quizService.submitQuiz(this.attemptId, answers);
      }

      // Update player store with rewards
      const playerStore = usePlayerStore.getState();
      if (results.rewards.experience_points > 0) {
        playerStore.addExperience(results.rewards.experience_points);
      }
      if (results.rewards.coins > 0) {
        playerStore.addCoins(results.rewards.coins);
      }

      // Show results
      this.showResults(results);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      this.showError('Failed to submit quiz. Please try again.');
      this.submitButton.setEnabled(true);
      this.submitButton.setText('SUBMIT');
    } finally {
      this.isLoading = false;
    }
  }

  private showResults(results: SubmitQuizResponse): void {
    this.isShowingResults = true;

    // Hide other containers
    this.headerContainer.visible = false;
    this.questionContainer.visible = false;
    this.choicesContainer.visible = false;
    this.navigationContainer.visible = false;

    // Show results container
    this.resultsContainer.visible = true;
    this.resultsContainer.removeChildren();

    const { width, height } = this.getScreenSize();

    // Background panel
    const panel = new PIXI.Graphics();
    panel.rect(50, 100, width - 100, height - 200);
    panel.fill({ color: 0x2a2a3e });
    panel.stroke({ color: GAME_CONFIG.COLORS.PRIMARY, width: 3 });
    this.resultsContainer.addChild(panel);

    let yOffset = 120;

    // Title
    const titleText = new PIXI.Text({
      text: results.passed ? 'QUIZ PASSED!' : 'QUIZ FAILED',
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: 28,
        fill: results.passed ? GAME_CONFIG.COLORS.SUCCESS : GAME_CONFIG.COLORS.DANGER,
      },
    });
    titleText.x = (width - titleText.width) / 2;
    titleText.y = yOffset;
    this.resultsContainer.addChild(titleText);

    yOffset += 60;

    // Score
    const scoreText = new PIXI.Text({
      text: `Score: ${results.score} / ${results.max_score} (${results.percentage.toFixed(1)}%)`,
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: 20,
        fill: GAME_CONFIG.COLORS.TEXT,
      },
    });
    scoreText.x = (width - scoreText.width) / 2;
    scoreText.y = yOffset;
    this.resultsContainer.addChild(scoreText);

    yOffset += 50;

    // Time taken
    const timeText = new PIXI.Text({
      text: `Time: ${this.formatTime(results.time_taken)}`,
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: 16,
        fill: GAME_CONFIG.COLORS.SECONDARY,
      },
    });
    timeText.x = (width - timeText.width) / 2;
    timeText.y = yOffset;
    this.resultsContainer.addChild(timeText);

    yOffset += 50;

    // Rewards header
    const rewardsHeaderText = new PIXI.Text({
      text: 'REWARDS EARNED',
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: 18,
        fill: GAME_CONFIG.COLORS.WARNING,
      },
    });
    rewardsHeaderText.x = (width - rewardsHeaderText.width) / 2;
    rewardsHeaderText.y = yOffset;
    this.resultsContainer.addChild(rewardsHeaderText);

    yOffset += 40;

    // XP reward
    const xpText = new PIXI.Text({
      text: `+${results.rewards.experience_points} XP`,
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: 16,
        fill: GAME_CONFIG.COLORS.TEXT,
      },
    });
    xpText.x = (width - xpText.width) / 2;
    xpText.y = yOffset;
    this.resultsContainer.addChild(xpText);

    yOffset += 35;

    // Coins reward
    const coinsText = new PIXI.Text({
      text: `+${results.rewards.coins} Coins`,
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: 16,
        fill: GAME_CONFIG.COLORS.TEXT,
      },
    });
    coinsText.x = (width - coinsText.width) / 2;
    coinsText.y = yOffset;
    this.resultsContainer.addChild(coinsText);

    yOffset += 60;

    // Return button
    const returnButton = new Button({
      text: 'RETURN TO OVERWORLD',
      width: 350,
      height: 50,
      backgroundColor: GAME_CONFIG.COLORS.PRIMARY,
      onClick: () => this.returnToOverworld(),
    });
    returnButton.x = (width - 350) / 2;
    returnButton.y = yOffset;
    this.resultsContainer.addChild(returnButton);
  }

  private showLoading(): void {
    const { width, height } = this.getScreenSize();

    const loadingText = new PIXI.Text({
      text: 'Loading quiz...',
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: 20,
        fill: GAME_CONFIG.COLORS.TEXT,
      },
    });
    loadingText.anchor.set(0.5);
    loadingText.x = width / 2;
    loadingText.y = height / 2;
    this.questionContainer.addChild(loadingText);
  }

  private showError(message: string): void {
    const { width } = this.getScreenSize();

    // Remove any existing error
    const existingError = this.container.getChildByLabel('error');
    if (existingError) {
      this.container.removeChild(existingError);
    }

    const errorContainer = new PIXI.Container();
    errorContainer.label = 'error';

    const errorBg = new PIXI.Graphics();
    errorBg.rect(0, 0, width - 40, 60);
    errorBg.fill({ color: GAME_CONFIG.COLORS.DANGER, alpha: 0.9 });
    errorContainer.addChild(errorBg);

    const errorText = new PIXI.Text({
      text: message,
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: 14,
        fill: GAME_CONFIG.COLORS.TEXT,
        wordWrap: true,
        wordWrapWidth: width - 60,
      },
    });
    errorText.x = 10;
    errorText.y = 10;
    errorContainer.addChild(errorText);

    errorContainer.x = 20;
    errorContainer.y = 80;
    this.container.addChild(errorContainer);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (this.container.children.includes(errorContainer)) {
        this.container.removeChild(errorContainer);
      }
    }, 3000);
  }

  private showErrorWithBackButton(message: string): void {
    const { width, height } = this.getScreenSize();

    // Clear other containers
    this.questionContainer.removeChildren();
    this.choicesContainer.removeChildren();
    this.navigationContainer.removeChildren();

    // Create error display
    const errorPanel = new PIXI.Graphics();
    errorPanel.rect(50, height / 2 - 150, width - 100, 300);
    errorPanel.fill({ color: 0x2a2a3e });
    errorPanel.stroke({ color: GAME_CONFIG.COLORS.DANGER, width: 3 });
    this.questionContainer.addChild(errorPanel);

    const errorTitle = new PIXI.Text({
      text: 'ERROR',
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: 24,
        fill: GAME_CONFIG.COLORS.DANGER,
      },
    });
    errorTitle.x = (width - errorTitle.width) / 2;
    errorTitle.y = height / 2 - 120;
    this.questionContainer.addChild(errorTitle);

    const errorMessage = new PIXI.Text({
      text: message,
      style: {
        fontFamily: GAME_CONFIG.FONTS.PIXEL,
        fontSize: 14,
        fill: GAME_CONFIG.COLORS.TEXT,
        wordWrap: true,
        wordWrapWidth: width - 140,
      },
    });
    errorMessage.x = (width - errorMessage.width) / 2;
    errorMessage.y = height / 2 - 60;
    this.questionContainer.addChild(errorMessage);

    // Back to overworld button
    const backButton = new Button({
      text: 'BACK TO OVERWORLD',
      width: 300,
      height: 50,
      backgroundColor: GAME_CONFIG.COLORS.PRIMARY,
      onClick: () => this.returnToOverworld(),
    });
    backButton.x = (width - 300) / 2;
    backButton.y = height / 2 + 60;
    this.questionContainer.addChild(backButton);
  }

  private handleExit(): void {
    if (this.isShowingResults) {
      this.returnToOverworld();
    } else {
      // Confirm exit if quiz is in progress
      if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
        this.returnToOverworld();
      }
    }
  }

  private returnToOverworld(): void {
    this.sceneManager.loadScene(SCENE_NAMES.OVERWORLD);
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  update(_deltaTime: number): void {
    if (!this.isShowingResults && this.quizData?.time_limit_minutes) {
      // Update timer display
      const elapsedSeconds = Math.floor((Date.now() - this.timerStartTime) / 1000);
      const totalSeconds = this.quizData.time_limit_minutes * 60;
      const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

      this.timerText.text = `Time: ${this.formatTime(remainingSeconds)}`;

      // Check if time expired
      if (remainingSeconds <= 0) {
        this.handleSubmit();
      }

      // Warning color when time is running out
      if (remainingSeconds < 60) {
        this.timerText.style.fill = GAME_CONFIG.COLORS.DANGER;
      }
    }
  }

  async unload(): Promise<void> {
    // Clear all data
    this.quizData = null;
    this.attemptId = null;
    this.selectedAnswers.clear();
    this.choiceButtons = [];

    await super.unload();
  }

  /**
   * Set quiz ID before loading the scene
   * @param quizId - ID of quiz to load
   */
  setQuizId(quizId: number): void {
    this.quizId = quizId;
  }

  /**
   * Load mock quiz data for testing without backend
   */
  private loadMockQuizData(): void {
    this.quizData = {
      id: 1,
      title: 'Sample Math Quiz',
      description: 'Test your math skills!',
      subject: 'Mathematics',
      topic: 'Basic Arithmetic',
      difficulty_level: 'easy',
      time_limit_minutes: null,
      max_attempts: null,
      pass_threshold: 60,
      questions: [
        {
          id: 1,
          question_text: 'What is 2 + 2?',
          question_type: 'multiple_choice',
          points: 10,
          media_url: null,
          choices: [
            { id: 1, choice_text: '3', order_index: 0 },
            { id: 2, choice_text: '4', order_index: 1 },
            { id: 3, choice_text: '5', order_index: 2 },
            { id: 4, choice_text: '6', order_index: 3 },
          ],
        },
        {
          id: 2,
          question_text: 'What is 5 x 3?',
          question_type: 'multiple_choice',
          points: 10,
          media_url: null,
          choices: [
            { id: 5, choice_text: '12', order_index: 0 },
            { id: 6, choice_text: '15', order_index: 1 },
            { id: 7, choice_text: '18', order_index: 2 },
            { id: 8, choice_text: '20', order_index: 3 },
          ],
        },
        {
          id: 3,
          question_text: 'What is 10 - 4?',
          question_type: 'multiple_choice',
          points: 10,
          media_url: null,
          choices: [
            { id: 9, choice_text: '5', order_index: 0 },
            { id: 10, choice_text: '6', order_index: 1 },
            { id: 11, choice_text: '7', order_index: 2 },
            { id: 12, choice_text: '8', order_index: 3 },
          ],
        },
      ],
    };

    this.titleText.text = this.quizData.title;
  }

  /**
   * Handle mock quiz submission (for testing)
   */
  private async handleMockSubmit(): Promise<SubmitQuizResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Calculate mock score (just check if any answers were selected)
    const totalQuestions = this.quizData!.questions.length;
    const totalPoints = this.quizData!.questions.reduce((sum, q) => sum + q.points, 0);

    // Mock: give full points if answer was selected
    const score = this.selectedAnswers.size * (totalPoints / totalQuestions);
    const percentage = (score / totalPoints) * 100;
    const passed = percentage >= this.quizData!.pass_threshold;

    const mockResults: SubmitQuizResponse = {
      score: Math.floor(score),
      max_score: totalPoints,
      percentage: Math.floor(percentage),
      passed,
      time_taken: Math.floor((Date.now() - this.timerStartTime) / 1000),
      rewards: {
        experience_points: passed ? 100 : 50,
        coins: passed ? 50 : 25,
        items: [],
      },
      answers: this.quizData!.questions.map(q => ({
        question_id: q.id,
        is_correct: true, // Mock: always correct
        correct_answer: [q.choices[1].id], // Mock: second choice is always correct
        points_earned: q.points,
        explanation: null,
      })),
    };

    return mockResults;
  }
}
