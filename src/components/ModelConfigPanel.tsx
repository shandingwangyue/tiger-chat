// src/components/ModelConfigPanel.tsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip,
  Stack
} from '@mui/material';

interface ModelConfigPanelProps {
  onConfigChange: (config: ModelConfig) => void;
  initialConfig?: ModelConfig;
}

export interface ModelConfig {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
}

const presets = [
  { name: 'Creative', temp: 1.2, tokens: 512 },
  { name: 'Balanced', temp: 0.7, tokens: 256 },
  { name: 'Precise', temp: 0.3, tokens: 128 }
];

const ModelConfigPanel: React.FC<ModelConfigPanelProps> = ({ 
  onConfigChange, 
  initialConfig = {
    temperature: 0.7,
    maxTokens: 256,
    topP: 0.9,
    frequencyPenalty: 0
  }
}) => {
  const [config, setConfig] = useState<ModelConfig>(initialConfig);

  const handleChange = (key: keyof ModelConfig, value: number) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const applyPreset = (preset: typeof presets[0]) => {
    const newConfig = {
      ...config,
      temperature: preset.temp,
      maxTokens: preset.tokens
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Model Configuration
      </Typography>
      
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {presets.map(preset => (
          <Chip
            key={preset.name}
            label={preset.name}
            onClick={() => applyPreset(preset)}
            variant={config.temperature === preset.temp ? 'filled' : 'outlined'}
            color="primary"
          />
        ))}
      </Stack>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ mb: 3 }}>
        <Typography gutterBottom>
          Temperature: {config.temperature.toFixed(1)}
        </Typography>
        <Slider
          value={config.temperature}
          onChange={(_, value) => handleChange('temperature', value as number)}
          min={0}
          max={2}
          step={0.1}
          marks={[
            { value: 0, label: '0' },
            { value: 1, label: '1' },
            { value: 2, label: '2' }
          ]}
        />
        <Typography variant="caption" color="text.secondary">
          Controls randomness: lower = more deterministic
        </Typography>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography gutterBottom>
          Max Tokens: {config.maxTokens}
        </Typography>
        <Slider
          value={config.maxTokens}
          onChange={(_, value) => handleChange('maxTokens', value as number)}
          min={64}
          max={2048}
          step={64}
        />
      </Box>
      
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Top-P Sampling</InputLabel>
        <Select
          value={config.topP}
          onChange={(e) => handleChange('topP', e.target.value as number)}
          label="Top-P Sampling"
        >
          <MenuItem value={0.5}>0.5 (Conservative)</MenuItem>
          <MenuItem value={0.9}>0.9 (Default)</MenuItem>
          <MenuItem value={1.0}>1.0 (Diverse)</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default ModelConfigPanel;