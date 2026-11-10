/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#19181B',
    tint: '#E52532',
    background: '#F6F4F4',
    foreground: '#19181B',
    card: '#FFFFFF',
    cardForeground: '#19181B',
    primary: '#D9192B',
    primaryForeground: '#FFFFFF',
    secondary: '#EEE9EA',
    secondaryForeground: '#282327',
    muted: '#EFECEE',
    mutedForeground: '#716C71',
    accent: '#FBE9EA',
    accentForeground: '#9F101D',
    destructive: '#B91C2A',
    destructiveForeground: '#FFFFFF',
    border: '#E4DFE0',
    input: '#E4DFE0',
    success: '#24764C',
    warning: '#A56612',
    surfaceStrong: '#EAE4E5',
  },
  dark: {
    text: '#F6F2F3',
    tint: '#FF4655',
    background: '#111014',
    foreground: '#F6F2F3',
    card: '#1B191E',
    cardForeground: '#F6F2F3',
    primary: '#F02D3A',
    primaryForeground: '#FFFFFF',
    secondary: '#262329',
    secondaryForeground: '#F6F2F3',
    muted: '#262329',
    mutedForeground: '#ADA6AE',
    accent: '#3A1D22',
    accentForeground: '#FF8B94',
    destructive: '#FF6873',
    destructiveForeground: '#21070A',
    border: '#38343B',
    input: '#3C373E',
    success: '#74D19B',
    warning: '#F0BA62',
    surfaceStrong: '#302B32',
  },
  radius: 8,
};

export default colors;
