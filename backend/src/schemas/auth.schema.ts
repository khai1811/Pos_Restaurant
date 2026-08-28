import {
    z,
} from "zod";


/**
 * =====================================================
 * LOGIN VALIDATION
 * =====================================================
 */
export const loginSchema =
    z.object({

        body: z.object({

            /**
             * Username bắt buộc.
             */
            username:
                z.string()
                    .trim()
                    .min(
                        1,
                        "Username không được để trống"
                    ),


            /**
             * Password bắt buộc.
             */
            password:
                z.string()
                    .min(
                        1,
                        "Password không được để trống"
                    ),
        }),

        params: z.object({}),

        query: z.object({}),
    });