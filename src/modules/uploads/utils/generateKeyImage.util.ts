export const generateKeyPresign = (
    folder: string,
    fileName: string
): string => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    const ext = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
    const unique = crypto.randomUUID(); // Node 18+ hoặc browser hỗ trợ
    return `${folder}/${year}/${month}/${unique}.${ext}`;
};