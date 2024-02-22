import { AccountModule } from '@/auth/account/account.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [AccountModule],
})
export class AuthModule {}
