import { AccountEntity } from '@/auth/account/account.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';

@Entity({ name: 'social_account' })
export class SocialAccountEntity {
  @PrimaryGeneratedColumn()
  seq: number;

  @Column()
  id: string;

  @Column()
  provider: string;

  @Column()
  name: string;

  @Column()
  givenName: string;

  @Column()
  email: string;

  @Column()
  isVerified: boolean;

  @Column()
  photoUrl: string;

  @Column()
  locale: string;

  @ManyToOne(() => AccountEntity, (account) => account.socialAccounts)
  account: Relation<AccountEntity>;
}
