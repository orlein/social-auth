import { KakaoAccountService } from '@/auth/account/kakao-account.service';
import { Controller, Get, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Controller('api/v1/auth/kakao')
export class KakaoAccountController {
  private readonly frontendUrl: string;

  constructor(
    private readonly kakaoAccountService: KakaoAccountService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get('FRONTEND_URL');
  }

  @Get()
  async redirectToKakao(@Res() res: Response) {
    const url = this.kakaoAccountService.getKakaoAuthURL();
    return res.redirect(url);
  }

  @Get('callback')
  async handleKakaoCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    try {
      if (code) {
        const accessToken = await this.kakaoAccountService.authenticate(code);
        return res.redirect(
          `${this.frontendUrl}/api/auth?accessToken=${accessToken}`,
        );
      }

      return {
        error,
        errorDescription,
      };
    } catch (error) {
      return res.redirect(
        `${this.frontendUrl}/api/auth?error=${error.message}`,
      );
    }
  }
}
