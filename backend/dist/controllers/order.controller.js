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
exports.OrderController = void 0;
const tsoa_1 = require("tsoa");
const client_1 = require("@prisma/client");
const order_service_1 = require("../services/order.service");
let OrderController = class OrderController extends tsoa_1.Controller {
    constructor() {
        super(...arguments);
        this.orderService = new order_service_1.OrderService();
    }
    async getOrders(status) {
        try {
            return await this.orderService.getAll(status);
        }
        catch (error) {
            console.error('❌ Lỗi GET /api/orders:', error.message);
            this.setStatus(500);
            throw new Error(`Lỗi Server khi lấy danh sách đơn: ${error.message}`);
        }
    }
    async getOrderById(id) {
        const order = await this.orderService.getById(id);
        if (!order) {
            this.setStatus(404);
            throw new Error('Không tìm thấy đơn hàng');
        }
        return order;
    }
    async createOrder(request, requestBody) {
        try {
            // Lấy trực tiếp userId từ token đã đăng nhập
            const user = request.user;
            const userId = user?.id || user?.userId;
            if (!userId) {
                this.setStatus(401);
                throw new Error('Không tìm thấy thông tin xác thực người dùng');
            }
            this.setStatus(201);
            return await this.orderService.create({
                ...requestBody,
                userId: userId,
            });
        }
        catch (error) {
            console.error('❌ Lỗi POST /api/orders:', error.message);
            this.setStatus(400);
            throw new Error(error.message);
        }
    }
    async updateOrderStatus(id, requestBody) {
        try {
            return await this.orderService.updateStatus(id, requestBody);
        }
        catch (error) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }
};
exports.OrderController = OrderController;
__decorate([
    (0, tsoa_1.Get)('/'),
    __param(0, (0, tsoa_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "getOrders", null);
__decorate([
    (0, tsoa_1.Get)('{id}'),
    (0, tsoa_1.Response)(404, 'Order not found'),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "getOrderById", null);
__decorate([
    (0, tsoa_1.Post)('/'),
    (0, tsoa_1.SuccessResponse)(201, 'Created'),
    (0, tsoa_1.Response)(400, 'Bad Request'),
    __param(0, (0, tsoa_1.Request)()),
    __param(1, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "createOrder", null);
__decorate([
    (0, tsoa_1.Put)('{id}/status'),
    (0, tsoa_1.Response)(400, 'Bad Request'),
    (0, tsoa_1.Response)(404, 'Order not found'),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "updateOrderStatus", null);
exports.OrderController = OrderController = __decorate([
    (0, tsoa_1.Route)('api/orders'),
    (0, tsoa_1.Tags)('Order'),
    (0, tsoa_1.Security)('bearerAuth') // Đã bật bảo mật
], OrderController);
