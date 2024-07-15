import { AppleAccountService } from '@/auth/account/apple-account.service';
import { Controller, Get } from '@nestjs/common';

@Controller('api/v1/auth/apple')
export class AppleAccountController {
  constructor(private readonly appleAccountService: AppleAccountService) {}

  @Get()
  async appleLogin() {
    return 'Apple Login';
  }
}
