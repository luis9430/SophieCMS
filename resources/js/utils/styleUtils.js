// utils/styleUtils.js
export function convertStylesToCSS(styles) {
    if (!styles) return {};

    const cssStyles = {};

    // Layout & Spacing
    if (styles.padding) {
        const paddingMap = { xs: '8px', sm: '16px', md: '24px', lg: '32px', xl: '40px' };
        cssStyles.padding = paddingMap[styles.padding] || styles.padding;
    }
    if (styles.margin) {
        const marginMap = { xs: '8px', sm: '16px', md: '24px', lg: '32px', xl: '40px' };
        cssStyles.margin = marginMap[styles.margin] || styles.margin;
    }
    if (styles.textAlign) cssStyles.textAlign = styles.textAlign;
    if (styles.maxWidth) cssStyles.maxWidth = styles.maxWidth;
    if (styles.minHeight) cssStyles.minHeight = styles.minHeight;

    // Background
    if (styles.backgroundColor) cssStyles.backgroundColor = styles.backgroundColor;
    if (styles.backgroundImage) cssStyles.backgroundImage = `url(${styles.backgroundImage})`;
    if (styles.backgroundSize) cssStyles.backgroundSize = styles.backgroundSize;
    if (styles.backgroundPosition) cssStyles.backgroundPosition = styles.backgroundPosition;

    // Border & Effects
    if (styles.borderRadius) cssStyles.borderRadius = `${styles.borderRadius}px`;
    if (styles.borderWidth) cssStyles.borderWidth = `${styles.borderWidth}px`;
    if (styles.borderColor) cssStyles.borderColor = styles.borderColor;
    if (styles.borderStyle) cssStyles.borderStyle = styles.borderStyle;
    
    // Box Shadow presets
    if (styles.boxShadow && styles.boxShadow !== 'none') {
        const shadowMap = {
            sm: '0 1px 3px rgba(0,0,0,0.12)',
            md: '0 4px 6px rgba(0,0,0,0.1)',
            lg: '0 10px 15px rgba(0,0,0,0.1)',
            xl: '0 20px 25px rgba(0,0,0,0.15)'
        };
        cssStyles.boxShadow = shadowMap[styles.boxShadow] || styles.boxShadow;
    }

    // Visibility & Layers
    if (styles.opacity !== undefined) cssStyles.opacity = styles.opacity / 100;
    if (styles.overflow) cssStyles.overflow = styles.overflow;
    if (styles.zIndex) cssStyles.zIndex = styles.zIndex;

    return cssStyles;
}

export function getCustomAttributes(styles) {
    const attributes = {};
    
    if (styles?.customId) attributes.id = styles.customId;
    if (styles?.customClasses) attributes.className = styles.customClasses;
    
    return attributes;
}