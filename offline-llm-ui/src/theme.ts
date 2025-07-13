// src/theme.ts
import { extendTheme, theme as base } from '@chakra-ui/react'

const theme = extendTheme({
  colors: {
    brand: {
      50:  '#f0f4ff',
      100: '#d9e2ff',
      200: '#b0bfff',
      300: '#708cff',
      400: '#4360ff',
      500: '#1f3eff',
      600: '#0024ff',
      700: '#0019cc',
      800: '#001099',
      900: '#000666',
    },
    // secondary palette (e.g. for buttons, emphasis)
    secondary: {
      50:  '#fdf2f8',
      100: '#fce7f3',
      200: '#f8c1e6',
      300: '#f299d1',
      400: '#ee6bae',
      500: '#e2458e',
      600: '#c52c75',
      700: '#9e205c',
      800: '#771344',
      900: '#51092d',
    },
    // tertiary (for highlight, subtle emphasis)
    tertiary: {
      50:  '#f3f9f7',
      100: '#e0f2ec',
      200: '#b8e3d4',
      300: '#84ccb2',
      400: '#4ead8a',
      500: '#2b8a6e',
      600: '#206a56',
      700: '#184c40',
      800: '#10312b',
      900: '#091a18',
    },
    accent: {
      50:  '#e3f2ff',
      100: '#b3dcff',
      200: '#80c6ff',
      300: '#4babff',
      400: '#1f8fff',
      500: '#006fe6',
      600: '#0057b4',
      700: '#004183',
      800: '#002b52',
      900: '#001722',
    },
    // feedback
    success: base.colors.green,
    error:   base.colors.red,
    warning: base.colors.yellow,
    info:    base.colors.blue,

    // neutrals
    gray: base.colors.gray,
  },

  semanticTokens: {
    colors: {
      'bg.default':    { default: 'brand.900', _dark: 'brand.900' },
      'bg.surface':    { default: 'brand.800', _dark: 'brand.800' },
      'bg.muted':      { default: 'gray.700', _dark: 'gray.700' },

      'text.primary':  { default: 'brand.50',  _dark: 'brand.50'  },
      'text.secondary':{ default: 'gray.300',  _dark: 'gray.300'  },
      'text.muted':    { default: 'gray.500',  _dark: 'gray.500'  },

      'border.default':{ default: 'gray.600',  _dark: 'gray.600'  },

      'button.primary.bg':    { default: 'brand.500',   _dark: 'brand.400'   },
      'button.primary.color': { default: 'white',       _dark: 'white'       },

      'button.secondary.bg':  { default: 'secondary.500', _dark: 'secondary.400' },
      'button.secondary.color':{ default: 'white',      _dark: 'white'       },

      'link.color':            { default: 'accent.400',  _dark: 'accent.300'  },
    },
  },

  fonts: {
    heading: `Inter, ${base.fonts?.heading}`,
    body:    `Inter, ${base.fonts?.body}`,
  },

  styles: {
    global: {
      'html, body': {
        bg: 'bg.default',
        color: 'text.primary',
        lineHeight: 'tall',
        WebkitFontSmoothing: 'antialiased',
      },
      a: {
        color: 'link.color',
        _hover: { textDecoration: 'underline' },
      },
    },
  },
})

export default theme
