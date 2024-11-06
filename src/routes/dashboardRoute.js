// routes/dashboardRoute.js

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/middleware');
const dashboardController = require('../controllers/dashboardController');

router.get('/', authMiddleware, dashboardController.renderDashboard);

module.exports = router;
