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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const tsoa_1 = require("tsoa");
const dashboard_service_1 = require("../services/dashboard.service");
let DashboardController = class DashboardController extends tsoa_1.Controller {
    constructor() {
        super(...arguments);
        this.dashboardService = new dashboard_service_1.DashboardService();
    }
    async getOverview() {
        try {
            return await this.dashboardService.getOverview();
        }
        catch (error) {
            this.setStatus(500);
            throw new Error(error.message);
        }
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, tsoa_1.Get)('/overview'),
    (0, tsoa_1.Response)(500, 'Internal Server Error'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getOverview", null);
exports.DashboardController = DashboardController = __decorate([
    (0, tsoa_1.Route)('api/dashboard'),
    (0, tsoa_1.Tags)('Dashboard'),
    (0, tsoa_1.Security)('bearerAuth') // Đã bật bảo mật
], DashboardController);
