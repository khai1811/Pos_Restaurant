import { PaymentMethod } from '@prisma/client';

export class PaymentEntity {
    id: string;
    orderId: string;
    amount: number;
    method: PaymentMethod;
    createdAt: Date;

    constructor(partial: Partial<PaymentEntity>) {
        Object.assign(this, partial);
        this.id = partial.id || '';
        this.orderId = partial.orderId || '';
        this.amount = Number(partial.amount || 0);
        this.method = partial.method || PaymentMethod.CASH;
        this.createdAt = partial.createdAt || new Date();
    }
}