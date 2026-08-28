"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderEntity = exports.OrderItemEntity = void 0;
class OrderItemEntity {
    constructor(partial) {
        Object.assign(this, partial);
    }
}
exports.OrderItemEntity = OrderItemEntity;
class OrderEntity {
    constructor(partial) {
        Object.assign(this, partial);
        this.items = partial.items || []; // Khởi tạo mảng rỗng nếu undefined
    }
}
exports.OrderEntity = OrderEntity;
