import {
    z,
} from "zod";


/**
 * =====================================================
 * CREATE USER
 * =====================================================
 */
export const createUserSchema =
    z.object({

        body: z.object({

            fullName:
                z.string()
                    .trim()
                    .min(
                        2,
                        "Họ tên tối thiểu 2 ký tự"
                    )
                    .max(100),


            username:
                z.string()
                    .trim()
                    .min(
                        3,
                        "Username tối thiểu 3 ký tự"
                    )
                    .max(50)
                    .regex(
                        /^[a-zA-Z0-9_]+$/,
                        "Username chỉ được chứa chữ, số và _"
                    ),


            email:
                z.string()
                    .email(
                        "Email không hợp lệ"
                    )
                    .optional(),


            password:
                z.string()
                    .min(
                        6,
                        "Password tối thiểu 6 ký tự"
                    ),


            phone:
                z.string()
                    .trim()
                    .max(20)
                    .optional(),


            role:
                z.enum([
                    "ADMIN",
                    "CASHIER",
                    "STAFF",
                ])
                    .optional(),
        }),

        params: z.object({}),

        query: z.object({}),
    });


/**
 * =====================================================
 * UPDATE USER
 * =====================================================
 */
export const updateUserSchema =
    z.object({

        body: z.object({

            fullName:
                z.string()
                    .trim()
                    .min(2)
                    .max(100)
                    .optional(),

            username:
                z.string()
                    .trim()
                    .min(3)
                    .max(50)
                    .regex(
                        /^[a-zA-Z0-9_]+$/
                    )
                    .optional(),

            email:
                z.string()
                    .email()
                    .optional(),

            password:
                z.string()
                    .min(6)
                    .optional(),

            phone:
                z.string()
                    .trim()
                    .max(20)
                    .optional(),

            role:
                z.enum([
                    "ADMIN",
                    "CASHIER",
                    "STAFF",
                ])
                    .optional(),
        }),

        params: z.object({

            id:
                z.string()
                    .uuid(
                        "ID nhân viên không hợp lệ"
                    ),
        }),

        query: z.object({}),
    });


/**
 * =====================================================
 * USER STATUS
 * =====================================================
 */
export const updateUserStatusSchema =
    z.object({

        body: z.object({

            isActive:
                z.boolean(),
        }),

        params: z.object({

            id:
                z.string()
                    .uuid(
                        "ID nhân viên không hợp lệ"
                    ),
        }),

        query: z.object({}),
    });