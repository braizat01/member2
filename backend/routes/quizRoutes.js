const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  startQuiz,
  submitAnswer,
  finishQuiz,
  getResults,
  getProgress,
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} = require('../controllers/quizController');

router.post('/quiz/start', authMiddleware, startQuiz);
router.post('/quiz/answer', authMiddleware, submitAnswer);
router.post('/quiz/finish', authMiddleware, finishQuiz);
router.get('/quiz/results/:id', authMiddleware, getResults);
router.get('/quiz/progress', authMiddleware, getProgress);

router.get('/questions', authMiddleware, getQuestions);
router.get('/questions/:id', authMiddleware, getQuestionById);
router.post('/questions', authMiddleware, createQuestion);
router.put('/questions/:id', authMiddleware, updateQuestion);
router.delete('/questions/:id', authMiddleware, deleteQuestion);

module.exports = router;
