import React, { useState } from 'react';
import {
    X,
    CreditCard,
    Banknote,
    QrCode,
    Wallet,
    CheckCircle2,
    Split,
    Copy,
    Check,
    AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Order, PaymentMethod } from '../types/index';
import { formatVND, sound } from '../utils/formatters';

interface PaymentModalProps {
    order: Order;
    onClose: () => void;
    onCompletePayment: (
        paymentMethod: PaymentMethod,
        amountPaid: number,
        changeAmount: number,
        splitDetails?: { cashAmount?: number; vietqrAmount?: number; cardAmount?: number }
    ) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
    order,
    onClose,
    onCompletePayment,
}) => {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('vietqr');
    const [cashGiven, setCashGiven] = useState<number>(order.total);
    const [splitCash, setSplitCash] = useState<number>(Math.round(order.total / 2));
    const [splitQr, setSplitQr] = useState<number>(order.total - Math.round(order.total / 2));
    const [isProcessing, setIsProcessing] = useState(false);
    const [copied, setCopied] = useState(false);

    // Thông tin tài khoản VietQR
    const bankInfo = {
        bankName: 'MBBank (Quân Đội)',
        accountNumber: '988899998888',
        accountName: 'AN GOURMET RESTAURANT',
    };

    const qrAmount = selectedMethod === 'split' ? splitQr : order.total;
    const qrString = `https://api.vietqr.io/image/970422-${bankInfo.accountNumber}-compact2.jpg?amount=${Math.round(
        qrAmount
    )}&addInfo=${encodeURIComponent(order.orderNumber)}&accountName=${encodeURIComponent(
        bankInfo.accountName
    )}`;

    // Gợi ý nhanh tiền mặt
    const calculateQuickCash = (total: number) => {
        const suggestions = [total];
        const roundedUp50k = Math.ceil(total / 50000) * 50000;
        const roundedUp100k = Math.ceil(total / 100000) * 100000;
        const roundedUp500k = Math.ceil(total / 500000) * 500000;

        [roundedUp50k, roundedUp100k, roundedUp500k].forEach((val) => {
            if (val > total && !suggestions.includes(val)) {
                suggestions.push(val);
            }
        });

        if (!suggestions.includes(500000) && total < 500000) suggestions.push(500000);
        if (!suggestions.includes(1000000) && total < 1000000) suggestions.push(1000000);

        return suggestions.slice(0, 5);
    };

    const quickCashList = calculateQuickCash(order.total);
    const changeAmount = Math.max(0, cashGiven - order.total);
    const isSplitValid = splitCash + splitQr === order.total;

    const handleCopyContent = () => {
        navigator.clipboard.writeText(order.orderNumber);
        sound.play('click');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleConfirmPay = () => {
        setIsProcessing(true);
        sound.play('pay_success');

        try {
            confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.7 },
            });
        } catch {
            // Fallback nếu thiếu canvas-confetti
        }

        setTimeout(() => {
            setIsProcessing(false);
            if (selectedMethod === 'split') {
                onCompletePayment(selectedMethod, order.total, 0, {
                    cashAmount: splitCash,
                    vietqrAmount: splitQr,
                });
            } else if (selectedMethod === 'cash') {
                onCompletePayment(selectedMethod, cashGiven, changeAmount);
            } else {
                onCompletePayment(selectedMethod, order.total, 0);
            }
        }, 400);
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 font-sans select-none">
            {/* Khung Modal Cố định chiều cao tối đa, thiết lập dạng Column */}
            <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl flex flex-col max-h-[90dvh] animate-fade-in overflow-hidden border border-slate-200">

                {/* 1. HEADER CỐ ĐỊNH (Không bị cuộn) */}
                <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-white shrink-0">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-[16px] font-black text-slate-800 tracking-tight">Thanh Toán Đơn Hàng</h3>
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-200">
                                {order.orderNumber}
                            </span>
                        </div>
                        <p className="text-[12px] text-slate-500 font-medium">
                            {order.tableName} • {order.guestCount} khách • {order.items.length} món
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            sound.play('click');
                            onClose();
                        }}
                        className="w-8 h-8 bg-slate-100 hover:bg-rose-50 hover:text-rose-500 text-slate-500 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* 2. BODY CUỘN ĐƯỢC (Tự động xuất hiện thanh cuộn khi bàn phím đẩy lên) */}
                <div className="flex-1 overflow-y-auto bg-slate-50/30 p-4 scrollbar-none">

                    {/* Tổng tiền nổi bật */}
                    <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-between shadow-sm">
                        <div>
                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block mb-1">Cần thanh toán:</span>
                            <div className="text-3xl font-black text-amber-400 tracking-tight leading-none">
                                {formatVND(order.total)}
                            </div>
                        </div>
                        <div className="text-right text-[11px] text-slate-300 space-y-0.5 font-medium">
                            <div>Tạm tính: <span className="text-white font-bold">{formatVND(order.subtotal)}</span></div>
                            {order.discountAmount > 0 && (
                                <div className="text-rose-300">Giảm giá: -{formatVND(order.discountAmount)}</div>
                            )}
                            {order.taxAmount > 0 && <div>VAT ({order.taxPercent}%): +{formatVND(order.taxAmount)}</div>}
                        </div>
                    </div>

                    {/* Lưới chọn phương thức thanh toán (Gọn gàng) */}
                    <div className="grid grid-cols-5 gap-2 mb-4">
                        {[
                            { id: 'vietqr', label: 'VietQR', icon: QrCode },
                            { id: 'cash', label: 'Tiền mặt', icon: Banknote },
                            { id: 'card', label: 'Thẻ POS', icon: CreditCard },
                            { id: 'momo', label: 'Ví MoMo', icon: Wallet },
                            { id: 'split', label: 'Tách kênh', icon: Split },
                        ].map((item) => {
                            const Icon = item.icon;
                            const active = selectedMethod === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                        sound.play('click');
                                        setSelectedMethod(item.id as PaymentMethod);
                                    }}
                                    className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${active
                                        ? 'bg-blue-50 border-[#1890ff] text-[#1890ff] shadow-sm'
                                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                        }`}
                                >
                                    <Icon size={20} className={active ? 'text-[#1890ff]' : 'text-slate-400'} />
                                    <span className="text-[10px] font-bold">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Vùng chi tiết nhập liệu */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm min-h-[180px] flex flex-col justify-center">

                        {/* VietQR View */}
                        {selectedMethod === 'vietqr' && (
                            <div className="flex items-center gap-4">
                                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
                                    <img
                                        src={qrString}
                                        alt="VietQR Payment"
                                        className="w-28 h-28 object-contain rounded-lg"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src =
                                                'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' +
                                                encodeURIComponent(`VIETQR|MB|${bankInfo.accountNumber}|${order.total}|${order.orderNumber}`);
                                        }}
                                    />
                                    <p className="text-[9px] text-center text-slate-500 font-bold mt-1 uppercase">Quét App Ngân Hàng</p>
                                </div>
                                <div className="space-y-2 text-[11px] w-full">
                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex justify-between">
                                        <span className="text-slate-500">Ngân hàng:</span>
                                        <strong className="text-slate-800">{bankInfo.bankName}</strong>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex justify-between">
                                        <span className="text-slate-500">Số TK:</span>
                                        <strong className="font-mono text-slate-900 font-black">{bankInfo.accountNumber}</strong>
                                    </div>
                                    <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 flex flex-col gap-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-blue-700 font-medium">Nội dung:</span>
                                            <button
                                                type="button"
                                                onClick={handleCopyContent}
                                                className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-white border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-100 cursor-pointer shadow-sm"
                                            >
                                                {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                                {copied ? 'Đã copy' : 'Copy'}
                                            </button>
                                        </div>
                                        <strong className="font-mono text-[#1890ff] text-[13px]">{order.orderNumber}</strong>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tiền mặt View */}
                        {selectedMethod === 'cash' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                        Khách đưa (VNĐ):
                                    </label>
                                    <input
                                        type="number"
                                        value={cashGiven || ''}
                                        onChange={(e) => setCashGiven(Number(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-[15px] font-black text-slate-900 focus:outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff]"
                                        placeholder="Nhập số tiền..."
                                    />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase">Gợi ý nhanh:</span>
                                    <div className="flex flex-wrap gap-2">
                                        {quickCashList.map((amt) => (
                                            <button
                                                key={amt}
                                                type="button"
                                                onClick={() => { sound.play('click'); setCashGiven(amt); }}
                                                className={`px-3 py-1.5 rounded border text-[11px] font-bold transition-colors cursor-pointer ${cashGiven === amt
                                                    ? 'bg-[#1890ff] text-white border-[#1890ff] shadow-sm'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {formatVND(amt)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-3 mt-1 border-t border-dashed border-slate-200 flex items-center justify-between">
                                    <span className="font-bold text-[13px] text-slate-600">Tiền thừa trả khách:</span>
                                    <span className={`text-xl font-black ${changeAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {formatVND(changeAmount)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Split (Tách kênh) View */}
                        {selectedMethod === 'split' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="font-bold text-[11px] text-slate-600 block mb-1.5 uppercase">1. Tiền mặt (Cash):</label>
                                        <input
                                            type="number"
                                            value={splitCash || ''}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setSplitCash(val);
                                                setSplitQr(Math.max(0, order.total - val));
                                            }}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-[14px] font-black text-slate-900 focus:outline-none focus:border-[#1890ff]"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-bold text-[11px] text-slate-600 block mb-1.5 uppercase">2. Chuyển khoản (QR):</label>
                                        <input
                                            type="number"
                                            value={splitQr || ''}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setSplitQr(val);
                                                setSplitCash(Math.max(0, order.total - val));
                                            }}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-[14px] font-black text-slate-900 focus:outline-none focus:border-[#1890ff]"
                                        />
                                    </div>
                                </div>

                                {!isSplitValid && (
                                    <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200 text-[11px] font-medium">
                                        <AlertCircle size={14} className="shrink-0" />
                                        <span>Tổng tiền tách chưa khớp với giá trị hóa đơn.</span>
                                    </div>
                                )}
                                <div className="text-center text-[12px] font-medium text-slate-500 bg-slate-50 py-2 rounded-lg border border-slate-100">
                                    Tổng cộng: <strong className={isSplitValid ? 'text-emerald-600' : 'text-rose-600'}>{formatVND(splitCash + splitQr)}</strong> / {formatVND(order.total)}
                                </div>
                            </div>
                        )}

                        {/* Thẻ POS / MoMo View */}
                        {(selectedMethod === 'card' || selectedMethod === 'momo') && (
                            <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                                {selectedMethod === 'card' ? <CreditCard className="w-12 h-12 text-[#1890ff] mb-2" strokeWidth={1.5} /> : <Wallet className="w-12 h-12 text-pink-500 mb-2" strokeWidth={1.5} />}
                                <p className="font-black text-slate-800 text-[15px]">
                                    {selectedMethod === 'card' ? 'Quẹt thẻ trên máy POS' : 'Quét mã bằng Ví MoMo'}
                                </p>
                                <p className="text-[11px] font-medium text-slate-500 max-w-[250px]">
                                    {selectedMethod === 'card'
                                        ? 'Yêu cầu khách hàng chạm hoặc cắm thẻ vào thiết bị POS để thanh toán.'
                                        : 'Yêu cầu khách hàng mở ứng dụng MoMo để quét mã QR tĩnh của cửa hàng.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. FOOTER CỐ ĐỊNH (Chứa nút Xác nhận luôn nằm dưới cùng) */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => { sound.play('click'); onClose(); }}
                        className="w-1/3 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-bold text-[13px] transition cursor-pointer"
                    >
                        Quay lại
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmPay}
                        disabled={
                            isProcessing ||
                            (selectedMethod === 'cash' && cashGiven < order.total) ||
                            (selectedMethod === 'split' && !isSplitValid)
                        }
                        className="w-2/3 py-3.5 rounded-xl bg-[#1890ff] hover:bg-blue-600 disabled:bg-slate-300 disabled:text-slate-500 text-white font-black text-[13px] shadow-md transition flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wide"
                    >
                        {isProcessing ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Đang xử lý...
                            </div>
                        ) : (
                            <>
                                <CheckCircle2 size={18} /> Xác Nhận Đã Thu Tiền
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};