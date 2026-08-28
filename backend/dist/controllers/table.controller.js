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
exports.RestaurantTableController = void 0;
const tsoa_1 = require("tsoa");
const client_1 = require("@prisma/client");
const table_service_1 = require("../services/table.service");
let RestaurantTableController = class RestaurantTableController extends tsoa_1.Controller {
    constructor() {
        super(...arguments);
        this.tableService = new table_service_1.RestaurantTableService();
    }
    async getTables(status) {
        return this.tableService.getAll(status);
    }
    async getTableById(id) {
        const table = await this.tableService.getById(id);
        if (!table) {
            this.setStatus(404);
            throw new Error('Không tìm thấy bàn');
        }
        return table;
    }
    async createTable(requestBody) {
        try {
            this.setStatus(201);
            return await this.tableService.create(requestBody);
        }
        catch (error) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }
    async updateTable(id, requestBody) {
        try {
            return await this.tableService.update(id, requestBody);
        }
        catch (error) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }
    async deleteTable(id) {
        try {
            const success = await this.tableService.delete(id);
            return { success };
        }
        catch (error) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }
};
exports.RestaurantTableController = RestaurantTableController;
__decorate([
    (0, tsoa_1.Get)('/'),
    __param(0, (0, tsoa_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RestaurantTableController.prototype, "getTables", null);
__decorate([
    (0, tsoa_1.Get)('{id}'),
    (0, tsoa_1.Response)(404, 'Table not found'),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RestaurantTableController.prototype, "getTableById", null);
__decorate([
    (0, tsoa_1.Post)('/'),
    (0, tsoa_1.SuccessResponse)(201, 'Created'),
    (0, tsoa_1.Response)(400, 'Bad Request'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RestaurantTableController.prototype, "createTable", null);
__decorate([
    (0, tsoa_1.Put)('{id}'),
    (0, tsoa_1.Response)(400, 'Bad Request'),
    (0, tsoa_1.Response)(404, 'Table not found'),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RestaurantTableController.prototype, "updateTable", null);
__decorate([
    (0, tsoa_1.Delete)('{id}'),
    (0, tsoa_1.Response)(400, 'Bad Request'),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RestaurantTableController.prototype, "deleteTable", null);
exports.RestaurantTableController = RestaurantTableController = __decorate([
    (0, tsoa_1.Route)('api/tables'),
    (0, tsoa_1.Tags)('Restaurant Table'),
    (0, tsoa_1.Security)('bearerAuth') // Đã bật bảo mật
], RestaurantTableController);
