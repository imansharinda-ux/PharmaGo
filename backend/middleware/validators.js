const { body, validationResult } = require('express-validator');

const check = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

exports.validateRegister = [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  check
];

exports.validateLogin = [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),
  check
];

exports.validateMedicine = [
  body('name').trim().notEmpty().withMessage('Medicine name is required'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a positive whole number'),
  check
];

exports.validateCheckout = [
  body('items').isArray({ min: 1 }).withMessage('Your cart is empty'),
  body('items.*.medicine_id').isInt().withMessage('Invalid product'),
  body('items.*.quantity').isInt({ min: 1, max: 50 }).withMessage('Quantity must be between 1 and 50'),
  body('customer_name').trim().isLength({ min: 3 }).withMessage('Please enter your full name'),
  body('phone').trim().matches(/^\+?\d[\d\s-]{8,}$/).withMessage('Please enter a valid mobile number'),
  body('address').trim().isLength({ min: 5 }).withMessage('Please enter your street address'),
  body('district').trim().notEmpty().withMessage('Please choose a district'),
  body('pay_method').isIn(['card', 'cod']).withMessage('Choose card or cash on delivery'),
  check
];

exports.validateStaff = [
  body('name').trim().isLength({ min: 3 }).withMessage('Enter a full name'),
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Set a temporary password of at least 6 characters'),
  body('role').isIn(['pharmacist', 'delivery', 'admin', 'rider']).withMessage('Choose a role'),
  check
];
