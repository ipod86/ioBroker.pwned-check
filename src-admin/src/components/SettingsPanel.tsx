import React, { useState } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { I18n } from '@iobroker/adapter-react-v5';
import { PwnedCheckConfig } from '../types';

interface Props {
    native: PwnedCheckConfig;
    onChange: (newNative: PwnedCheckConfig) => void;
    socket: any;
    instance: number;
}

const SettingsPanel: React.FC<Props> = ({ native, onChange, socket, instance }) => {
    const [checking, setChecking] = useState(false);
    const [checkResult, setCheckResult] = useState<string | null>(null);

    const update = (field: keyof PwnedCheckConfig, value: any): void => {
        onChange({ ...native, [field]: value });
    };

    const handleCheckNow = async (): Promise<void> => {
        setChecking(true);
        setCheckResult(null);
        try {
            await new Promise<void>((resolve, reject) => {
                socket.sendTo(`pwned-check.${instance}`, 'checkNow', {}, (res: any) => {
                    if (res?.error) reject(new Error(res.error));
                    else resolve();
                });
            });
            setCheckResult(I18n.t('checkTriggered'));
        } catch (err) {
            setCheckResult(I18n.t('checkError'));
        } finally {
            setChecking(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Check interval */}
            <Box>
                <Typography variant="h6" gutterBottom>{I18n.t('checkInterval')}</Typography>
                <TextField
                    label={I18n.t('checkIntervalHours')}
                    type="number"
                    value={native.checkInterval ?? 24}
                    inputProps={{ min: 1, max: 168 }}
                    onChange={e => update('checkInterval', parseInt(e.target.value) || 24)}
                    helperText={I18n.t('checkIntervalHelp')}
                    sx={{ width: 200 }}
                />
            </Box>

            <Divider />

            {/* Theme */}
            <Box>
                <Typography variant="h6" gutterBottom>{I18n.t('theme')}</Typography>
                <FormControl sx={{ width: 200 }}>
                    <InputLabel>{I18n.t('theme')}</InputLabel>
                    <Select
                        value={native.theme || 'auto'}
                        label={I18n.t('theme')}
                        onChange={e => update('theme', e.target.value)}
                    >
                        <MenuItem value="auto">{I18n.t('themeAuto')}</MenuItem>
                        <MenuItem value="light">{I18n.t('themeLight')}</MenuItem>
                        <MenuItem value="dark">{I18n.t('themeDark')}</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Divider />

            {/* Manual check */}
            <Box>
                <Typography variant="h6" gutterBottom>{I18n.t('manualCheck')}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {I18n.t('manualCheckHint')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={checking ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                        onClick={() => void handleCheckNow()}
                        disabled={checking}
                        color="primary"
                    >
                        {I18n.t('checkNow')}
                    </Button>
                    {checkResult && (
                        <Typography variant="body2" color="text.secondary">
                            {checkResult}
                        </Typography>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default SettingsPanel;
