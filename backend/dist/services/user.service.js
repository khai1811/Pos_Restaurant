"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const prisma_1 = require("../config/prisma");
const user_entity_1 = require("../entity/user.entity");
const bcrypt = __importStar(require("bcrypt"));
class UserService {
    async getAll() {
        const users = await prisma_1.prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return users.map((user) => new user_entity_1.UserEntity(user));
    }
    async getById(id) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user)
            return null;
        return new user_entity_1.UserEntity(user);
    }
    async create(data) {
        const existingUsername = await prisma_1.prisma.user.findUnique({
            where: { username: data.username },
        });
        if (existingUsername) {
            throw new Error('Tên đăng nhập đã tồn tại');
        }
        const existingEmail = await prisma_1.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingEmail) {
            throw new Error('Email đã được sử dụng');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await prisma_1.prisma.user.create({
            data: {
                username: data.username,
                email: data.email,
                password: hashedPassword,
                fullName: data.fullName,
                role: data.role,
                isActive: data.isActive ?? true,
            },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return new user_entity_1.UserEntity(user);
    }
    async update(id, data) {
        const user = await prisma_1.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new Error('Không tìm thấy người dùng');
        }
        if (data.username && data.username !== user.username) {
            const existing = await prisma_1.prisma.user.findUnique({
                where: { username: data.username },
            });
            if (existing)
                throw new Error('Tên đăng nhập đã tồn tại');
        }
        if (data.email && data.email !== user.email) {
            const existing = await prisma_1.prisma.user.findUnique({
                where: { email: data.email },
            });
            if (existing)
                throw new Error('Email đã tồn tại');
        }
        const updateData = { ...data };
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }
        const updated = await prisma_1.prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return new user_entity_1.UserEntity(updated);
    }
    async delete(id) {
        const user = await prisma_1.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new Error('Không tìm thấy người dùng');
        }
        await prisma_1.prisma.user.delete({ where: { id } });
        return true;
    }
}
exports.UserService = UserService;
