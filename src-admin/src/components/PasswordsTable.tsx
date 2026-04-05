import React, { useState } from 'react';
import {
    Box,
    Button,
    IconButton,
    InputAdornment,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AddIcon from '@mui/icons-material/Add';
import { I18n } from '@iobroker/adapter-react-v5';
import { PasswordEntry } from '../types';

interface Props {
    passwords: PasswordEntry[];
    onChange: (passwords: PasswordEntry[]) => void;
}

interface NewRow {
    description: string;
    password: string;
    showPassword: boolean;
    hash: string;
    entropy: number;
}

/**
 * Computes password entropy in bits
 *
 * @param password - The password string
 * @returns Entropy in bits
 */
function computeEntropy(password: string): number {
    if (!password) return 0;
    let charsetSize = 0;
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;
    if (charsetSize === 0) return 0;
    return Math.log2(Math.pow(charsetSize, password.length));
}

/**
 * Returns strength label and color based on entropy
 *
 * @param entropy - Entropy in bits
 * @returns Object with label, color, and progress value
 */
function getStrength(entropy: number): { label: string; color: 'error' | 'warning' | 'success'; value: number } {
    if (entropy < 40) return { label: I18n.t('strengthWeak'), color: 'error', value: Math.min((entropy / 40) * 33, 33) };
    if (entropy < 60) return { label: I18n.t('strengthMedium'), color: 'warning', value: 33 + ((entropy - 40) / 20) * 34 };
    return { label: I18n.t('strengthGood'), color: 'success', value: 67 + Math.min(((entropy - 60) / 40) * 33, 33) };
}

/**
 * Computes SHA-1 hash of a string using WebCrypto API
 *
 * @param password - The plaintext password
 * @returns Hex SHA-1 hash string
 */
async function sha1(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const PasswordsTable: React.FC<Props> = ({ passwords, onChange }) => {
    const [newRow, setNewRow] = useState<NewRow>({
        description: '',
        password: '',
        showPassword: false,
        hash: '',
        entropy: 0,
    });
    const [adding, setAdding] = useState(false);

    const handlePasswordChange = async (pw: string): Promise<void> => {
        const entropy = computeEntropy(pw);
        const hash = pw ? await sha1(pw) : '';
        setNewRow(prev => ({ ...prev, password: pw, entropy, hash }));
    };

    const handleAdd = async (): Promise<void> => {
        if (!newRow.description.trim()) return;
        if (!newRow.hash) return;

        const entry: PasswordEntry = {
            id: Date.now().toString(36),
            description: newRow.description.trim(),
            hash: newRow.hash,
        };
        onChange([...passwords, entry]);
        setNewRow({ description: '', password: '', showPassword: false, hash: '', entropy: 0 });
        setAdding(false);
    };

    const handleDelete = (id: string): void => {
        onChange(passwords.filter(p => p.id !== id));
    };

    const strength = getStrength(newRow.entropy);

    return (
        <Box>
            <Typography variant="h6" gutterBottom>{I18n.t('passwords')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {I18n.t('passwordsHint')}
            </Typography>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>{I18n.t('description')}</TableCell>
                        <TableCell>{I18n.t('hash')}</TableCell>
                        <TableCell>{I18n.t('actions')}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {passwords.map(entry => (
                        <TableRow key={entry.id}>
                            <TableCell>{entry.description}</TableCell>
                            <TableCell>
                                <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                    {entry.hash}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Tooltip title={I18n.t('delete')}>
                                    <IconButton size="small" onClick={() => handleDelete(entry.id)} color="error">
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                    ))}
                    {adding && (
                        <TableRow>
                            <TableCell>
                                <TextField
                                    size="small"
                                    label={I18n.t('description')}
                                    value={newRow.description}
                                    onChange={e => setNewRow(prev => ({ ...prev, description: e.target.value }))}
                                    sx={{ width: 160 }}
                                />
                            </TableCell>
                            <TableCell colSpan={1}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <TextField
                                        size="small"
                                        label={I18n.t('password')}
                                        type={newRow.showPassword ? 'text' : 'password'}
                                        value={newRow.password}
                                        onChange={e => void handlePasswordChange(e.target.value)}
                                        sx={{ width: 220 }}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setNewRow(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                                                    >
                                                        {newRow.showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                    {newRow.password && (
                                        <Box sx={{ width: 220 }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={strength.value}
                                                color={strength.color}
                                                sx={{ height: 6, borderRadius: 3 }}
                                            />
                                            <Typography variant="caption" color={`${strength.color}.main`}>
                                                {strength.label} ({Math.round(newRow.entropy)} bits)
                                            </Typography>
                                        </Box>
                                    )}
                                    {newRow.hash && (
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', maxWidth: 220 }} color="text.secondary">
                                            SHA-1: {newRow.hash}
                                        </Typography>
                                    )}
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => void handleAdd()}
                                    disabled={!newRow.description.trim() || !newRow.hash}
                                    sx={{ mr: 1 }}
                                >
                                    {I18n.t('save')}
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => { setAdding(false); setNewRow({ description: '', password: '', showPassword: false, hash: '', entropy: 0 }); }}
                                >
                                    {I18n.t('cancel')}
                                </Button>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            {!adding && (
                <Button
                    startIcon={<AddIcon />}
                    onClick={() => setAdding(true)}
                    sx={{ mt: 2 }}
                    variant="outlined"
                >
                    {I18n.t('addPassword')}
                </Button>
            )}
        </Box>
    );
};

export default PasswordsTable;
