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

  @Column({ nullable: true })
  id: string;

  @Column()
  provider: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  givenName: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  isVerified: boolean;

  @Column({ nullable: true })
  photoUrl: string;

  @Column({ nullable: true })
  locale: string;

  @ManyToOne(() => AccountEntity, (account) => account.socialAccounts)
  account: Relation<AccountEntity>;
}
