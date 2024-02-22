import { AccountEntity } from '@/auth/account/account.entity';
import { AccountService } from '@/auth/account/account.service';
import { SignInRequestDto } from '@/auth/account/sign-in.request.dto';
import { SignUpRequestDto } from '@/auth/account/sign-up.request.dto';
import { AuthenticationGuard } from '@/auth/authentication.guard';
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

@Controller('api/v1/auth/account')
@ApiTags('Account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post('/sign-up')
  async signUp(@Body() signUpRequestDto: SignUpRequestDto) {
    const signUpResult = await this.accountService.signUp(signUpRequestDto);
    if (signUpResult.error) {
      throw signUpResult.error;
    }
    const { account } = signUpResult;
    const accessToken = await this.accountService.generateAccessToken(account);
    const refreshToken = await this.accountService.generateRefreshToken(
      account,
    );
    return { accessToken, refreshToken };
  }

  @Post('/sign-in')
  async signIn(@Body() signInRequestDto: SignInRequestDto) {
    const account = await this.accountService.signIn(signInRequestDto);
    const accessToken = await this.accountService.generateAccessToken(account);
    const refreshToken = await this.accountService.generateRefreshToken(
      account,
    );
    return { accessToken, refreshToken };
  }

  @Get()
  async readAll(): Promise<AccountEntity[]> {
    return this.accountService.readAll();
  }

  @Get('/self')
  @ApiBearerAuth()
  @UseGuards(AuthenticationGuard)
  async readSelf(@Req() request: Request) {
    return request.account;
  }
}
