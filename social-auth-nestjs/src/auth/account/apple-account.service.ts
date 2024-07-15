import { Injectable } from '@nestjs/common';

@Injectable()
export class AppleAccountService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
}
