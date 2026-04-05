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

interface NewRow {
    label: string;
    email: string;
}

const EmailsTable: React.FC<Props> = ({ emails, onChange }) => {
    const [newRow, setNewRow] = useState<NewRow>({ label: '', email: '' });
    const [adding, setAdding] = useState(false);

    const handleAdd = (): void => {
        if (!newRow.label.trim() || !newRow.email.trim()) return;

        const entry: EmailEntry = {
            id: Date.now().toString(36),
            label: newRow.label.trim(),
            email: newRow.email.trim(),
        };
        onChange([...emails, entry]);
        setNewRow({ label: '', email: '' });
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
                        <TableCell>{I18n.t('label')}</TableCell>
                        <TableCell>{I18n.t('email')}</TableCell>
                        <TableCell>{I18n.t('actions')}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {emails.map(entry => (
                        <TableRow key={entry.id}>
                            <TableCell>{entry.label}</TableCell>
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
                                    label={I18n.t('label')}
                                    value={newRow.label}
                                    onChange={e => setNewRow(prev => ({ ...prev, label: e.target.value }))}
                                    sx={{ width: 160 }}
                                />
                            </TableCell>
                            <TableCell>
                                <TextField
                                    size="small"
                                    label={I18n.t('email')}
                                    type="email"
                                    value={newRow.email}
                                    onChange={e => setNewRow(prev => ({ ...prev, email: e.target.value }))}
                                    sx={{ width: 220 }}
                                />
                            </TableCell>
                            <TableCell>
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={handleAdd}
                                    disabled={!newRow.label.trim() || !newRow.email.trim()}
                                    sx={{ mr: 1 }}
                                >
                                    {I18n.t('save')}
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => { setAdding(false); setNewRow({ label: '', email: '' }); }}
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
