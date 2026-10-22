import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validateBody } from '../../middleware/validate';
import {
  createLoanHandler,
  listLoansHandler,
  loanSummaryHandler,
  repayLoanHandler,
} from './loan.controller';
import { createLoanSchema } from './loan.schemas';

export const loanRouter = Router();

// Every loan route is private. Applying auth once here avoids forgetting it on
// an individual endpoint later.
loanRouter.use(authenticate);

loanRouter.post('/', validateBody(createLoanSchema), createLoanHandler);
loanRouter.get('/', listLoansHandler);
loanRouter.get('/summary', loanSummaryHandler);
loanRouter.patch('/:id/repay', repayLoanHandler);
