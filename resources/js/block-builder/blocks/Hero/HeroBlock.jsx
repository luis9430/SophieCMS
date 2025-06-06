import { Text, Button } from '@mantine/core';
import { convertStylesToCSS, getCustomAttributes } from '../../../utils/styleUtils';

export default function HeroBlock({ config, styles, color }) {
    const cssStyles = convertStylesToCSS(styles);
    const customAttributes = getCustomAttributes(styles);
    const finalStyles = {
        ...cssStyles,                                    
        textAlign: styles?.textAlign || 'center',       
        ...(styles?.customCSS ? { cssText: styles.customCSS } : {})
    };

    return (
        <div 
            style={finalStyles}
            {...customAttributes}  // ID y classes personalizadas
        >
            <Text size="xl" fw={700} mb="xs">
                {config.title}
            </Text>
            <Text c="dimmed" mb="lg">
                {config.subtitle}
            </Text>
            <Button variant="filled" color={color}>
                {config.buttonText}
            </Button>
        </div>
    );
}