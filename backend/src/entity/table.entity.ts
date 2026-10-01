import { TableStatus } from '@prisma/client';

export class TableEntity {
    id: string;
    tableNumber: number;
    capacity: number;
    status: TableStatus;
    area: string;

    // 🔥 THÊM 3 TRƯỜNG NÀY
    customerName?: string | null;
    customerPhone?: string | null;
    reservationTime?: string | null;

    // 🔥 Bổ sung 2 trường ngày tháng để sửa lỗi TypeScript
    createdAt: Date;
    updatedAt: Date;

    constructor(partial: Partial<any>) {
        this.id = partial.id;
        this.tableNumber = partial.tableNumber;
        this.capacity = partial.capacity;
        this.status = partial.status;
        this.area = partial.area || 'Sảnh chính';

        // 🔥 GÁN GIÁ TRỊ TỪ DATABASE LÊN
        this.customerName = partial.customerName;
        this.customerPhone = partial.customerPhone;
        this.reservationTime = partial.reservationTime;
        // 🔥 Gán giá trị ngày tháng
        this.createdAt = partial.createdAt || new Date();
        this.updatedAt = partial.updatedAt || new Date();
    }
}