import { NaverAccountService } from '@/auth/account/naver-account.service';
import { Controller, Get, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Controller('api/v1/auth/naver')
export class NaverAccountController {
  private readonly frontendUrl: string;

  constructor(
    private readonly naverAccountService: NaverAccountService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get('FRONTEND_URL');
  }

  @Get()
  async redirectToNaver(@Res() res: Response) {
    const url = this.naverAccountService.getNaverAuthURL();
    return res.redirect(url);
  }

  @Get('callback')
  async handleNaverCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    // { code, state } or {state, error, error_description }
    if (code) {
      const accessToken = await this.naverAccountService.authenticate(
        code,
        state,
      );

      return res.redirect(
        `${this.frontendUrl}/api/auth?accessToken=${accessToken}`,
      );
    }

    return {
      error,
      errorDescription,
    };
  }
}
