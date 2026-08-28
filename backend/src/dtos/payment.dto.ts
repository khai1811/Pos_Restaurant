import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
    orderId!: string;
    totalAmount!: number;
    paidAmount!: number;
    changeAmount!: number;
    method!: PaymentMethod;
}

export class PaymentResponseDto {
    id!: string;
    orderId!: string;
    totalAmount!: number;
    paidAmount!: number;
    changeAmount!: number;
    method!: PaymentMethod;
    paymentTime!: Date;
}