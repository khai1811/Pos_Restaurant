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
exports.ReportController = void 0;
const tsoa_1 = require("tsoa");
const report_service_1 = require("../services/report.service");
let ReportController = class ReportController extends tsoa_1.Controller {
    constructor() {
        super(...arguments);
        this.reportService = new report_service_1.ReportService();
    }
    async getRevenueReport(startDate, endDate) {
        try {
            return await this.reportService.getRevenueReport(startDate, endDate);
        }
        catch (error) {
            this.setStatus(500);
            throw new Error(error.message);
        }
    }
};
exports.ReportController = ReportController;
__decorate([
    (0, tsoa_1.Get)('/revenue'),
    (0, tsoa_1.Response)(500, 'Internal Server Error'),
    __param(0, (0, tsoa_1.Query)()),
    __param(1, (0, tsoa_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getRevenueReport", null);
exports.ReportController = ReportController = __decorate([
    (0, tsoa_1.Route)('api/reports'),
    (0, tsoa_1.Tags)('Report'),
    (0, tsoa_1.Security)('bearerAuth') // Đã bật bảo mật
], ReportController);
