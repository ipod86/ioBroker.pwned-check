export interface PasswordEntry {
    id: string;
    description: string;
    hash: string;
}

export interface EmailEntry {
    id: string;
    email: string;
}

export interface PwnedCheckConfig {
    passwords: PasswordEntry[];
    emails: EmailEntry[];
    checkInterval: number;
    theme: 'light' | 'dark';
    bgOpacity: number;
    cardOpacity: number;
    fontSize: number;
    cardColor: string;
    compactView: boolean;
}
