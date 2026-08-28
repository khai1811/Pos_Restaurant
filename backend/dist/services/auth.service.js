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
exports.AuthService = void 0;
const bcrypt = __importStar(require("bcrypt"));
const jwt = __importStar(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma_1 = require("../config/prisma");
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_pos_app';
const JWT_EXPIRES_IN = '1d';
class AuthService {
    async register(data) {
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { username: data.username },
        });
        if (existingUser) {
            throw new Error('Tên đăng nhập đã tồn tại');
        }
        if (data.email) {
            const existingEmail = await prisma_1.prisma.user.findUnique({
                where: { email: data.email },
            });
            if (existingEmail) {
                throw new Error('Email đã được sử dụng');
            }
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await prisma_1.prisma.user.create({
            data: {
                username: data.username,
                email: data.email ?? null,
                password: hashedPassword,
                fullName: data.fullName,
                role: data.role ?? client_1.UserRole.STAFF,
            },
        });
        const token = this.generateToken({
            id: user.id,
            username: user.username,
            role: user.role,
        });
        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
        };
    }
    async login(data) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { username: data.username },
        });
        if (!user) {
            throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
        }
        if (!user.isActive) {
            throw new Error('Tài khoản đã bị khóa');
        }
        const isPasswordValid = await bcrypt.compare(data.password, user.password);
        if (!isPasswordValid) {
            throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
        }
        const token = this.generateToken({
            id: user.id,
            username: user.username,
            role: user.role,
        });
        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
        };
    }
    generateToken(payload) {
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    }
    static verifyToken(token) {
        return jwt.verify(token, JWT_SECRET);
    }
}
exports.AuthService = AuthService;
