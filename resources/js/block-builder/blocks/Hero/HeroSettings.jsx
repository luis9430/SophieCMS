import { Stack, TextInput, Textarea } from '@mantine/core';

export default function HeroSettings({ config, updateConfig }) {
    return (
        <Stack gap="sm">
            <TextInput
                label="Título Principal"
                placeholder="Escribe el título..."
                value={config.title || ''}
                onChange={(e) => updateConfig('title', e.target.value)}
            />
            <Textarea
                label="Subtítulo"
                placeholder="Describe tu propuesta de valor..."
                rows={3}
                value={config.subtitle || ''}
                onChange={(e) => updateConfig('subtitle', e.target.value)}
            />
            <TextInput
                label="Texto del Botón"
                placeholder="Texto del botón..."
                value={config.buttonText || ''}
                onChange={(e) => updateConfig('buttonText', e.target.value)}
            />
            <TextInput
                label="URL del Botón"
                placeholder="https://ejemplo.com"
                value={config.buttonUrl || ''}
                onChange={(e) => updateConfig('buttonUrl', e.target.value)}
            />
        </Stack>
    );
}