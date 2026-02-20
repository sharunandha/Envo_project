const express = require('express');
const router = express.Router();
const riskController = require('../controllers/riskController');

router.post('/calculate', riskController.calculateRisk);
router.get('/all', riskController.getAllRisks);
router.get('/alerts', riskController.getAlerts);

module.exports = router;
