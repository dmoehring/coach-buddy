import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Aura with a green primary colour and slightly roomier form fields, so inputs
 * and buttons are easy to hit with a thumb on a phone.
 */
export const CoachBuddyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{emerald.50}',
      100: '{emerald.100}',
      200: '{emerald.200}',
      300: '{emerald.300}',
      400: '{emerald.400}',
      500: '{emerald.500}',
      600: '{emerald.600}',
      700: '{emerald.700}',
      800: '{emerald.800}',
      900: '{emerald.900}',
      950: '{emerald.950}'
    },
    formField: {
      paddingX: '0.85rem',
      paddingY: '0.65rem',
      borderRadius: '0.75rem'
    },
    colorScheme: {
      light: {
        primary: {
          color: '{emerald.600}',
          contrastColor: '#ffffff',
          hoverColor: '{emerald.700}',
          activeColor: '{emerald.800}'
        },
        highlight: {
          background: '{emerald.50}',
          focusBackground: '{emerald.100}',
          color: '{emerald.800}',
          focusColor: '{emerald.900}'
        }
      },
      dark: {
        primary: {
          color: '{emerald.400}',
          contrastColor: '{surface.950}',
          hoverColor: '{emerald.300}',
          activeColor: '{emerald.200}'
        },
        highlight: {
          background: 'color-mix(in srgb, {emerald.400}, transparent 84%)',
          focusBackground: 'color-mix(in srgb, {emerald.400}, transparent 76%)',
          color: 'rgba(255,255,255,.87)',
          focusColor: 'rgba(255,255,255,.87)'
        }
      }
    }
  }
});
