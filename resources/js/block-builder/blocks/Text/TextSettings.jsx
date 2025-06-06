import { Textarea } from '@mantine/core';

export default function TextSettings({ config, updateConfig }) {
    return (
        <Textarea
            label="Contenido"
            placeholder="Escribe tu contenido aquí..."
            rows={6}
            value={config.content || ''}
            onChange={(e) => updateConfig('content', e.target.value)}
        />
    );
}