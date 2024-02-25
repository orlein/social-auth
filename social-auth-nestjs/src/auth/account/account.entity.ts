import { SocialAccountEntity } from '@/auth/account/social-account.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'account' })
export class AccountEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  plainEmail: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ select: false })
  passwordSalt: string;

  @OneToMany(
    () => SocialAccountEntity,
    (socialAccount) => socialAccount.account,
  )
  socialAccounts: Relation<SocialAccountEntity[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
