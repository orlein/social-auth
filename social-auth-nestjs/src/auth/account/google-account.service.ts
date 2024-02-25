import { AccountEntity } from '@/auth/account/account.entity';
import { AccountService } from '@/auth/account/account.service';
import { SocialAccountEntity } from '@/auth/account/social-account.entity';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class GoogleAccountService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly accountService: AccountService,
    @InjectRepository(SocialAccountEntity)
    private readonly socialAccountRepository: Repository<SocialAccountEntity>,
  ) {
    this.clientId = this.configService.get('GOOGLE_CLIENT_ID');
    this.clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
    this.redirectUri = this.configService.get('GOOGLE_REDIRECT_URI');
  }

  getGoogleAuthURL() {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = new URLSearchParams({
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ].join(' '),
    });

    return `${rootUrl}?${options.toString()}`;
  }

  private async exchangeCodeForToken(code: string): Promise<any> {
    const url = 'https://oauth2.googleapis.com/token';
    const values = {
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code',
    };

    try {
      const response = await axios.post(
        url,
        new URLSearchParams(values).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );
      console.log(response.data);

      return response.data;
    } catch (error) {
      console.error(error.response.data);
      return error;
    }
  }

  async findSocialAccount(
    id: string,
    provider: string,
  ): Promise<SocialAccountEntity> {
    return this.socialAccountRepository.findOne({
      where: {
        id,
        provider,
      },
    });
  }

  private async getAccountInfo(accessToken: string): Promise<AccountEntity> {
    const response = await axios.get(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`,
    );

    const [existingSocialAccount, existingAccount] = await Promise.all([
      this.findSocialAccount(response.data.id, 'google'),
      this.accountService.readByUniqueIdentifier({
        plainEmail: response.data.email,
      }),
    ]);

    if (existingSocialAccount && existingAccount) {
      return existingAccount;
    }

    if (existingSocialAccount && !existingAccount) {
      const randomPassword = randomBytes(16).toString('hex');
      const result = await this.accountService.signUp({
        plainEmail: response.data.email,
        plainPassword: randomPassword,
        passwordRepeat: randomPassword,
      });

      if (result.error) {
        throw result.error;
      }

      existingSocialAccount.account = result.account;
      await this.socialAccountRepository.save(existingSocialAccount);

      return result.account;
    }

    if (!existingSocialAccount && existingAccount) {
      const newSocialAccount = this.socialAccountRepository.create({
        id: response.data.id,
        provider: 'google',
        name: response.data.name,
        givenName: response.data.given_name,
        email: response.data.email,
        isVerified: response.data.verified_email,
        photoUrl: response.data.picture,
        locale: response.data.locale,
        account: existingAccount,
      });

      await this.socialAccountRepository.save(newSocialAccount);
      return existingAccount;
    }

    const randomPassword = randomBytes(16).toString('hex');
    const result = await this.accountService.signUp({
      plainEmail: response.data.email,
      plainPassword: randomPassword,
      passwordRepeat: randomPassword,
    });

    if (result.error) {
      throw result.error;
    }

    const newSocialAccount = this.socialAccountRepository.create({
      id: response.data.id,
      provider: 'google',
      name: response.data.name,
      givenName: response.data.given_name,
      email: response.data.email,
      isVerified: response.data.verified_email,
      photoUrl: response.data.picture,
      locale: response.data.locale,
      account: result.account,
    });

    await this.socialAccountRepository.save(newSocialAccount);
    return result.account;
  }

  async authenticate(code: string) {
    const tokenData = await this.exchangeCodeForToken(code);
    const account = await this.getAccountInfo(tokenData.access_token);
    const accessToken = this.accountService.generateAccessToken(account);
    return accessToken;
  }
}
