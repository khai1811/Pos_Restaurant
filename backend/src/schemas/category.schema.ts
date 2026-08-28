import {
    z,
} from "zod";


/**
 * =====================================================
 * CREATE CATEGORY
 * =====================================================
 */
export const createCategorySchema =
    z.object({

        body: z.object({

            /**
             * Tên category bắt buộc.
             */
            name: z
                .string()
                .trim()
                .min(
                    1,
                    "Tên danh mục không được để trống"
                )
                .max(
                    100,
                    "Tên danh mục tối đa 100 ký tự"
                ),


            /**
             * Description không bắt buộc.
             */
            description: z
                .string()
                .trim()
                .max(
                    500,
                    "Mô tả tối đa 500 ký tự"
                )
                .optional(),
        }),

        params: z.object({}),

        query: z.object({}),
    });


/**
 * =====================================================
 * UPDATE CATEGORY
 * =====================================================
 *
 * Partial nghĩa là tất cả field đều không bắt buộc.
 */
export const updateCategorySchema =
    z.object({

        body: z.object({

            name: z
                .string()
                .trim()
                .min(
                    1,
                    "Tên danh mục không được để trống"
                )
                .max(100)
                .optional(),

            description: z
                .string()
                .trim()
                .max(500)
                .optional(),
        }),

        params: z.object({

            id: z
                .string()
                .uuid(
                    "ID danh mục không hợp lệ"
                ),
        }),

        query: z.object({}),
    });