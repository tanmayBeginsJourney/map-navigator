import { body, validationResult, ValidationError } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/shared';

/**
 * Validation rules for route calculation endpoint
 */
export const routeValidationRules = [
  body('startNodeId')
    .isString()
    .withMessage('startNodeId must be a string')
    .matches(/^\d+$/)
    .withMessage('startNodeId must be a string of digits')
    .isLength({ min: 1 })
    .withMessage('startNodeId cannot be empty'),
  
  body('endNodeId')
    .isString()
    .withMessage('endNodeId must be a string')
    .matches(/^\d+$/)
    .withMessage('endNodeId must be a string of digits')
    .isLength({ min: 1 })
    .withMessage('endNodeId cannot be empty'),
  
  body('accessibilityRequired')
    .optional()
    .toBoolean()
    .isBoolean()
    .withMessage('accessibilityRequired must be a boolean'),
    
  // Custom validation to ensure start and end nodes are different
  body('startNodeId').custom((value, { req }) => {
    if (value === req.body.endNodeId) {
      throw new Error('Start and end nodes cannot be the same');
    }
    return true;
  }),
];

/**
 * Middleware to check validation results and respond with errors if any
 */
export const checkValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Validation failed',
      details: errors.array().reduce((acc: Record<string, string[]>, error: ValidationError) => {
        const field = 'param' in error ? String(error.param) : 'unknown';
        if (!acc[field]) {
          acc[field] = [];
        }
        acc[field].push(error.msg);
        return acc;
      }, {}),
      timestamp: new Date().toISOString(),
    };
    
    res.status(400).json(errorResponse);
    return;
  }
  
  next();
}; 