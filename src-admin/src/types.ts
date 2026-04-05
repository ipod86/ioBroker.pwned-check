export interface PasswordEntry {
    id: string;
    service: string;
    hash: string;
}

export interface EmailEntry {
    id: string;
    label: string;
    email: string;
}

export interface PwnedCheckConfig {
    passwords: PasswordEntry[];
    emails: EmailEntry[];
    checkInterval: number;
    theme: 'auto' | 'light' | 'dark';
}
