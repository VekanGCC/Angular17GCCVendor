const express = require('express');
const router = express.Router();
const {
  getResources,
  getResource,
  createResource,
  updateResource,
  deleteResource
} = require('../controllers/resourceController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Resource routes
router.route('/')
  .get(getResources)
  .post(createResource);

router.route('/:id')
  .get(getResource)
  .put(updateResource)
  .delete(deleteResource);

module.exports = router;