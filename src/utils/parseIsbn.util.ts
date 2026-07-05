export function validateISBN(isbn: string): boolean {
    // 1. Làm sạch chuỗi
    const cleanIsbn = isbn.replace(/[- ]/g, "");

    // 2. Kiểm tra ISBN-10
    if (cleanIsbn.length === 10) {
        if (!/^\d{9}[\dX]$/i.test(cleanIsbn)) return false;

        const sum = cleanIsbn.split("").reduce((acc: number, char: string, index: number) => {
            const value = (char.toUpperCase() === 'X') ? 10 : parseInt(char);
            return acc + (value * (10 - index));
        }, 0); // acc ở đây là number

        return sum % 11 === 0;
    }

    // 3. Kiểm tra ISBN-13 (Trường hợp mã 9783161484101 của bạn)
    if (cleanIsbn.length === 13) {
        if (!/^\d{13}$/.test(cleanIsbn)) return false;

        const sum = cleanIsbn.split("").reduce((acc: number, char: string, index: number) => {
            const digit = parseInt(char);
            // Trọng số: vị trí lẻ (0, 2...) nhân 1, vị trí chẵn (1, 3...) nhân 3
            const weight = (index % 2 === 0) ? 1 : 3;
            return acc + (digit * weight);
        }, 0);

        return sum % 10 === 0;
    }

    return false;
}