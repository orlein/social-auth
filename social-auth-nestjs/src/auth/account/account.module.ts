import { AccountController } from '@/auth/account/account.controller';
import { AccountEntity } from '@/auth/account/account.entity';
import { AccountService } from '@/auth/account/account.service';
import { GoogleAccountController } from '@/auth/account/google-account.controller';
import { GoogleAccountService } from '@/auth/account/google-account.service';
import { NaverAccountController } from '@/auth/account/naver-account.controller';
import { NaverAccountService } from '@/auth/account/naver-account.service';
import { SocialAccountEntity } from '@/auth/account/social-account.entity';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountEntity, SocialAccountEntity]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
      }),
    }),
  ],
  providers: [AccountService, GoogleAccountService, NaverAccountService],
  controllers: [
    AccountController,
    GoogleAccountController,
    NaverAccountController,
  ],
  exports: [AccountService],
})
export class AccountModule {}
