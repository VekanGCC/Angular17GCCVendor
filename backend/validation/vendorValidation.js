const { body } = require('express-validator');

const validateVendorStep2 = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name cannot be more than 50 characters'),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name cannot be more than 50 characters'),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number')
];

const validateVendorStep3 = [
  body('address.street')
    .notEmpty()
    .withMessage('Street address is required'),
  body('address.city')
    .notEmpty()
    .withMessage('City is required'),
  body('address.state')
    .notEmpty()
    .withMessage('State is required'),
  body('address.zipCode')
    .notEmpty()
    .withMessage('Zip code is required')
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Please provide a valid zip code'),
  body('address.country')
    .notEmpty()
    .withMessage('Country is required')
];

const validateVendorStep4 = [
  body('businessInfo.companyName')
    .notEmpty()
    .withMessage('Company name is required'),
  body('businessInfo.businessType')
    .notEmpty()
    .withMessage('Business type is required'),
  body('businessInfo.businessLicense')
    .notEmpty()
    .withMessage('Business license is required'),
  body('businessInfo.taxId')
    .notEmpty()
    .withMessage('Tax ID is required'),
  body('businessInfo.website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL')
];

module.exports = {
  validateVendorStep2,
  validateVendorStep3,
  validateVendorStep4
};