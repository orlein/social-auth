import { AccountEntity } from '@/auth/account/account.entity';
import { SignInRequestDto } from '@/auth/account/sign-in.request.dto';
import { SignUpRequestDto } from '@/auth/account/sign-up.request.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { getUnixTime } from 'date-fns';
import { pbkdf2, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import { Repository } from 'typeorm';
import { z } from 'zod';

export const SignUpServiceParam = z.object({
  passwordSalt: z.string(),
  plainPassword: z.string(),
});
export type SignUpServiceParam = z.infer<typeof SignUpServiceParam>;

export type Token = {
  sub: string;
  iss: string;
  iat: number;
  exp: number;
  type: 'access' | 'refresh' | 'anonymous';
  maxAge: number;
};

export class AccountService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async getSalt(size = 16) {
    const buffetSalt = await promisify(randomBytes)(size);
    return buffetSalt.toString('hex');
  }

  async verifyPassword(
    plainPassword: string,
    hashPassword: string,
    passwordSalt: string,
  ) {
    const derivedKey = await promisify(pbkdf2)(
      plainPassword,
      passwordSalt,
      10000,
      64,
      'sha512',
    );
    return derivedKey.toString('hex') === hashPassword;
  }

  async hashPassword(param: SignUpServiceParam) {
    const derivedKey = await promisify(pbkdf2)(
      param.plainPassword,
      param.passwordSalt,
      10000,
      64,
      'sha512',
    );
    return derivedKey.toString('hex');
  }

  async generateAccessToken(account: AccountEntity) {
    const host = this.configService.get('SERVER_HOST');
    const accessToken = await this.jwtService.signAsync({
      sub: account.plainEmail,
      iss: host,
      iat: getUnixTime(new Date()),
      exp: getUnixTime(new Date()) + 60 * 60 * 24 * 7, // 7 days
      type: 'access',
      maxAge: 60 * 60 * 24 * 7,
    } as Token);

    return accessToken;
  }

  async generateRefreshToken(account: AccountEntity) {
    const host = this.configService.get('SERVER_HOST');
    const refreshToken = await this.jwtService.signAsync({
      sub: account.plainEmail,
      iss: host,
      iat: getUnixTime(new Date()),
      exp: getUnixTime(new Date()) + 60 * 60 * 24 * 30, // 30 days
      type: 'refresh',
      maxAge: 60 * 60 * 24 * 30,
    } as Token);

    return refreshToken;
  }

  async readByUniqueIdentifier({ plainEmail }: SignUpRequestDto) {
    return this.accountRepository.findOne({
      where: [{ plainEmail }],
    });
  }

  async signUp(signUpRequestDto: SignUpRequestDto) {
    const existingAccount = await this.readByUniqueIdentifier(signUpRequestDto);

    if (existingAccount) {
      return {
        error: new ConflictException(
          'The email or the phone number is already in use.',
        ),
      };
    }

    const randomSalt = await this.getSalt();
    const hashedPassword = await this.hashPassword({
      passwordSalt: randomSalt,
      plainPassword: signUpRequestDto.plainPassword,
    });
    const newAccount = this.accountRepository.create({
      ...signUpRequestDto,
      passwordHash: hashedPassword,
      passwordSalt: randomSalt,
    });

    const result = await this.accountRepository.save(newAccount);
    return { account: result };
  }

  async signIn(loginDto: SignInRequestDto) {
    const account = await this.accountRepository.findOne({
      select: {
        plainEmail: true,
        passwordHash: true,
        passwordSalt: true,
      },
      where: { plainEmail: loginDto.plainEmail },
    });

    if (!account) {
      throw new UnauthorizedException('The email or password is not correct.');
    }

    const isPasswordValid = await this.verifyPassword(
      loginDto.plainPassword,
      account.passwordHash,
      account.passwordSalt,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('The email or password is not correct.');
    }

    return account;
  }

  async readAll(): Promise<AccountEntity[]> {
    return this.accountRepository.find();
  }

  async validateToken(serializedToken: string) {
    try {
      const host = this.configService.get('SERVER_HOST');
      const decoded = await this.jwtService.verifyAsync<Token>(
        serializedToken,
        {
          issuer: host,
        },
      );
      return decoded;
    } catch {
      throw new UnauthorizedException('Invalid token.');
    }
  }

  async authenticate(accessToken: string) {
    const decoded = await this.validateToken(accessToken);
    if (decoded.type !== 'access') {
      throw new UnauthorizedException('Invalid access token.');
    }

    const account = await this.accountRepository.findOne({
      where: { plainEmail: decoded.sub },
      relations: ['socialAccounts'],
    });

    if (!account) {
      throw new UnauthorizedException('No account found.');
    }

    return account;
  }
}
