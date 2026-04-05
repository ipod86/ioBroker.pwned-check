import React, { useState } from 'react';
import {
    Box,
    Button,
    IconButton,
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
import AddIcon from '@mui/icons-material/Add';
import { I18n } from '@iobroker/adapter-react-v5';
import { EmailEntry } from '../types';

interface Props {
    emails: EmailEntry[];
    onChange: (emails: EmailEntry[]) => void;
}

const EmailsTable: React.FC<Props> = ({ emails, onChange }) => {
    const [newEmail, setNewEmail] = useState('');
    const [adding, setAdding] = useState(false);

    const handleAdd = (): void => {
        if (!newEmail.trim()) return;
        const entry: EmailEntry = {
            id: Date.now().toString(36),
            email: newEmail.trim(),
        };
        onChange([...emails, entry]);
        setNewEmail('');
        setAdding(false);
    };

    const handleDelete = (id: string): void => {
        onChange(emails.filter(e => e.id !== id));
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>{I18n.t('emails')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {I18n.t('emailsHint')}
            </Typography>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>{I18n.t('email')}</TableCell>
                        <TableCell>{I18n.t('actions')}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {emails.map(entry => (
                        <TableRow key={entry.id}>
                            <TableCell>{entry.email}</TableCell>
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
                                    label={I18n.t('email')}
                                    type="email"
                                    value={newEmail}
                                    onChange={e => setNewEmail(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                    sx={{ width: 260 }}
                                    autoFocus
                                />
                            </TableCell>
                            <TableCell>
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={handleAdd}
                                    disabled={!newEmail.trim()}
                                    sx={{ mr: 1 }}
                                >
                                    {I18n.t('save')}
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => { setAdding(false); setNewEmail(''); }}
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
                    {I18n.t('addEmail')}
                </Button>
            )}
        </Box>
    );
};

export default EmailsTable;
