"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const prisma_1 = require("../config/prisma");
const order_entity_1 = require("../entity/order.entity");
const client_1 = require("@prisma/client");
class OrderService {
    // =========================================================
    // MAP PRISMA -> ENTITY
    // =========================================================
    mapToEntity(order) {
        const staff = order?.staff;
        const items = Array.isArray(order?.orderItems)
            ? order.orderItems
            : Array.isArray(order?.items)
                ? order.items
                : [];
        return new order_entity_1.OrderEntity({
            ...order,
            totalAmount: Number(order?.totalAmount || 0),
            tableNumber: order?.table?.tableNumber,
            userName: staff?.fullName ||
                staff?.username ||
                '',
            items: items.map((item) => new order_entity_1.OrderItemEntity({
                ...item,
                unitPrice: Number(item?.price ??
                    item?.unitPrice ??
                    0),
                menuItemName: item?.menuItem?.name,
            })),
        });
    }
    // =========================================================
    // GET ALL
    // =========================================================
    async getAll(status) {
        const whereCondition = status
            ? { status }
            : {};
        const orders = await prisma_1.prisma.order.findMany({
            where: whereCondition,
            include: {
                table: true,
                staff: true,
                orderItems: {
                    include: {
                        menuItem: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return orders.map((order) => this.mapToEntity(order));
    }
    // =========================================================
    // GET BY ID
    // =========================================================
    async getById(id) {
        const order = await prisma_1.prisma.order.findUnique({
            where: {
                id,
            },
            include: {
                table: true,
                staff: true,
                orderItems: {
                    include: {
                        menuItem: true,
                    },
                },
            },
        });
        if (!order) {
            return null;
        }
        return this.mapToEntity(order);
    }
    // =========================================================
    // CREATE ORDER
    // =========================================================
    async create(data) {
        console.log('========== ORDER SERVICE ==========');
        console.log('DATA:', JSON.stringify(data, null, 2));
        // -----------------------------------------------------
        // 1. KIỂM TRA USER
        // -----------------------------------------------------
        if (!data.userId) {
            throw new Error('Không xác định được nhân viên đăng nhập');
        }
        // -----------------------------------------------------
        // 2. KIỂM TRA TABLE ID
        // -----------------------------------------------------
        if (!data.tableId) {
            throw new Error('Thiếu tableId');
        }
        // -----------------------------------------------------
        // 3. TÌM BÀN
        // -----------------------------------------------------
        const table = await prisma_1.prisma.restaurantTable.findUnique({
            where: {
                id: String(data.tableId),
            },
        });
        if (!table) {
            throw new Error(`Không tìm thấy bàn với ID ${data.tableId}`);
        }
        // -----------------------------------------------------
        // 4. KIỂM TRA ITEMS
        // -----------------------------------------------------
        if (!Array.isArray(data.items) ||
            data.items.length === 0) {
            throw new Error('Đơn hàng phải có ít nhất một món');
        }
        // -----------------------------------------------------
        // 5. XỬ LÝ ORDER ITEMS
        // -----------------------------------------------------
        let totalAmount = 0;
        const orderItemsData = [];
        for (let index = 0; index < data.items.length; index++) {
            const item = data.items[index];
            // -----------------------------
            // menuItemId
            // -----------------------------
            if (!item?.menuItemId) {
                throw new Error(`Món thứ ${index + 1} thiếu menuItemId`);
            }
            // -----------------------------
            // quantity
            // -----------------------------
            const quantity = Number(item.quantity);
            if (!Number.isInteger(quantity) ||
                quantity <= 0) {
                throw new Error(`Số lượng món ${item.menuItemId} không hợp lệ`);
            }
            // -----------------------------
            // TÌM MÓN
            // -----------------------------
            const menuItem = await prisma_1.prisma.menuItem.findUnique({
                where: {
                    id: String(item.menuItemId),
                },
            });
            if (!menuItem) {
                throw new Error(`Không tìm thấy món ăn với ID ${item.menuItemId}`);
            }
            // -----------------------------
            // KIỂM TRA MÓN CÓ BÁN
            // -----------------------------
            if (!menuItem.isAvailable) {
                throw new Error(`Món ${menuItem.name} hiện đã hết`);
            }
            // -----------------------------
            // TÍNH TIỀN
            // -----------------------------
            const unitPrice = Number(menuItem.price);
            const subtotal = unitPrice * quantity;
            totalAmount += subtotal;
            // -----------------------------
            // PUSH ORDER ITEM
            // -----------------------------
            orderItemsData.push({
                menuItemId: String(item.menuItemId),
                quantity,
                price: unitPrice,
                subtotal,
                note: item.note ?? null,
            });
        }
        // -----------------------------------------------------
        // 6. DỮ LIỆU TẠO ORDER
        // -----------------------------------------------------
        const createData = {
            tableId: String(data.tableId),
            note: data.note || null,
            totalAmount,
            status: client_1.OrderStatus.PENDING,
            staffId: String(data.userId),
            orderItems: {
                create: orderItemsData,
            },
        };
        console.log('PRISMA CREATE DATA:', JSON.stringify(createData, null, 2));
        // -----------------------------------------------------
        // 7. TRANSACTION
        // -----------------------------------------------------
        const newOrder = await prisma_1.prisma.$transaction(async (tx) => {
            // -------------------------
            // CREATE ORDER
            // -------------------------
            const createdOrder = await tx.order.create({
                data: createData,
                include: {
                    table: true,
                    staff: true,
                    orderItems: {
                        include: {
                            menuItem: true,
                        },
                    },
                },
            });
            // -------------------------
            // UPDATE TABLE
            // -------------------------
            await tx.restaurantTable.update({
                where: {
                    id: String(data.tableId),
                },
                data: {
                    status: client_1.TableStatus.OCCUPIED,
                },
            });
            return createdOrder;
        });
        console.log('ORDER CREATED:', newOrder.id);
        return this.mapToEntity(newOrder);
    }
    // =========================================================
    // UPDATE STATUS
    // =========================================================
    async updateStatus(id, data) {
        const order = await prisma_1.prisma.order.findUnique({
            where: {
                id,
            },
        });
        if (!order) {
            throw new Error('Không tìm thấy đơn hàng');
        }
        const updated = await prisma_1.prisma.order.update({
            where: {
                id,
            },
            data: {
                status: data.status,
            },
            include: {
                table: true,
                staff: true,
                orderItems: {
                    include: {
                        menuItem: true,
                    },
                },
            },
        });
        // -----------------------------------------------------
        // CANCEL -> TABLE AVAILABLE
        // -----------------------------------------------------
        if (data.status ===
            client_1.OrderStatus.CANCELLED) {
            await prisma_1.prisma.restaurantTable.update({
                where: {
                    id: updated.tableId,
                },
                data: {
                    status: client_1.TableStatus.AVAILABLE,
                },
            });
        }
        return this.mapToEntity(updated);
    }
}
exports.OrderService = OrderService;
