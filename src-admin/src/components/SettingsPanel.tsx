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
    Slider,
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
        } catch {
            setCheckResult(I18n.t('checkError'));
        } finally {
            setChecking(false);
        }
    };

    const bgOpacity = native.bgOpacity ?? 100;
    const cardOpacity = native.cardOpacity ?? 100;
    const fontSize = native.fontSize ?? 14;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Check interval */}
            <Box>
                <Typography variant="h6" gutterBottom>{I18n.t('checkInterval')}</Typography>
                <FormControl sx={{ width: 200 }}>
                    <InputLabel>{I18n.t('checkIntervalHours')}</InputLabel>
                    <Select
                        value={native.checkInterval ?? 24}
                        label={I18n.t('checkIntervalHours')}
                        onChange={e => update('checkInterval', e.target.value)}
                    >
                        <MenuItem value={3}>3 {I18n.t('hours')}</MenuItem>
                        <MenuItem value={6}>6 {I18n.t('hours')}</MenuItem>
                        <MenuItem value={12}>12 {I18n.t('hours')}</MenuItem>
                        <MenuItem value={24}>24 {I18n.t('hours')}</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Divider />

            {/* Visualisation */}
            <Box>
                <Typography variant="h6" gutterBottom>{I18n.t('visualisation')}</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: 360 }}>
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

                    <Box>
                        <Typography variant="body2" gutterBottom>
                            {I18n.t('bgOpacity')}: {bgOpacity}%
                        </Typography>
                        <Slider
                            value={bgOpacity}
                            min={0} max={100} step={5}
                            onChange={(_, v) => update('bgOpacity', v)}
                            sx={{ width: 300 }}
                            marks={[
                                { value: 0, label: '0%' },
                                { value: 50, label: '50%' },
                                { value: 100, label: '100%' },
                            ]}
                        />
                    </Box>

                    <Box>
                        <Typography variant="body2" gutterBottom>
                            {I18n.t('cardOpacity')}: {cardOpacity}%
                        </Typography>
                        <Slider
                            value={cardOpacity}
                            min={0} max={100} step={5}
                            onChange={(_, v) => update('cardOpacity', v)}
                            sx={{ width: 300 }}
                            marks={[
                                { value: 0, label: '0%' },
                                { value: 50, label: '50%' },
                                { value: 100, label: '100%' },
                            ]}
                        />
                    </Box>

                    <Box>
                        <Typography variant="body2" gutterBottom>
                            {I18n.t('fontSize')}: {fontSize}px
                        </Typography>
                        <Slider
                            value={fontSize}
                            min={10} max={20} step={1}
                            onChange={(_, v) => update('fontSize', v)}
                            sx={{ width: 300 }}
                            marks={[
                                { value: 10, label: '10px' },
                                { value: 14, label: '14px' },
                                { value: 20, label: '20px' },
                            ]}
                        />
                    </Box>
                </Box>
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
