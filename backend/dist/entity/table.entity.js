"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableEntity = void 0;
class TableEntity {
    constructor(partial) {
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
exports.TableEntity = TableEntity;
