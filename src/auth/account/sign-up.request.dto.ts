import { z } from 'zod';
import { extendApi } from '@anatine/zod-openapi';
import { createZodDto } from '@anatine/zod-nestjs';

export class SignUpRequestDto extends createZodDto(
  extendApi(
    z
      .object({
        plainEmail: extendApi(z.string().default('email@email.com'), {
          default: 'email@email.com',
          description: '이메일',
        }),
        plainPassword: extendApi(
          z.string().superRefine((val, ctx) => {
            if (val.length < 8) {
              ctx.addIssue({
                code: z.ZodIssueCode.too_small,
                minimum: 8,
                type: 'string',
                inclusive: false,
                message: 'Password should be at least 8 characters long.',
              });
            }

            if (!/[a-z]/.test(val)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Password should contain at least one lowercase letter.`,
              });
            }

            if (!/[A-Z]/.test(val)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Password should contain at least one uppercase letter.`,
              });
            }

            if (!/[0-9]/.test(val)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Password should contain at least one number.`,
              });
            }

            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Password should contain at least one special character.`,
              });
            }
          }),
          { default: 'p@sSw0rd' },
        ),
        passwordRepeat: extendApi(z.string(), { default: 'p@sSw0rd' }),
      })
      .superRefine((val, ctx) => {
        if (val.plainPassword !== val.passwordRepeat) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `The input password and the password repeat should be the same.`,
          });
        }
      }),
    {
      description: 'Sign Up Request',
    },
  ),
) {}
