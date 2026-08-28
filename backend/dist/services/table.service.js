"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestaurantTableService = void 0;
const prisma_1 = require("../config/prisma");
const table_entity_1 = require("../entity/table.entity");
const client_1 = require("@prisma/client");
class RestaurantTableService {
    async getAll(status) {
        const whereCondition = status ? { status } : {};
        const tables = await prisma_1.prisma.restaurantTable.findMany({
            where: whereCondition,
            orderBy: { tableNumber: 'asc' },
        });
        return tables.map((table) => new table_entity_1.TableEntity(table));
    }
    async getById(id) {
        const table = await prisma_1.prisma.restaurantTable.findUnique({
            where: { id },
        });
        if (!table)
            return null;
        return new table_entity_1.TableEntity(table);
    }
    async create(data) {
        const existing = await prisma_1.prisma.restaurantTable.findUnique({
            where: { tableNumber: data.tableNumber },
        });
        if (existing) {
            throw new Error('Số bàn đã tồn tại');
        }
        const table = await prisma_1.prisma.restaurantTable.create({
            data: {
                tableNumber: data.tableNumber,
                capacity: data.capacity ?? 4,
                status: data.status ?? client_1.TableStatus.AVAILABLE,
            },
        });
        return new table_entity_1.TableEntity(table);
    }
    async update(id, data) {
        const table = await prisma_1.prisma.restaurantTable.findUnique({ where: { id } });
        if (!table) {
            throw new Error('Không tìm thấy bàn');
        }
        if (data.tableNumber && data.tableNumber !== table.tableNumber) {
            const existing = await prisma_1.prisma.restaurantTable.findUnique({
                where: { tableNumber: data.tableNumber },
            });
            if (existing) {
                throw new Error('Số bàn mới đã tồn tại');
            }
        }
        const updated = await prisma_1.prisma.restaurantTable.update({
            where: { id },
            data,
        });
        return new table_entity_1.TableEntity(updated);
    }
    async delete(id) {
        const table = await prisma_1.prisma.restaurantTable.findUnique({ where: { id } });
        if (!table) {
            throw new Error('Không tìm thấy bàn');
        }
        await prisma_1.prisma.restaurantTable.delete({ where: { id } });
        return true;
    }
}
exports.RestaurantTableService = RestaurantTableService;
