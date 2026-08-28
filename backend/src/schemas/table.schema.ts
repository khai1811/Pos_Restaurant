import {
    z,
} from "zod";


/**
 * =====================================================
 * CREATE TABLE
 * =====================================================
 */
export const createTableSchema =
    z.object({

        body: z.object({

            /**
             * Số bàn phải là số nguyên.
             */
            tableNumber:
                z.number()
                    .int()
                    .positive(
                        "Số bàn phải lớn hơn 0"
                    ),


            /**
             * Sức chứa tối thiểu 1 người.
             */
            capacity:
                z.number()
                    .int()
                    .positive(
                        "Sức chứa phải lớn hơn 0"
                    ),
        }),

        params: z.object({}),

        query: z.object({}),
    });


/**
 * =====================================================
 * UPDATE TABLE
 * =====================================================
 */
export const updateTableSchema =
    z.object({

        body: z.object({

            tableNumber:
                z.number()
                    .int()
                    .positive()
                    .optional(),

            capacity:
                z.number()
                    .int()
                    .positive()
                    .optional(),

            /**
             * Trạng thái bàn.
             */
            status:
                z.enum([
                    "AVAILABLE",
                    "OCCUPIED",
                    "RESERVED",
                    "CLEANING",
                ])
                    .optional(),
        }),

        params: z.object({

            id:
                z.string()
                    .uuid(
                        "ID bàn không hợp lệ"
                    ),
        }),

        query: z.object({}),
    });