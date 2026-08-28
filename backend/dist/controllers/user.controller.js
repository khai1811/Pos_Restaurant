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
exports.UserController = void 0;
const tsoa_1 = require("tsoa");
const user_service_1 = require("../services/user.service");
let UserController = class UserController extends tsoa_1.Controller {
    constructor() {
        super(...arguments);
        this.userService = new user_service_1.UserService();
    }
    async getUsers() {
        return this.userService.getAll();
    }
    async getUser(id) {
        const user = await this.userService.getById(id);
        if (!user) {
            this.setStatus(404);
            throw new Error('Không tìm thấy người dùng');
        }
        return user;
    }
    async createUser(requestBody) {
        try {
            this.setStatus(201);
            return await this.userService.create(requestBody);
        }
        catch (error) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }
    async updateUser(id, requestBody) {
        try {
            return await this.userService.update(id, requestBody);
        }
        catch (error) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }
    async updateUserStatus(id, requestBody) {
        try {
            return await this.userService.update(id, requestBody);
        }
        catch (error) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }
    async deleteUser(id) {
        try {
            const success = await this.userService.delete(id);
            return { success };
        }
        catch (error) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }
};
exports.UserController = UserController;
__decorate([
    (0, tsoa_1.Get)('/'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUsers", null);
__decorate([
    (0, tsoa_1.Get)('{id}'),
    (0, tsoa_1.Response)(404, 'User not found'),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUser", null);
__decorate([
    (0, tsoa_1.Post)('/'),
    (0, tsoa_1.SuccessResponse)(201, 'Created'),
    (0, tsoa_1.Response)(400, 'Bad Request'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "createUser", null);
__decorate([
    (0, tsoa_1.Put)('{id}'),
    (0, tsoa_1.Response)(400, 'Bad Request'),
    (0, tsoa_1.Response)(404, 'User not found'),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateUser", null);
__decorate([
    (0, tsoa_1.Put)('{id}/status'),
    (0, tsoa_1.Response)(400, 'Bad Request'),
    (0, tsoa_1.Response)(404, 'User not found'),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateUserStatus", null);
__decorate([
    (0, tsoa_1.Delete)('{id}'),
    (0, tsoa_1.Response)(400, 'Bad Request'),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "deleteUser", null);
exports.UserController = UserController = __decorate([
    (0, tsoa_1.Route)('api/users'),
    (0, tsoa_1.Tags)('User'),
    (0, tsoa_1.Security)('bearerAuth') // Đã bật bảo mật
], UserController);
