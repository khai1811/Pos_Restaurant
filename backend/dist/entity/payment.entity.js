"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentEntity = void 0;
const client_1 = require("@prisma/client");
class PaymentEntity {
    constructor(partial) {
        Object.assign(this, partial);
        this.id = partial.id || '';
        this.orderId = partial.orderId || '';
        this.amount = Number(partial.amount || 0);
        this.method = partial.method || client_1.PaymentMethod.CASH;
        this.createdAt = partial.createdAt || new Date();
    }
}
exports.PaymentEntity = PaymentEntity;
