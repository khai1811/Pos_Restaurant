// Formatting utilities for Restaurant POS

export function formatVND(amount: number): string {
    if (isNaN(amount)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatNumber(num: number): string {
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('vi-VN').format(num);
}

export function formatDateTime(isoString?: string): string {
    if (!isoString) return '--';
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatDateOnly(isoString?: string): string {
    if (!isoString) return '--';
    const date = new Date(isoString);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export function formatTimeOnly(isoString?: string): string {
    if (!isoString) return '--';
    const date = new Date(isoString);
    return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

// Generate human-friendly order code e.g. HD-260821-004
export function generateOrderNumber(counter: number): string {
    const today = new Date();
    const datePart = `${today.getFullYear().toString().slice(2)}${(today.getMonth() + 1)
        .toString()
        .padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    return `HD${datePart}-${counter.toString().padStart(3, '0')}`;
}

// Sound effects using Web Audio API (Zero external asset dependencies, instant responsive feedback)
class SoundManager {
    private ctx: AudioContext | null = null;
    public enabled = true;

    private getContext() {
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    play(type: 'click' | 'add_item' | 'pay_success' | 'bell' | 'error') {
        if (!this.enabled) return;
        try {
            const ctx = this.getContext();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;

            if (type === 'click') {
                osc.frequency.setValueAtTime(800, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
                osc.start(now);
                osc.stop(now + 0.04);
            } else if (type === 'add_item') {
                osc.frequency.setValueAtTime(520, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
                osc.start(now);
                osc.stop(now + 0.09);
            } else if (type === 'pay_success') {
                // High pleasant dual chime
                osc.frequency.setValueAtTime(587.33, now); // D5
                osc.frequency.setValueAtTime(880, now + 0.1); // A5
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
            } else if (type === 'bell') {
                // Kitchen bell chime
                osc.frequency.setValueAtTime(1046.5, now); // C6
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
            } else if (type === 'error') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.setValueAtTime(160, now + 0.08);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            }
        } catch {
            // Audio might be muted or blocked by browser policy
        }
    }
}

export const sound = new SoundManager();

// Export CSV helper
export function exportToCSV(filename: string, rows: (string | number)[][]) {
    const processRow = (row: (string | number)[]) => {
        return row
            .map((val) => {
                let str = val === null || val === undefined ? '' : String(val);
                str = str.replace(/"/g, '""');
                if (str.search(/("|,|\n)/g) >= 0) {
                    str = `"${str}"`;
                }
                return str;
            })
            .join(',');
    };

    const csvContent = '\uFEFF' + rows.map(processRow).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
