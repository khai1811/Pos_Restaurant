"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const tsoa_1 = require("tsoa");
const payment_dto_1 = require("../dtos/payment.dto");
const payment_service_1 = require("../services/payment.service");
let PaymentController = class PaymentController extends tsoa_1.Controller {
    constructor() {
        super(...arguments);
        this.paymentService = new payment_service_1.PaymentService();
    }
    async getPayments() {
        return this.paymentService.getAll();
    }
    async getPaymentById(id) {
        const payment = await this.paymentService.getById(id);
        if (!payment) {
            this.setStatus(404);
            throw new Error('Không tìm thấy thông tin thanh toán');
        }
        return payment;
    }
    async createPayment(requestBody) {
        try {
            this.setStatus(201);
            return await this.paymentService.create(requestBody);
        }
        catch (error) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, tsoa_1.Get)('/'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getPayments", null);
__decorate([
    (0, tsoa_1.Get)('{id}'),
    (0, tsoa_1.Response)(404, 'Payment not found'),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getPaymentById", null);
__decorate([
    (0, tsoa_1.Post)('/'),
    (0, tsoa_1.SuccessResponse)(201, 'Created'),
    (0, tsoa_1.Response)(400, 'Bad Request'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_dto_1.CreatePaymentDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createPayment", null);
exports.PaymentController = PaymentController = __decorate([
    (0, tsoa_1.Route)('api/payments'),
    (0, tsoa_1.Tags)('Payment'),
    (0, tsoa_1.Security)('bearerAuth')
], PaymentController);
