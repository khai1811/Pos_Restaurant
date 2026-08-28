"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterRoutes = RegisterRoutes;
const runtime_1 = require("@tsoa/runtime");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const user_controller_1 = require("./../controllers/user.controller");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const table_controller_1 = require("./../controllers/table.controller");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const report_controller_1 = require("./../controllers/report.controller");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const payment_controller_1 = require("./../controllers/payment.controller");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const order_controller_1 = require("./../controllers/order.controller");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const menu_item_controller_1 = require("./../controllers/menu-item.controller");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const dashboard_controller_1 = require("./../controllers/dashboard.controller");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const category_controller_1 = require("./../controllers/category.controller");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const auth_controller_1 = require("./../controllers/auth.controller");
const auth_middleware_1 = require("./../middlewares/auth.middleware");
const expressAuthenticationRecasted = auth_middleware_1.expressAuthentication;
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const models = {
    "_36_Enums.UserRole": {
        "dataType": "refAlias",
        "type": { "dataType": "union", "subSchemas": [{ "dataType": "enum", "enums": ["ADMIN"] }, { "dataType": "enum", "enums": ["CASHIER"] }, { "dataType": "enum", "enums": ["STAFF"] }], "validators": {} },
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserRole": {
        "dataType": "refAlias",
        "type": { "ref": "_36_Enums.UserRole", "validators": {} },
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserResponseDto": {
        "dataType": "refObject",
        "properties": {
            "id": { "dataType": "string", "required": true },
            "username": { "dataType": "string", "required": true },
            "email": { "dataType": "union", "subSchemas": [{ "dataType": "string" }, { "dataType": "enum", "enums": [null] }], "required": true },
            "fullName": { "dataType": "string", "required": true },
            "role": { "ref": "UserRole", "required": true },
            "isActive": { "dataType": "boolean", "required": true },
            "createdAt": { "dataType": "datetime", "required": true },
            "updatedAt": { "dataType": "datetime", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateUserDto": {
        "dataType": "refObject",
        "properties": {
            "username": { "dataType": "string", "required": true },
            "email": { "dataType": "string" },
            "password": { "dataType": "string", "required": true },
            "fullName": { "dataType": "string", "required": true },
            "role": { "ref": "UserRole" },
            "isActive": { "dataType": "boolean" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateUserDto": {
        "dataType": "refObject",
        "properties": {
            "username": { "dataType": "string" },
            "email": { "dataType": "string" },
            "password": { "dataType": "string" },
            "fullName": { "dataType": "string" },
            "role": { "ref": "UserRole" },
            "isActive": { "dataType": "boolean" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.TableStatus": {
        "dataType": "refAlias",
        "type": { "dataType": "union", "subSchemas": [{ "dataType": "enum", "enums": ["AVAILABLE"] }, { "dataType": "enum", "enums": ["OCCUPIED"] }, { "dataType": "enum", "enums": ["RESERVED"] }, { "dataType": "enum", "enums": ["CLEANING"] }], "validators": {} },
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TableStatus": {
        "dataType": "refAlias",
        "type": { "ref": "_36_Enums.TableStatus", "validators": {} },
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TableResponseDto": {
        "dataType": "refObject",
        "properties": {
            "id": { "dataType": "string", "required": true },
            "tableNumber": { "dataType": "double", "required": true },
            "capacity": { "dataType": "double", "required": true },
            "status": { "ref": "TableStatus", "required": true },
            "createdAt": { "dataType": "datetime", "required": true },
            "updatedAt": { "dataType": "datetime", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateTableDto": {
        "dataType": "refObject",
        "properties": {
            "tableNumber": { "dataType": "double", "required": true },
            "capacity": { "dataType": "double" },
            "status": { "ref": "TableStatus" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateTableDto": {
        "dataType": "refObject",
        "properties": {
            "tableNumber": { "dataType": "double" },
            "capacity": { "dataType": "double" },
            "status": { "ref": "TableStatus" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RevenueByDateDto": {
        "dataType": "refObject",
        "properties": {
            "date": { "dataType": "string", "required": true },
            "revenue": { "dataType": "double", "required": true },
            "ordersCount": { "dataType": "double", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RevenueReportResponseDto": {
        "dataType": "refObject",
        "properties": {
            "fromDate": { "dataType": "string", "required": true },
            "toDate": { "dataType": "string", "required": true },
            "totalRevenue": { "dataType": "double", "required": true },
            "totalOrders": { "dataType": "double", "required": true },
            "details": { "dataType": "array", "array": { "dataType": "refObject", "ref": "RevenueByDateDto" }, "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.PaymentMethod": {
        "dataType": "refAlias",
        "type": { "dataType": "union", "subSchemas": [{ "dataType": "enum", "enums": ["CASH"] }, { "dataType": "enum", "enums": ["CARD"] }, { "dataType": "enum", "enums": ["MOMO"] }, { "dataType": "enum", "enums": ["VNPAY"] }, { "dataType": "enum", "enums": ["STRIPE"] }], "validators": {} },
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PaymentMethod": {
        "dataType": "refAlias",
        "type": { "ref": "_36_Enums.PaymentMethod", "validators": {} },
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PaymentResponseDto": {
        "dataType": "refObject",
        "properties": {
            "id": { "dataType": "string", "required": true },
            "orderId": { "dataType": "string", "required": true },
            "totalAmount": { "dataType": "double", "required": true },
            "paidAmount": { "dataType": "double", "required": true },
            "changeAmount": { "dataType": "double", "required": true },
            "method": { "ref": "PaymentMethod", "required": true },
            "paymentTime": { "dataType": "datetime", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreatePaymentDto": {
        "dataType": "refObject",
        "properties": {
            "orderId": { "dataType": "string", "required": true },
            "totalAmount": { "dataType": "double", "required": true },
            "paidAmount": { "dataType": "double", "required": true },
            "changeAmount": { "dataType": "double", "required": true },
            "method": { "ref": "PaymentMethod", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.OrderStatus": {
        "dataType": "refAlias",
        "type": { "dataType": "union", "subSchemas": [{ "dataType": "enum", "enums": ["PENDING"] }, { "dataType": "enum", "enums": ["PREPARING"] }, { "dataType": "enum", "enums": ["SERVED"] }, { "dataType": "enum", "enums": ["PAID"] }, { "dataType": "enum", "enums": ["CANCELLED"] }], "validators": {} },
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OrderStatus": {
        "dataType": "refAlias",
        "type": { "ref": "_36_Enums.OrderStatus", "validators": {} },
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OrderItemResponseDto": {
        "dataType": "refObject",
        "properties": {
            "id": { "dataType": "string", "required": true },
            "menuItemId": { "dataType": "string", "required": true },
            "menuItemName": { "dataType": "string" },
            "quantity": { "dataType": "double", "required": true },
            "unitPrice": { "dataType": "double", "required": true },
            "note": { "dataType": "union", "subSchemas": [{ "dataType": "string" }, { "dataType": "enum", "enums": [null] }], "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OrderResponseDto": {
        "dataType": "refObject",
        "properties": {
            "id": { "dataType": "string", "required": true },
            "orderNumber": { "dataType": "double", "required": true },
            "tableId": { "dataType": "string", "required": true },
            "tableNumber": { "dataType": "double" },
            "userId": { "dataType": "string", "required": true },
            "userName": { "dataType": "string" },
            "status": { "ref": "OrderStatus", "required": true },
            "totalAmount": { "dataType": "double", "required": true },
            "note": { "dataType": "union", "subSchemas": [{ "dataType": "string" }, { "dataType": "enum", "enums": [null] }], "required": true },
            "items": { "dataType": "array", "array": { "dataType": "refObject", "ref": "OrderItemResponseDto" }, "required": true },
            "createdAt": { "dataType": "datetime", "required": true },
            "updatedAt": { "dataType": "datetime", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateOrderItemDto": {
        "dataType": "refObject",
        "properties": {
            "menuItemId": { "dataType": "string", "required": true },
            "quantity": { "dataType": "double", "required": true },
            "note": { "dataType": "string" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateOrderDto": {
        "dataType": "refObject",
        "properties": {
            "tableId": { "dataType": "string", "required": true },
            "userId": { "dataType": "string", "required": true },
            "note": { "dataType": "string" },
            "items": { "dataType": "array", "array": { "dataType": "refObject", "ref": "CreateOrderItemDto" }, "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateOrderStatusDto": {
        "dataType": "refObject",
        "properties": {
            "status": { "ref": "OrderStatus", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MenuItemResponseDto": {
        "dataType": "refObject",
        "properties": {
            "id": { "dataType": "string", "required": true },
            "name": { "dataType": "string", "required": true },
            "description": { "dataType": "union", "subSchemas": [{ "dataType": "string" }, { "dataType": "enum", "enums": [null] }], "required": true },
            "price": { "dataType": "double", "required": true },
            "imageUrl": { "dataType": "union", "subSchemas": [{ "dataType": "string" }, { "dataType": "enum", "enums": [null] }], "required": true },
            "isAvailable": { "dataType": "boolean", "required": true },
            "categoryId": { "dataType": "string", "required": true },
            "categoryName": { "dataType": "string" },
            "createdAt": { "dataType": "datetime", "required": true },
            "updatedAt": { "dataType": "datetime", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateMenuItemDto": {
        "dataType": "refObject",
        "properties": {
            "name": { "dataType": "string", "required": true },
            "description": { "dataType": "string" },
            "price": { "dataType": "double", "required": true },
            "imageUrl": { "dataType": "string" },
            "isAvailable": { "dataType": "boolean" },
            "categoryId": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateMenuItemDto": {
        "dataType": "refObject",
        "properties": {
            "name": { "dataType": "string" },
            "description": { "dataType": "string" },
            "price": { "dataType": "double" },
            "imageUrl": { "dataType": "string" },
            "isAvailable": { "dataType": "boolean" },
            "categoryId": { "dataType": "string" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TopSellingItemDto": {
        "dataType": "refObject",
        "properties": {
            "menuItemId": { "dataType": "string", "required": true },
            "name": { "dataType": "string", "required": true },
            "totalSold": { "dataType": "double", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DashboardOverviewDto": {
        "dataType": "refObject",
        "properties": {
            "totalRevenue": { "dataType": "double", "required": true },
            "totalOrders": { "dataType": "double", "required": true },
            "occupiedTables": { "dataType": "double", "required": true },
            "availableTables": { "dataType": "double", "required": true },
            "topSellingItems": { "dataType": "array", "array": { "dataType": "refObject", "ref": "TopSellingItemDto" }, "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CategoryResponseDto": {
        "dataType": "refObject",
        "properties": {
            "id": { "dataType": "string", "required": true },
            "name": { "dataType": "string", "required": true },
            "description": { "dataType": "union", "subSchemas": [{ "dataType": "string" }, { "dataType": "enum", "enums": [null] }], "required": true },
            "isAvailable": { "dataType": "boolean", "required": true },
            "createdAt": { "dataType": "datetime", "required": true },
            "updatedAt": { "dataType": "datetime", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateCategoryDto": {
        "dataType": "refObject",
        "properties": {
            "name": { "dataType": "string", "required": true },
            "description": { "dataType": "string" },
            "isAvailable": { "dataType": "boolean" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateCategoryDto": {
        "dataType": "refObject",
        "properties": {
            "name": { "dataType": "string" },
            "description": { "dataType": "string" },
            "isAvailable": { "dataType": "boolean" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AuthResponseDto": {
        "dataType": "refObject",
        "properties": {
            "token": { "dataType": "string", "required": true },
            "user": { "dataType": "nestedObjectLiteral", "nestedProperties": { "role": { "ref": "UserRole", "required": true }, "fullName": { "dataType": "string", "required": true }, "email": { "dataType": "union", "subSchemas": [{ "dataType": "string" }, { "dataType": "enum", "enums": [null] }], "required": true }, "username": { "dataType": "string", "required": true }, "id": { "dataType": "string", "required": true } }, "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RegisterDto": {
        "dataType": "refObject",
        "properties": {
            "username": { "dataType": "string", "required": true },
            "email": { "dataType": "string" },
            "password": { "dataType": "string", "required": true },
            "fullName": { "dataType": "string", "required": true },
            "role": { "ref": "UserRole" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LoginDto": {
        "dataType": "refObject",
        "properties": {
            "username": { "dataType": "string", "required": true },
            "password": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new runtime_1.ExpressTemplateService(models, { "noImplicitAdditionalProperties": "throw-on-extras", "bodyCoercion": true });
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
function RegisterRoutes(app) {
    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################
    const argsUserController_getUsers = {};
    app.get('/api/users', ...((0, runtime_1.fetchMiddlewares)(user_controller_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(user_controller_1.UserController.prototype.getUsers)), async function UserController_getUsers(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getUsers, request, response });
            const controller = new user_controller_1.UserController();
            await templateService.apiHandler({
                methodName: 'getUsers',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_getUser = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
    };
    app.get('/api/users/:id', ...((0, runtime_1.fetchMiddlewares)(user_controller_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(user_controller_1.UserController.prototype.getUser)), async function UserController_getUser(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getUser, request, response });
            const controller = new user_controller_1.UserController();
            await templateService.apiHandler({
                methodName: 'getUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_createUser = {
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "CreateUserDto" },
    };
    app.post('/api/users', ...((0, runtime_1.fetchMiddlewares)(user_controller_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(user_controller_1.UserController.prototype.createUser)), async function UserController_createUser(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_createUser, request, response });
            const controller = new user_controller_1.UserController();
            await templateService.apiHandler({
                methodName: 'createUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_updateUser = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "UpdateUserDto" },
    };
    app.put('/api/users/:id', ...((0, runtime_1.fetchMiddlewares)(user_controller_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(user_controller_1.UserController.prototype.updateUser)), async function UserController_updateUser(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_updateUser, request, response });
            const controller = new user_controller_1.UserController();
            await templateService.apiHandler({
                methodName: 'updateUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_updateUserStatus = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
        requestBody: { "in": "body", "name": "requestBody", "required": true, "dataType": "nestedObjectLiteral", "nestedProperties": { "isActive": { "dataType": "boolean", "required": true } } },
    };
    app.put('/api/users/:id/status', ...((0, runtime_1.fetchMiddlewares)(user_controller_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(user_controller_1.UserController.prototype.updateUserStatus)), async function UserController_updateUserStatus(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_updateUserStatus, request, response });
            const controller = new user_controller_1.UserController();
            await templateService.apiHandler({
                methodName: 'updateUserStatus',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_deleteUser = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
    };
    app.delete('/api/users/:id', ...((0, runtime_1.fetchMiddlewares)(user_controller_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(user_controller_1.UserController.prototype.deleteUser)), async function UserController_deleteUser(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_deleteUser, request, response });
            const controller = new user_controller_1.UserController();
            await templateService.apiHandler({
                methodName: 'deleteUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsRestaurantTableController_getTables = {
        status: { "in": "query", "name": "status", "ref": "TableStatus" },
    };
    app.get('/api/tables', ...((0, runtime_1.fetchMiddlewares)(table_controller_1.RestaurantTableController)), ...((0, runtime_1.fetchMiddlewares)(table_controller_1.RestaurantTableController.prototype.getTables)), async function RestaurantTableController_getTables(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsRestaurantTableController_getTables, request, response });
            const controller = new table_controller_1.RestaurantTableController();
            await templateService.apiHandler({
                methodName: 'getTables',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsRestaurantTableController_getTableById = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
    };
    app.get('/api/tables/:id', ...((0, runtime_1.fetchMiddlewares)(table_controller_1.RestaurantTableController)), ...((0, runtime_1.fetchMiddlewares)(table_controller_1.RestaurantTableController.prototype.getTableById)), async function RestaurantTableController_getTableById(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsRestaurantTableController_getTableById, request, response });
            const controller = new table_controller_1.RestaurantTableController();
            await templateService.apiHandler({
                methodName: 'getTableById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsRestaurantTableController_createTable = {
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "CreateTableDto" },
    };
    app.post('/api/tables', ...((0, runtime_1.fetchMiddlewares)(table_controller_1.RestaurantTableController)), ...((0, runtime_1.fetchMiddlewares)(table_controller_1.RestaurantTableController.prototype.createTable)), async function RestaurantTableController_createTable(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsRestaurantTableController_createTable, request, response });
            const controller = new table_controller_1.RestaurantTableController();
            await templateService.apiHandler({
                methodName: 'createTable',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsRestaurantTableController_updateTable = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "UpdateTableDto" },
    };
    app.put('/api/tables/:id', ...((0, runtime_1.fetchMiddlewares)(table_controller_1.RestaurantTableController)), ...((0, runtime_1.fetchMiddlewares)(table_controller_1.RestaurantTableController.prototype.updateTable)), async function RestaurantTableController_updateTable(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsRestaurantTableController_updateTable, request, response });
            const controller = new table_controller_1.RestaurantTableController();
            await templateService.apiHandler({
                methodName: 'updateTable',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsRestaurantTableController_deleteTable = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
    };
    app.delete('/api/tables/:id', ...((0, runtime_1.fetchMiddlewares)(table_controller_1.RestaurantTableController)), ...((0, runtime_1.fetchMiddlewares)(table_controller_1.RestaurantTableController.prototype.deleteTable)), async function RestaurantTableController_deleteTable(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsRestaurantTableController_deleteTable, request, response });
            const controller = new table_controller_1.RestaurantTableController();
            await templateService.apiHandler({
                methodName: 'deleteTable',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsReportController_getRevenueReport = {
        startDate: { "in": "query", "name": "startDate", "dataType": "string" },
        endDate: { "in": "query", "name": "endDate", "dataType": "string" },
    };
    app.get('/api/reports/revenue', ...((0, runtime_1.fetchMiddlewares)(report_controller_1.ReportController)), ...((0, runtime_1.fetchMiddlewares)(report_controller_1.ReportController.prototype.getRevenueReport)), async function ReportController_getRevenueReport(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsReportController_getRevenueReport, request, response });
            const controller = new report_controller_1.ReportController();
            await templateService.apiHandler({
                methodName: 'getRevenueReport',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsPaymentController_getPayments = {};
    app.get('/api/payments', ...((0, runtime_1.fetchMiddlewares)(payment_controller_1.PaymentController)), ...((0, runtime_1.fetchMiddlewares)(payment_controller_1.PaymentController.prototype.getPayments)), async function PaymentController_getPayments(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsPaymentController_getPayments, request, response });
            const controller = new payment_controller_1.PaymentController();
            await templateService.apiHandler({
                methodName: 'getPayments',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsPaymentController_getPaymentById = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
    };
    app.get('/api/payments/:id', ...((0, runtime_1.fetchMiddlewares)(payment_controller_1.PaymentController)), ...((0, runtime_1.fetchMiddlewares)(payment_controller_1.PaymentController.prototype.getPaymentById)), async function PaymentController_getPaymentById(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsPaymentController_getPaymentById, request, response });
            const controller = new payment_controller_1.PaymentController();
            await templateService.apiHandler({
                methodName: 'getPaymentById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsPaymentController_createPayment = {
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "CreatePaymentDto" },
    };
    app.post('/api/payments', ...((0, runtime_1.fetchMiddlewares)(payment_controller_1.PaymentController)), ...((0, runtime_1.fetchMiddlewares)(payment_controller_1.PaymentController.prototype.createPayment)), async function PaymentController_createPayment(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsPaymentController_createPayment, request, response });
            const controller = new payment_controller_1.PaymentController();
            await templateService.apiHandler({
                methodName: 'createPayment',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsOrderController_getOrders = {
        status: { "in": "query", "name": "status", "ref": "OrderStatus" },
    };
    app.get('/api/orders', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(order_controller_1.OrderController)), ...((0, runtime_1.fetchMiddlewares)(order_controller_1.OrderController.prototype.getOrders)), async function OrderController_getOrders(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsOrderController_getOrders, request, response });
            const controller = new order_controller_1.OrderController();
            await templateService.apiHandler({
                methodName: 'getOrders',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsOrderController_getOrderById = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
    };
    app.get('/api/orders/:id', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(order_controller_1.OrderController)), ...((0, runtime_1.fetchMiddlewares)(order_controller_1.OrderController.prototype.getOrderById)), async function OrderController_getOrderById(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsOrderController_getOrderById, request, response });
            const controller = new order_controller_1.OrderController();
            await templateService.apiHandler({
                methodName: 'getOrderById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsOrderController_createOrder = {
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "CreateOrderDto" },
    };
    app.post('/api/orders', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(order_controller_1.OrderController)), ...((0, runtime_1.fetchMiddlewares)(order_controller_1.OrderController.prototype.createOrder)), async function OrderController_createOrder(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsOrderController_createOrder, request, response });
            const controller = new order_controller_1.OrderController();
            await templateService.apiHandler({
                methodName: 'createOrder',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsOrderController_updateOrderStatus = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "UpdateOrderStatusDto" },
    };
    app.put('/api/orders/:id/status', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(order_controller_1.OrderController)), ...((0, runtime_1.fetchMiddlewares)(order_controller_1.OrderController.prototype.updateOrderStatus)), async function OrderController_updateOrderStatus(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsOrderController_updateOrderStatus, request, response });
            const controller = new order_controller_1.OrderController();
            await templateService.apiHandler({
                methodName: 'updateOrderStatus',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsMenuItemController_getMenuItems = {
        categoryId: { "in": "query", "name": "categoryId", "dataType": "string" },
    };
    app.get('/api/menu-items', ...((0, runtime_1.fetchMiddlewares)(menu_item_controller_1.MenuItemController)), ...((0, runtime_1.fetchMiddlewares)(menu_item_controller_1.MenuItemController.prototype.getMenuItems)), async function MenuItemController_getMenuItems(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsMenuItemController_getMenuItems, request, response });
            const controller = new menu_item_controller_1.MenuItemController();
            await templateService.apiHandler({
                methodName: 'getMenuItems',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsMenuItemController_getMenuItemById = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
    };
    app.get('/api/menu-items/:id', ...((0, runtime_1.fetchMiddlewares)(menu_item_controller_1.MenuItemController)), ...((0, runtime_1.fetchMiddlewares)(menu_item_controller_1.MenuItemController.prototype.getMenuItemById)), async function MenuItemController_getMenuItemById(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsMenuItemController_getMenuItemById, request, response });
            const controller = new menu_item_controller_1.MenuItemController();
            await templateService.apiHandler({
                methodName: 'getMenuItemById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsMenuItemController_createMenuItem = {
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "CreateMenuItemDto" },
    };
    app.post('/api/menu-items', ...((0, runtime_1.fetchMiddlewares)(menu_item_controller_1.MenuItemController)), ...((0, runtime_1.fetchMiddlewares)(menu_item_controller_1.MenuItemController.prototype.createMenuItem)), async function MenuItemController_createMenuItem(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsMenuItemController_createMenuItem, request, response });
            const controller = new menu_item_controller_1.MenuItemController();
            await templateService.apiHandler({
                methodName: 'createMenuItem',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsMenuItemController_updateMenuItem = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "UpdateMenuItemDto" },
    };
    app.put('/api/menu-items/:id', ...((0, runtime_1.fetchMiddlewares)(menu_item_controller_1.MenuItemController)), ...((0, runtime_1.fetchMiddlewares)(menu_item_controller_1.MenuItemController.prototype.updateMenuItem)), async function MenuItemController_updateMenuItem(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsMenuItemController_updateMenuItem, request, response });
            const controller = new menu_item_controller_1.MenuItemController();
            await templateService.apiHandler({
                methodName: 'updateMenuItem',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsMenuItemController_deleteMenuItem = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
    };
    app.delete('/api/menu-items/:id', ...((0, runtime_1.fetchMiddlewares)(menu_item_controller_1.MenuItemController)), ...((0, runtime_1.fetchMiddlewares)(menu_item_controller_1.MenuItemController.prototype.deleteMenuItem)), async function MenuItemController_deleteMenuItem(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsMenuItemController_deleteMenuItem, request, response });
            const controller = new menu_item_controller_1.MenuItemController();
            await templateService.apiHandler({
                methodName: 'deleteMenuItem',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsDashboardController_getOverview = {};
    app.get('/api/dashboard/overview', ...((0, runtime_1.fetchMiddlewares)(dashboard_controller_1.DashboardController)), ...((0, runtime_1.fetchMiddlewares)(dashboard_controller_1.DashboardController.prototype.getOverview)), async function DashboardController_getOverview(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsDashboardController_getOverview, request, response });
            const controller = new dashboard_controller_1.DashboardController();
            await templateService.apiHandler({
                methodName: 'getOverview',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsCategoryController_getCategories = {};
    app.get('/api/categories', ...((0, runtime_1.fetchMiddlewares)(category_controller_1.CategoryController)), ...((0, runtime_1.fetchMiddlewares)(category_controller_1.CategoryController.prototype.getCategories)), async function CategoryController_getCategories(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsCategoryController_getCategories, request, response });
            const controller = new category_controller_1.CategoryController();
            await templateService.apiHandler({
                methodName: 'getCategories',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsCategoryController_getCategoryById = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
    };
    app.get('/api/categories/:id', ...((0, runtime_1.fetchMiddlewares)(category_controller_1.CategoryController)), ...((0, runtime_1.fetchMiddlewares)(category_controller_1.CategoryController.prototype.getCategoryById)), async function CategoryController_getCategoryById(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsCategoryController_getCategoryById, request, response });
            const controller = new category_controller_1.CategoryController();
            await templateService.apiHandler({
                methodName: 'getCategoryById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsCategoryController_createCategory = {
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "CreateCategoryDto" },
    };
    app.post('/api/categories', ...((0, runtime_1.fetchMiddlewares)(category_controller_1.CategoryController)), ...((0, runtime_1.fetchMiddlewares)(category_controller_1.CategoryController.prototype.createCategory)), async function CategoryController_createCategory(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsCategoryController_createCategory, request, response });
            const controller = new category_controller_1.CategoryController();
            await templateService.apiHandler({
                methodName: 'createCategory',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsCategoryController_updateCategory = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "UpdateCategoryDto" },
    };
    app.put('/api/categories/:id', ...((0, runtime_1.fetchMiddlewares)(category_controller_1.CategoryController)), ...((0, runtime_1.fetchMiddlewares)(category_controller_1.CategoryController.prototype.updateCategory)), async function CategoryController_updateCategory(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsCategoryController_updateCategory, request, response });
            const controller = new category_controller_1.CategoryController();
            await templateService.apiHandler({
                methodName: 'updateCategory',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsCategoryController_deleteCategory = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
    };
    app.delete('/api/categories/:id', ...((0, runtime_1.fetchMiddlewares)(category_controller_1.CategoryController)), ...((0, runtime_1.fetchMiddlewares)(category_controller_1.CategoryController.prototype.deleteCategory)), async function CategoryController_deleteCategory(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsCategoryController_deleteCategory, request, response });
            const controller = new category_controller_1.CategoryController();
            await templateService.apiHandler({
                methodName: 'deleteCategory',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAuthController_register = {
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "RegisterDto" },
    };
    app.post('/api/auth/register', ...((0, runtime_1.fetchMiddlewares)(auth_controller_1.AuthController)), ...((0, runtime_1.fetchMiddlewares)(auth_controller_1.AuthController.prototype.register)), async function AuthController_register(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_register, request, response });
            const controller = new auth_controller_1.AuthController();
            await templateService.apiHandler({
                methodName: 'register',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAuthController_login = {
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "LoginDto" },
    };
    app.post('/api/auth/login', ...((0, runtime_1.fetchMiddlewares)(auth_controller_1.AuthController)), ...((0, runtime_1.fetchMiddlewares)(auth_controller_1.AuthController.prototype.login)), async function AuthController_login(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_login, request, response });
            const controller = new auth_controller_1.AuthController();
            await templateService.apiHandler({
                methodName: 'login',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAuthController_getProfile = {
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
    };
    app.get('/api/auth/me', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(auth_controller_1.AuthController)), ...((0, runtime_1.fetchMiddlewares)(auth_controller_1.AuthController.prototype.getProfile)), async function AuthController_getProfile(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_getProfile, request, response });
            const controller = new auth_controller_1.AuthController();
            await templateService.apiHandler({
                methodName: 'getProfile',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    function authenticateMiddleware(security = []) {
        return async function runAuthenticationMiddleware(request, response, next) {
            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
            // keep track of failed auth attempts so we can hand back the most
            // recent one.  This behavior was previously existing so preserving it
            // here
            const failedAttempts = [];
            const pushAndRethrow = (error) => {
                failedAttempts.push(error);
                throw error;
            };
            const secMethodOrPromises = [];
            for (const secMethod of security) {
                if (Object.keys(secMethod).length > 1) {
                    const secMethodAndPromises = [];
                    for (const name in secMethod) {
                        secMethodAndPromises.push(expressAuthenticationRecasted(request, name, secMethod[name], response)
                            .catch(pushAndRethrow));
                    }
                    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
                    secMethodOrPromises.push(Promise.all(secMethodAndPromises)
                        .then(users => { return users[0]; }));
                }
                else {
                    for (const name in secMethod) {
                        secMethodOrPromises.push(expressAuthenticationRecasted(request, name, secMethod[name], response)
                            .catch(pushAndRethrow));
                    }
                }
            }
            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
            try {
                request['user'] = await Promise.any(secMethodOrPromises);
                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }
                next();
            }
            catch (err) {
                // Show most recent error as response
                const error = failedAttempts.pop();
                error.status = error.status || 401;
                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }
                next(error);
            }
            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        };
    }
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
