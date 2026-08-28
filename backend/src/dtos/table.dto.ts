import { TableStatus } from '@prisma/client';

export interface CreateTableDto {
    tableNumber: number;
    capacity?: number;
    status?: TableStatus;
    area?: string;
}

export interface UpdateTableDto {
    tableNumber?: number;
    capacity?: number;
    status?: TableStatus;
    area?: string;
}

export interface TableResponseDto {
    id: string;
    tableNumber: number;
    capacity: number;
    status: TableStatus;
    area: string;      // 🔥 Bổ sung dòng này
    createdAt: Date;
    updatedAt: Date;
}

export interface TransferTableDto {
    sourceTableId: string;
    targetTableId: string;
    actionType: 'move' | 'merge';
}