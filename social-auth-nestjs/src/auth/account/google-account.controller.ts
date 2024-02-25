import { GoogleAccountService } from '@/auth/account/google-account.service';
import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('api/v1/auth/google')
export class GoogleAccountController {
  constructor(private readonly googleAccountService: GoogleAccountService) {}

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
      `http://localhost:3000/api/auth?accessToken=${accessToken}`,
    );
  }
}
