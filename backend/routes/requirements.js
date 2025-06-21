const express = require('express');
const router = express.Router();
const {
  getRequirements,
  getRequirement,
  createRequirement,
  updateRequirement,
  updateRequirementStatus,
  deleteRequirement
} = require('../controllers/requirementController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Requirement routes
router.route('/')
  .get(getRequirements)
  .post(createRequirement);

router.route('/:id')
  .get(getRequirement)
  .put(updateRequirement)
  .delete(deleteRequirement);

router.route('/:id/status')
  .put(updateRequirementStatus);

module.exports = router;