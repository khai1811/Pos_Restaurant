import { prisma } from '../config/prisma';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import { UserEntity } from '../entity/user.entity';
import * as bcrypt from 'bcrypt';

// Khai báo sẵn cục select để dùng chung cho gọn
const userSelectFields = {
    id: true,
    username: true,
    email: true,
    fullName: true,
    role: true,
    isActive: true,
    phone: true,
    pin: true,
    avatar: true,
    permissions: true,
    createdAt: true,
    updatedAt: true,
};

export class UserService {
    async getAll(): Promise<UserEntity[]> {
        const users = await prisma.user.findMany({
            // Chỉ lấy những nhân viên đang hoạt động (chưa bị xóa mềm)
            where: { isActive: true },
            select: userSelectFields,
            orderBy: { createdAt: 'desc' },
        });
        return users.map((user) => new UserEntity(user));
    }

    async getById(id: string): Promise<UserEntity | null> {
        const user = await prisma.user.findUnique({
            where: { id },
            select: userSelectFields,
        });
        if (!user) return null;
        return new UserEntity(user);
    }

    async create(data: CreateUserDto): Promise<UserEntity> {
        const existingUsername = await prisma.user.findUnique({
            where: { username: data.username },
        });
        if (existingUsername) throw new Error('Tên đăng nhập đã tồn tại');

        if (data.email) {
            const existingEmail = await prisma.user.findUnique({
                where: { email: data.email },
            });
            if (existingEmail) throw new Error('Email đã được sử dụng');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = await prisma.user.create({
            data: {
                username: data.username,
                email: data.email,
                password: hashedPassword,
                fullName: data.fullName,
                role: data.role,
                isActive: data.isActive ?? true,
                phone: data.phone,
                pin: data.pin,
                avatar: data.avatar,
                permissions: data.permissions ? JSON.parse(JSON.stringify(data.permissions)) : null,
            },
            select: userSelectFields,
        });

        return new UserEntity(user);
    }

    async update(id: string, data: UpdateUserDto): Promise<UserEntity> {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) throw new Error('Không tìm thấy người dùng');

        if (data.username && data.username !== user.username) {
            const existing = await prisma.user.findUnique({
                where: { username: data.username },
            });
            if (existing) throw new Error('Tên đăng nhập đã tồn tại');
        }

        if (data.email && data.email !== user.email) {
            const existing = await prisma.user.findUnique({
                where: { email: data.email },
            });
            if (existing) throw new Error('Email đã tồn tại');
        }

        const updateData: any = { ...data };
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        // Đảm bảo permissions được lưu dưới dạng JSON chuẩn
        if (data.permissions !== undefined) {
            updateData.permissions = data.permissions ? JSON.parse(JSON.stringify(data.permissions)) : null;
        }

        const updated = await prisma.user.update({
            where: { id },
            data: updateData,
            select: userSelectFields,
        });

        return new UserEntity(updated);
    }

    async delete(id: string): Promise<boolean> {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) throw new Error('Không tìm thấy người dùng');

        // Xóa mềm: Cập nhật isActive thành false thay vì xóa hẳn khỏi database
        await prisma.user.update({
            where: { id },
            data: { isActive: false }
        });

        return true;
    }
}