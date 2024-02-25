import { GoogleAccountService } from '@/auth/account/google-account.service';
import { Controller, Get, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Controller('api/v1/auth/google')
export class GoogleAccountController {
  private readonly frontendUrl: string;

  constructor(
    private readonly googleAccountService: GoogleAccountService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get('FRONTEND_URL');
  }

  @Get()
  async redirectToGoogle(@Res() res: Response) {
    const url = this.googleAccountService.getGoogleAuthURL();
    return res.redirect(url);
  }

  @Get('callback')
  async handleGoogleCallback(
    @Query('code') code: string,
    @Res() res: Response,
  ) {
    const accessToken = await this.googleAccountService.authenticate(code);

    return res.redirect(
      `${this.frontendUrl}/api/auth?accessToken=${accessToken}`,
    );
  }
}
