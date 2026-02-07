import { DevicePlatform } from '@prisma/client';

type ParsedUserAgent = {
    deviceName: string | null;
    osVersion: string | null;
    appVersion: string | null;
    platform: DevicePlatform | null;
};

const normalizeDeviceName = (userAgent: string) => {
    const trimmed = userAgent.trim();
    if (trimmed.length <= 200) return trimmed;
    return trimmed.slice(0, 200);
};

const parseOsVersion = (userAgent: string) => {
    const androidMatch = userAgent.match(/Android\s([0-9._]+)/i);
    if (androidMatch) return `Android ${androidMatch[1].replace(/_/g, '.')}`;

    const iosMatch = userAgent.match(/OS\s([0-9_]+)\slike\sMac\sOS\sX/i);
    if (iosMatch) return `iOS ${iosMatch[1].replace(/_/g, '.')}`;

    const windowsMatch = userAgent.match(/Windows NT\s([0-9.]+)/i);
    if (windowsMatch) return `Windows ${windowsMatch[1]}`;

    const macMatch = userAgent.match(/Mac OS X\s([0-9_]+)/i);
    if (macMatch) return `macOS ${macMatch[1].replace(/_/g, '.')}`;

    const linuxMatch = userAgent.match(/Linux\s([0-9._-]+)/i);
    if (linuxMatch) return `Linux ${linuxMatch[1]}`;

    return null;
};

const parseAppVersion = (userAgent: string) => {
    const appMatch = userAgent.match(/(?:appversion|app_version|appver)[\\/\s:]?([0-9.]+)/i);
    if (!appMatch) return null;
    return appMatch[1];
};

const parsePlatform = (userAgent: string) => {
    const lower = userAgent.toLowerCase();
    if (lower.includes('android')) return DevicePlatform.ANDROID;
    if (lower.includes('iphone') || lower.includes('ipad') || lower.includes('ios')) return DevicePlatform.IOS;
    if (lower.includes('electron') || lower.includes('desktop')) return DevicePlatform.DESKTOP;
    return DevicePlatform.WEB;
};

const parseDeviceName = (userAgent: string) => {
    if (/iphone/i.test(userAgent)) return 'iPhone';
    if (/ipad/i.test(userAgent)) return 'iPad';
    if (/android/i.test(userAgent)) return 'Android';
    if (/windows/i.test(userAgent)) return 'Windows';
    if (/macintosh|mac os x/i.test(userAgent)) return 'Mac';
    return normalizeDeviceName(userAgent);
};

export const parseUserAgent = (userAgent?: string | null): ParsedUserAgent => {
    if (!userAgent) {
        return {
            deviceName: null,
            osVersion: null,
            appVersion: null,
            platform: null,
        };
    }

    return {
        deviceName: parseDeviceName(userAgent),
        osVersion: parseOsVersion(userAgent),
        appVersion: parseAppVersion(userAgent),
        platform: parsePlatform(userAgent),
    };
};
