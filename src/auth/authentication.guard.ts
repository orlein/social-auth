import { AccountService } from '@/auth/account/account.service';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    @Inject(forwardRef(() => AccountService))
    private readonly accountService: AccountService,
    private reflector: Reflector,
  ) {}

  /**
   * extract access token from header or body, if not found returns undefined
   * @param request
   * @returns access token or undefined
   */
  private extractAccessToken(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    const accessToken =
      type?.toLowerCase() === 'bearer'
        ? token
        : (request?.body?.accessToken as string | undefined);
    return accessToken;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const accessToken = this.extractAccessToken(request);

    if (!accessToken) {
      // alert: the 'Unauthorized' is a mistake from the HTTP spec.
      throw new UnauthorizedException();
    }

    // throws exception inside this method
    const account = await this.accountService.authenticate(accessToken);

    // Used for authorization guard
    request.account = account;

    return true;
  }
}
