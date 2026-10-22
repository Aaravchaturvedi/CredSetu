declare global {
  namespace Express {
    interface Request {
      /**
       * Set by the `authenticate` middleware after a valid JWT is verified.
       * It is optional because public routes do not have a user.
       */
      user?: {
        id: string;
      };
    }
  }
}

export {};
