import { createZodDto } from '@anatine/zod-nestjs';
import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

export class SignInRequestDto extends createZodDto(
  z.object({
    plainEmail: extendApi(z.string().default('email@email.com'), {
      default: 'email@email.com',
      description: '이메일',
    }),
    plainPassword: extendApi(z.string(), { default: 'p@sSw0rd' }),
  }),
) {}
