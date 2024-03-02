import { AccountService } from '@/auth/account/account.service';
import { SocialAccountEntity } from '@/auth/account/social-account.entity';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';

type KakaoTokenParam = {
  grant_type: 'authorization_code';
  client_id: string;
  redirect_uri: string;
  code: string;
  client_secret: string;
};

@Injectable()
export class KakaoAccountService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly accountService: AccountService,
    @InjectRepository(SocialAccountEntity)
    private readonly socialAccountRepository: Repository<SocialAccountEntity>,
  ) {
    this.clientId = this.configService.get('KAKAO_CLIENT_ID');
    this.clientSecret = this.configService.get('KAKAO_CLIENT_SECRET');
    this.redirectUri = this.configService.get('KAKAO_REDIRECT_URI');
  }

  getKakaoAuthURL() {
    const rootUrl = 'https://kauth.kakao.com/oauth/authorize';
    // https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#request-code-request-query
    type RequestParam = {
      client_id: string;
      redirect_uri: string;
      response_type: 'code';
    };

    const options = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
    } satisfies RequestParam);

    return `${rootUrl}?${options.toString()}`;
  }

  private async exchangeCodeForToken(code: string) {
    const tokenUrl = 'https://kauth.kakao.com/oauth/token';
    const data = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      code,
      redirect_uri: this.redirectUri,
      client_secret: this.clientSecret,
    } satisfies KakaoTokenParam);

    try {
      const response = await axios.post<{
        token_type: 'bearer';
        access_token: string;
        id_token?: string;
        expires_in: number;
        refresh_token: string;
        refresh_token_expires_in: number;
        scope?: string; // space separated
      }>(tokenUrl, data);
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error('Failed to exchange code for token');
    }
  }

  private async getAccountInfo(accessToken: string) {
    const response = await axios.get<{
      id: number;
      has_signed_up?: boolean;
      connected_at: string; // RFC3339 datetime
      synched_at: string; // RFC3339 datetime
      properties: {
        nickname: string;
        thumbnail_image: string;
        profile_image: string;
      };
      kakao_account: {
        profile_needs_agreement: boolean;
        profile: {
          nickname: string;
          thumbnail_image: string;
          profile_image: string;
        };
        is_email_valid: boolean;
        is_email_verified: boolean;
        email: string;
      };
    }>('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        secure_resource: true,
      },
    });

    console.log(response.data);

    const [existingSocialAccount, existingAccount] = await Promise.all([
      this.socialAccountRepository.findOne({
        where: {
          id: response.data.id.toString(),
          provider: 'kakao',
        },
      }),
      this.accountService.readByUniqueIdentifier({
        plainEmail: response.data.kakao_account.email,
      }),
    ]);

    if (existingSocialAccount && existingAccount) {
      return existingAccount;
    }

    if (!existingSocialAccount && existingAccount) {
      const newSocialAccount = this.socialAccountRepository.create({
        id: response.data.id.toString(),
        provider: 'kakao',
        name: response.data.kakao_account.profile.nickname,
        givenName: response.data.kakao_account.profile.nickname,
        email: response.data.kakao_account.email,
        isVerified: response.data.kakao_account.is_email_verified,
        photoUrl: response.data.kakao_account.profile.profile_image,
        account: existingAccount,
      });

      await this.socialAccountRepository.save(newSocialAccount);
      return existingAccount;
    }

    // no existingAccount and so create a new account
    const randomPassword = randomBytes(16).toString('hex');
    const result = await this.accountService.signUp({
      plainEmail: response.data.kakao_account.email,
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
      id: response.data.id.toString(),
      provider: 'kakao',
      name: response.data.kakao_account.profile.nickname,
      givenName: response.data.kakao_account.profile.nickname,
      email: response.data.kakao_account.email,
      isVerified: response.data.kakao_account.is_email_verified,
      photoUrl: response.data.kakao_account.profile.profile_image,
      account: newAccount,
    });

    await this.socialAccountRepository.save(newSocialAccount);
    return newAccount;
  }

  async authenticate(code: string) {
    const token = await this.exchangeCodeForToken(code);
    const account = await this.getAccountInfo(token.access_token);
    const accessToken = await this.accountService.generateAccessToken(account);
    return accessToken;
  }
}
