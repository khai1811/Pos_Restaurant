import { LoginDto, RegisterDto, AuthResponseDto, JwtPayload, PinLoginDto } from '../dtos/auth.dto'; //[cite: 35]
import * as bcrypt from 'bcrypt'; //[cite: 35]
import * as jwt from 'jsonwebtoken'; //[cite: 35]
import { UserRole } from '@prisma/client'; //[cite: 35]
import { prisma } from '../config/prisma'; //[cite: 35]

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_pos_app'; //[cite: 35]
const JWT_EXPIRES_IN = '1d'; //[cite: 35]

export class AuthService {
    async register(data: RegisterDto): Promise<AuthResponseDto> {
        const existingUser = await prisma.user.findUnique({
            where: { username: data.username },
        });
        if (existingUser) {
            throw new Error('Tên đăng nhập đã tồn tại');
        }

        if (data.email) {
            const existingEmail = await prisma.user.findUnique({
                where: { email: data.email },
            });
            if (existingEmail) {
                throw new Error('Email đã được sử dụng');
            }
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = await prisma.user.create({
            data: {
                username: data.username,
                email: data.email ?? null,
                password: hashedPassword,
                fullName: data.fullName,
                role: data.role ?? UserRole.STAFF,
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

    async login(data: LoginDto): Promise<AuthResponseDto> {
        const user = await prisma.user.findUnique({
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

    // Xử lý đăng nhập ca bằng mã PIN
    async pinLogin(data: PinLoginDto): Promise<AuthResponseDto> {
        const user = await prisma.user.findUnique({
            where: { id: data.userId },
        });

        if (!user) {
            throw new Error('Không tìm thấy nhân viên');
        }

        if (!user.isActive) {
            throw new Error('Tài khoản nhân viên đã bị khóa');
        }

        // Kiểm tra khớp mã PIN
        if (!user.pin || user.pin !== data.pin) {
            throw new Error('Mã PIN không chính xác');
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

    private generateToken(payload: JwtPayload): string {
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    }

    public static verifyToken(token: string): JwtPayload {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    }
}