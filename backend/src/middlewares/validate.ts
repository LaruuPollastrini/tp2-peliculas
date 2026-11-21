// Middlewares genericos y reusables: validan req.body o req.query contra un schema de Zod.
import { Request, Response, NextFunction } from "express";
import { z } from "zod";

function sendValidationError(res: Response, error: z.ZodError): void {
  const { formErrors, fieldErrors } = z.flattenError(error);
  res.status(400).json({
    success: false,
    error: {
      message: formErrors[0] ?? "Los datos enviados no son validos",
      details: fieldErrors,
    },
  });
}

export function validateBody(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      sendValidationError(res, result.error);
      return;
    }

    // Reemplaza el body por la version parseada: con defaults aplicados y tipos ya coercionados.
    req.body = result.data;
    next();
  };
}

// En Express 5 req.query es de solo lectura: el resultado parseado se guarda en res.locals.query.
export function validateQuery(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      sendValidationError(res, result.error);
      return;
    }

    res.locals.query = result.data;
    next();
  };
}
