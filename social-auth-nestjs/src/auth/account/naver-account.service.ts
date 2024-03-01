import { AccountService } from '@/auth/account/account.service';
import { SocialAccountEntity } from '@/auth/account/social-account.entity';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';

type NaverTokenParam =
  | {
      grant_type: 'authorization_code';
      client_id: string;
      client_secret: string;
      code: string;
      state: string;
    }
  | {
      grant_type: 'refresh_token';
      client_id: string;
      client_secret: string;
      refresh_token: string;
    }
  | {
      grant_type: 'delete';
      client_id: string;
      client_secret: string;
      access_token: string;
      service_provider: 'NAVER';
    };

@Injectable()
export class NaverAccountService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly accountService: AccountService,
    @InjectRepository(SocialAccountEntity)
    private readonly socialAccountRepository: Repository<SocialAccountEntity>,
  ) {
    this.clientId = this.configService.get('NAVER_CLIENT_ID');
    this.clientSecret = this.configService.get('NAVER_CLIENT_SECRET');
    this.redirectUri = this.configService.get('NAVER_REDIRECT_URI');
  }

  getNaverAuthURL() {
    const rootUrl = 'https://nid.naver.com/oauth2.0/authorize';
    // https://developers.naver.com/docs/login/devguide/devguide.md#3-4-2-%EB%84%A4%EC%9D%B4%EB%B2%84-%EB%A1%9C%EA%B7%B8%EC%9D%B8-%EC%97%B0%EB%8F%99-url-%EC%83%9D%EC%84%B1%ED%95%98%EA%B8%B0
    type RequestParam = {
      response_type: 'code';
      client_id: string;
      redirect_uri: string;
      state: string;
    };

    const options = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: randomBytes(16).toString('hex'),
    } satisfies RequestParam);

    return `${rootUrl}?${options.toString()}`;
  }

  private async exchangeCodeForToken(code: string, state: string) {
    // https://developers.naver.com/docs/login/devguide/devguide.md#3-4-4-%EC%A0%91%EA%B7%BC-%ED%86%A0%ED%81%B0-%EB%B0%9C%EA%B8%89-%EC%9A%94%EC%B2%AD

    const url = 'https://nid.naver.com/oauth2.0/token';
    const values: NaverTokenParam = {
      grant_type: 'authorization_code', // 발급
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      state,
    };

    try {
      const response = await axios.post<{
        access_token: string;
        refresh_token: string;
        token_type: 'Bearer' | 'MAC';
        expires_in: number; // seconds
        error?: string;
        error_description?: string;
      }>(url, new URLSearchParams(values).toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error('Failed to exchange code for token');
    }
  }

  private async getAccountInfo(
    accessToken: string,
    token_type: 'Bearer' | 'MAC' = 'Bearer',
  ) {
    const response = await axios.get<{
      resultcode: string;
      message: string;
      response: {
        id: string;
        nickname: string;
        name: string;
        email: string;
        gender: 'M' | 'F' | 'U';
        age: string;
        birthday: string;
        profile_image: string;
        birthyear: string;
        mobile: string;
      };
    }>('https://openapi.naver.com/v1/nid/me', {
      headers: {
        Authorization: `${token_type} ${accessToken}`,
      },
    });

    const [existingSocialAccount, existingAccount] = await Promise.all([
      this.socialAccountRepository.findOne({
        where: {
          id: response.data.response.id,
          provider: 'naver',
        },
      }),
      this.accountService.readByUniqueIdentifier({
        plainEmail: response.data.response.email,
      }),
    ]);

    if (existingSocialAccount && existingAccount) {
      return existingAccount;
    }

    if (!existingSocialAccount && existingAccount) {
      const newSocialAccount = this.socialAccountRepository.create({
        id: response.data.response.id,
        provider: 'naver',
        name: response.data.response.name,
        givenName: response.data.response.nickname,
        email: response.data.response.email,
        isVerified: true,
        photoUrl: response.data.response.profile_image,
        account: existingAccount,
      });

      await this.socialAccountRepository.save(newSocialAccount);
      return existingAccount;
    }

    // no existingAccount and so create a new account
    const randomPassword = randomBytes(16).toString('hex');
    const result = await this.accountService.signUp({
      plainEmail: response.data.response.email,
      plainPassword: randomPassword,
      passwordRepeat: randomPassword,
    });
    if (result.error) {
      throw result.error;
    }

    const newAccount = result.account;

    if (existingSocialAccount) {
      existingSocialAccount.account = newAccount;
      await this.socialAccountRepository.save(existingSocialAccount);
      return newAccount;
    }

    const newSocialAccount = this.socialAccountRepository.create({
      id: response.data.response.id,
      provider: 'naver',
      name: response.data.response.name,
      givenName: response.data.response.nickname,
      email: response.data.response.email,
      isVerified: true,
      photoUrl: response.data.response.profile_image,
      account: newAccount,
    });

    await this.socialAccountRepository.save(newSocialAccount);
    return newAccount;
  }

  async authenticate(code: string, state: string) {
    const tokenData = await this.exchangeCodeForToken(code, state);
    const account = await this.getAccountInfo(tokenData.access_token);
    const accessToken = this.accountService.generateAccessToken(account);
    return accessToken;
  }
}
