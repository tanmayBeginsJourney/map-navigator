import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiResponse } from '@campus-nav/shared/types';

export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorResponse: ApiResponse = {
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(errorResponse);
        return;
      }
      // Handle other unexpected errors
      const unexpectedErrorResponse: ApiResponse = {
        success: false,
        error: 'An unexpected validation error occurred',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(unexpectedErrorResponse);
    }
  }; 