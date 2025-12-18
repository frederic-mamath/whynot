import { Request, Response, NextFunction } from 'express';

export function logger(req: Request, res: Response, next: NextFunction) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const method = req.method;
  const route = req.originalUrl || req.url;
  
  console.log(`${timestamp} ${method} ${route}`);
  
  next();
}
