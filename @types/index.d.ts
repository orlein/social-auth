import { AccountEntity } from '@/auth/account/account.entity';

// to make the file a module and avoid the TypeScript error
export {};

export declare global {
  namespace Express {
    export interface Request {
      /**
       * Used for authorization guard
       */
      account: AccountEntity;
    }
  }
}
