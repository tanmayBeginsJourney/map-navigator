import { Request, Response, NextFunction } from 'express';
import { ZodError, z, ZodTypeAny } from 'zod';
import { ApiResponse } from '@campus-nav/shared/types';

interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export const validate =
  (schemas: ValidationSchemas) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationSchema = z.object({
        body: schemas.body || z.any(),
        query: schemas.query || z.any(),
        params: schemas.params || z.any(),
      });

      const parsed = await validationSchema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Attach parsed values to the request for subsequent handlers
      req.body = parsed.body;
      req.query = parsed.query;
      req.params = parsed.params;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorResponse: ApiResponse = {
          success: false,
          error: 'Validation failed',
          details: error.flatten().fieldErrors,
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(errorResponse);
        return;
      }
      // Handle other unexpected errors
      const unexpectedErrorResponse: ApiResponse = {
        success: false,
        error: 'An unexpected error occurred during validation',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(unexpectedErrorResponse);
    }
  }; 