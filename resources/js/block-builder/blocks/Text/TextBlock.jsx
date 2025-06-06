import { Text } from '@mantine/core';

export default function TextBlock({ config, styles }) {
    return (
        <Text
            style={{
                lineHeight: 1.6,
                textAlign: styles?.textAlign || 'left'
            }}
        >
            {config.content}
        </Text>
    );
}