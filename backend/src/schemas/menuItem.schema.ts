import {
    z,
} from "zod";


/**
 * =====================================================
 * CREATE MENU ITEM
 * =====================================================
 */
export const createMenuItemSchema =
    z.object({

        body: z.object({

            name: z
                .string()
                .trim()
                .min(
                    1,
                    "Tên món không được để trống"
                )
                .max(150),


            description: z
                .string()
                .trim()
                .max(500)
                .optional(),


            /**
             * Giá món phải > 0.
             */
            price: z
                .number()
                .positive(
                    "Giá món phải lớn hơn 0"
                ),


            image: z
                .string()
                .url(
                    "URL hình ảnh không hợp lệ"
                )
                .optional(),


            isAvailable:
                z.boolean()
                    .optional(),


            /**
             * Category bắt buộc.
             */
            categoryId:
                z.string().uuid(
                    "categoryId không hợp lệ"
                ),
        }),

        params: z.object({}),

        query: z.object({}),
    });


/**
 * =====================================================
 * UPDATE MENU ITEM
 * =====================================================
 */
export const updateMenuItemSchema =
    z.object({

        body: z.object({

            name:
                z.string()
                    .trim()
                    .min(1)
                    .max(150)
                    .optional(),

            description:
                z.string()
                    .trim()
                    .max(500)
                    .optional(),

            price:
                z.number()
                    .positive()
                    .optional(),

            image:
                z.string()
                    .url()
                    .optional(),

            isAvailable:
                z.boolean()
                    .optional(),

            categoryId:
                z.string()
                    .uuid()
                    .optional(),
        }),

        params: z.object({

            id:
                z.string()
                    .uuid(
                        "ID món ăn không hợp lệ"
                    ),
        }),

        query: z.object({}),
    });