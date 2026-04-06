import React from 'react';
import {
    Box,
    Divider,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Slider,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import { I18n } from '@iobroker/adapter-react-v5';
import { PwnedCheckConfig } from '../types';

interface Props {
    native: PwnedCheckConfig;
    onChange: (newNative: PwnedCheckConfig) => void;
}

const SettingsPanel: React.FC<Props> = ({ native, onChange }) => {
    const update = (field: keyof PwnedCheckConfig, value: any): void => {
        onChange({ ...native, [field]: value });
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
                            value={native.theme || 'light'}
                            label={I18n.t('theme')}
                            onChange={e => update('theme', e.target.value)}
                        >
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

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2">{I18n.t('cardColor')}</Typography>
                        <input
                            type="color"
                            value={native.cardColor || '#ffffff'}
                            onChange={e => update('cardColor', e.target.value)}
                            style={{ width: 48, height: 32, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                        />
                        {native.cardColor && (
                            <TextField
                                size="small"
                                value={native.cardColor}
                                onChange={e => update('cardColor', e.target.value)}
                                sx={{ width: 100 }}
                            />
                        )}
                    </Box>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={native.compactView ?? false}
                                onChange={e => update('compactView', e.target.checked)}
                            />
                        }
                        label={I18n.t('compactView')}
                    />
                </Box>
            </Box>

        </Box>
    );
};

export default SettingsPanel;
