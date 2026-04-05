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
    theme: 'auto' | 'light' | 'dark';
}
