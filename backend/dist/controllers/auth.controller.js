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
exports.AuthController = void 0;
const tsoa_1 = require("tsoa");
const auth_service_1 = require("../services/auth.service");
let AuthController = class AuthController extends tsoa_1.Controller {
    constructor() {
        super(...arguments);
        this.authService = new auth_service_1.AuthService();
    }
    async register(requestBody) {
        try {
            this.setStatus(201);
            return await this.authService.register(requestBody);
        }
        catch (error) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }
    async login(requestBody) {
        try {
            return await this.authService.login(requestBody);
        }
        catch (error) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }
    async getProfile(request) {
        // Thuộc tính user được inject từ authentication middleware
        return request.user;
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, tsoa_1.Post)('/register'),
    (0, tsoa_1.SuccessResponse)(201, 'Registered Successfully'),
    (0, tsoa_1.Response)(400, 'Bad Request'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, tsoa_1.Post)('/login'),
    (0, tsoa_1.Response)(400, 'Bad Request'),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, tsoa_1.Get)('/me'),
    (0, tsoa_1.Security)('jwt'),
    (0, tsoa_1.Response)(401, 'Unauthorized'),
    __param(0, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
exports.AuthController = AuthController = __decorate([
    (0, tsoa_1.Route)('api/auth'),
    (0, tsoa_1.Tags)('Auth')
], AuthController);
