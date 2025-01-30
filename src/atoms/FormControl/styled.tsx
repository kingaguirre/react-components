import styled, { css } from 'styled-components';
import { FormControlProps } from './interface';
import { theme } from '../../styles/theme';

export const InputContainer = styled.div`
  box-sizing: border-box;
  position: relative;
  display: block;
  font-family: ${theme.fontFamily};
  line-height: 1.4;
  * {
    box-sizing: border-box;
  }
`;
export const InputWrapper = styled.div<{
  $type?: string;
  $size: keyof typeof theme.sizes.inputBoxSize;
}>`
  position: relative;
  ${({ $type, $size }) => ($type === 'checkbox' || $type === 'radio') ? `
    border-bottom: 1px solid ${theme.colors.default.pale};
    padding: 4px 0;
    min-height: ${theme.sizes.inputBoxSize[$size]}px;
  ` : ''}
`;

export const Label = styled.label<{
  color: FormControlProps['color']; // Reuse the type for color
  size: FormControlProps['size'];  // Reuse the type for size
}>`
  display: block;
  position: relative;
  margin-bottom: 8px;
  line-height: 1;
  font-size: ${({ size }) => `${theme.sizes.label[size || 'md']}px`};
  font-family: ${theme.fontFamily};
  color: ${theme.colors.default.dark};
  > span {
    font-weight: bold;
    color: ${theme.colors.danger.base};
    display: inline-block;
    margin-right: 4px;
  }
`;


/**
 * Shared styles for Input and TextArea
 */
const sharedInputStyles = css<{
  color: keyof typeof theme.colors;
  size: keyof typeof theme.sizes.inputBoxSize;
  $variant?: 'outlined';
}>`
  display: block;
  width: 100%;
  padding: 8px;
  font-size: ${({ size }) => `${theme.sizes.inputFontSize[size]}px`};
  font-family: ${theme.fontFamily};
  border-radius: 2px;
  background-color: white;
  border: none;
  transition: all 0.3s ease;
  color: ${theme.colors.default.darker};
  box-sizing: border-box;
  * {
    box-sizing: border-box;
  }
  box-shadow: ${({ $variant: variant, color }) =>
    variant === 'outlined'
      ? `inset 0 1px 0 ${theme.colors[color].base}, 
        inset -1px 0 0 ${theme.colors[color].base}, 
        inset 0 -1px 0 ${theme.colors[color].base}, 
        inset 1px 0 0 ${theme.colors[color].base}`
      : `inset 0 1px 0 ${theme.colors[color].pale}, 
         inset -1px 0 0 ${theme.colors[color].pale}, 
         inset 0 -1px 0 ${theme.colors[color].base}, 
         inset 1px 0 0 ${theme.colors[color].pale}`};

  &:hover:not(:disabled) {
    box-shadow: ${({ color }) => `
      inset 0 1px 0 ${theme.colors[color].light}, 
      inset -1px 0 0 ${theme.colors[color].light}, 
      inset 0 -1px 0 ${theme.colors[color].light}, 
      inset 1px 0 0 ${theme.colors[color].light}
    `}
  }

  &:focus:not(:disabled) {
    outline: none;
    box-shadow: ${({ color }) => `
      inset 0 1px 0 ${theme.colors[color].light}, 
      inset -1px 0 0 ${theme.colors[color].light}, 
      inset 0 -1px 0 ${theme.colors[color].light}, 
      inset 1px 0 0 ${theme.colors[color].light},
      0 0 0 4px ${theme.colors[color].pale}
    `}
  }

  &:disabled {
    background-color: ${theme.colors.default.lighter};
    cursor: not-allowed;
    color: ${theme.colors.default.darker};
    box-shadow: ${({ $variant: variant, color }) =>
    variant === 'outlined'
      ? `inset 0 1px 0 ${theme.colors[color].lighter}, 
        inset -1px 0 0 ${theme.colors[color].lighter}, 
        inset 0 -1px 0 ${theme.colors[color].lighter}, 
        inset 1px 0 0 ${theme.colors[color].lighter}`
      : `inset 0 1px 0 ${theme.colors[color].pale}, 
         inset -1px 0 0 ${theme.colors[color].pale}, 
         inset 0 -1px 0 ${theme.colors[color].light}, 
         inset 1px 0 0 ${theme.colors[color].pale}`};
  }

  &:read-only {
    background-color: ${theme.colors.default.lighter};
    color: ${theme.colors.default.darker};
  }

  &.is-invalid,
  &:invalid {
    box-shadow: ${({ $variant: variant }) =>
    variant === 'outlined'
      ? `inset 0 1px 0 ${theme.colors.danger.base}, 
        inset -1px 0 0 ${theme.colors.danger.base}, 
        inset 0 -1px 0 ${theme.colors.danger.base}, 
        inset 1px 0 0 ${theme.colors.danger.base}`
      : `inset 0 1px 0 ${theme.colors.danger.pale}, 
         inset -1px 0 0 ${theme.colors.danger.pale}, 
         inset 0 -1px 0 ${theme.colors.danger.base}, 
         inset 1px 0 0 ${theme.colors.danger.pale}`};

    &:hover:not(:disabled) {
    box-shadow: ${`
      inset 0 1px 0 ${theme.colors.danger.light}, 
      inset -1px 0 0 ${theme.colors.danger.light}, 
      inset 0 -1px 0 ${theme.colors.danger.light}, 
      inset 1px 0 0 ${theme.colors.danger.light}
    `}
  }

  &:focus:not(:disabled) {
    outline: none;
    box-shadow: ${`
      inset 0 1px 0 ${theme.colors.danger.light}, 
      inset -1px 0 0 ${theme.colors.danger.light}, 
      inset 0 -1px 0 ${theme.colors.danger.light}, 
      inset 1px 0 0 ${theme.colors.danger.light},
      0 0 0 4px ${theme.colors.danger.pale}
    `}
  }

  &:disabled {
    background-color: ${theme.colors.default.lighter};
    cursor: not-allowed;
    color: ${theme.colors.default.darker};
    box-shadow: ${({ $variant: variant }) =>
    variant === 'outlined'
      ? `inset 0 1px 0 ${theme.colors.danger.lighter}, 
        inset -1px 0 0 ${theme.colors.danger.lighter}, 
        inset 0 -1px 0 ${theme.colors.danger.lighter}, 
        inset 1px 0 0 ${theme.colors.danger.lighter}`
      : `inset 0 1px 0 ${theme.colors.danger.pale}, 
          inset -1px 0 0 ${theme.colors.danger.pale}, 
          inset 0 -1px 0 ${theme.colors.danger.light}, 
          inset 1px 0 0 ${theme.colors.danger.pale}`};
  }
  }

  &:placeholder {
    color: ${theme.colors.default.base};
  }
`;

export const Input = styled.input<{
  color: keyof typeof theme.colors;
  size: keyof typeof theme.sizes.inputBoxSize;
  $variant?: 'outlined';
}>`
  ${sharedInputStyles};
  height: ${({ size }) => `${theme.sizes.inputBoxSize[size]}px`};
`;

export const TextArea = styled.textarea<{
  color: keyof typeof theme.colors;
  size: keyof typeof theme.sizes.inputBoxSize;
  $variant?: 'outlined';
}>`
  ${sharedInputStyles};
  resize: vertical;
  min-height: 80px; /* Default height for TextArea */
`;

export const CustomCheckboxRadio = styled.input<{
  color: keyof typeof theme.colors;
  size: FormControlProps['size'];
}>`
  appearance: none;
  min-width: ${({ size }) => (size === 'xs' || size === 'sm' ? 12 : 16)}px;
  min-height: ${({ size }) => (size === 'xs' || size === 'sm' ? 12 : 16)}px;
  background-color: white;
  border: 1px solid ${({ color }) => theme.colors[color].light};
  border-radius: ${({ type }) => (type === 'radio' ? '50%' : '0')};
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  margin: 0;

  &:before {
    box-sizing: border-box;
    content: '';
    display: block;
    transition: all 0.3s ease;
    pointer-events: none;
    position: relative;
    transform: scale(0) rotate(45deg);
    ${({ type, color }) => (type === 'radio' ? `
      width: 8px;
      height: 8px;
      border: none;
      top: 3px;
      left: 3px;
      border-radius: 50%;
      background-color: ${theme.colors[color].base};
    ` : `
      width: 6px;
      height: 12px;
      border: solid white;
      border-width: 0 2px 2px 0;
      position: absolute;
      top: -1px;
      left: 4px;
    `)};
  }

  &:focus:not(:disabled) {
    outline: none;
    box-shadow: ${({ color }) => `0 0 0 4px ${theme.colors[color].pale}, 0 0 1px 5px ${theme.colors[color].lighter}`};
  }

  &:hover:not(:checked):not(:disabled) {
    &:before {
      opacity: 0.4;
      border-color: ${({ color }) => theme.colors[color].base};
      transform: scale(1) rotate(45deg);
    }
  }

  &:disabled:checked,
  &:disabled {
    cursor: not-allowed;
    border-color: ${({ color }) => theme.colors[color].lighter};
    background-color: ${theme.colors.default.lighter};
    &:before {
      border-color: ${({ color }) => theme.colors[color].light};
    }
  }

  &:checked {
    border-color: ${({ color }) => theme.colors[color].base};
    ${({ type, color }) => (type === 'radio' ? `` : `
      background-color: ${theme.colors[color].base};
    `)};

    &:before {
      transform: scale(1) rotate(45deg);
    }
  }

  &.is-invalid,
  &:invalid {
    border-color: ${theme.colors.danger.base};
    &:hover:not(:checked):not(:disabled) {
      &:before {
        opacity: 0.4;
        border-color: ${theme.colors.danger.base};
        transform: scale(1) rotate(45deg);
        ${({ type }) => (type === 'radio' ? `
          background-color: ${theme.colors.danger.base};
        ` : ``)};
      }
    }

    &:disabled {
      cursor: not-allowed;
      border-color: ${theme.colors.danger.lighter};
      background-color: ${theme.colors.default.lighter};
      &:before {
        border-color: ${theme.colors.danger.light};
      }
    }
  }
`;

export const Switch = styled(CustomCheckboxRadio)`
  min-width: ${({ size }) => (size === 'xs' || size === 'sm' ? 24 : 32)}px;
  min-height: ${({ size }) => (size === 'xs' || size === 'sm' ? 12 : 16)}px;
  border-radius: 16px;
  background-color: ${({ color }) => theme.colors[color].pale};
  border-color: ${({ color }) => theme.colors[color].pale};
  position: relative;

  &:before {
    content: '';
    min-width: ${({ size }) => (size === 'xs' || size === 'sm' ? 12 : 16)}px;
    min-height: ${({ size }) => (size === 'xs' || size === 'sm' ? 12 : 16)}px;
    border-radius: 50%;
    border: 1px solid ${({ color }) => theme.colors[color].light};
    background: white;
    position: absolute;
    top: -1px;
    left: -1px;
    transition: all 0.3s ease;
    transform: translateX(0);
  }

  &:hover:not(:disabled) {
    &:before {
      opacity: 1!important;
      box-shadow: ${({ color }) => `0 0 0 2px ${theme.colors[color].pale}, 0 0 1px 3px ${theme.colors[color].lighter}`};
    }
  }

  &:focus:not(:disabled) {
    box-shadow: none;
    &:before {
      box-shadow: ${({ color }) => `0 0 0 4px ${theme.colors[color].pale}, 0 0 1px 5px ${theme.colors[color].lighter}`};
    }
  }

  &:disabled {
    &:before {
      border: 1px solid ${({ color }) => theme.colors[color].lighter};
    }
    &:checked {
      background-color: ${theme.colors.default.lighter};
      &:before {
        border-color: white;
        background-color: ${({ color }) => theme.colors[color].light};
      }
    }
  }

  &:checked {
    background-color: ${({ color }) => theme.colors[color].pale};
    border-color: ${({ color }) => theme.colors[color].pale};
    &:before {
      transform: translateX(100%);
      background-color: ${({ color }) => theme.colors[color].base};
      border-color: white;
    }
  }

  &.is-invalid,
  &:invalid {
    background-color: ${theme.colors.danger.pale};
    border-color: ${theme.colors.danger.pale};

    &:before {
      border: 1px solid ${theme.colors.danger.light};
    }

    &:hover:not(:disabled) {
      &:before {
        opacity: 1!important;
        box-shadow: ${`0 0 0 2px ${theme.colors.danger.pale}, 0 0 1px 3px ${theme.colors.danger.lighter}`};
      }
    }

    &:focus:not(:disabled) {
      &:before {
        box-shadow: ${`0 0 0 4px ${theme.colors.danger.pale}, 0 0 1px 5px ${theme.colors.danger.lighter}`};
      }
    }

    &:disabled {
      &:before {
        border: 1px solid ${theme.colors.danger.lighter};
      }
      &:checked {
        background-color: ${theme.colors.default.lighter};
        &:before {
          border-color: white;
          background-color: ${theme.colors.danger.light};
        }
      }
    }
  }

`;

export const TextContainer = styled.label<{
  disabled?: boolean;
}>`
  display: inline-flex;
  align-items: flex-start;
  justify-content: flex-start;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  span {
    margin-left: 8px;
  }
`;

export const Text = styled.span<{
  size: keyof typeof theme.sizes.inputFontSize;
  disabled?: boolean;
}>`
  font-size: ${({ size }) => `${theme.sizes.inputFontSize[size]}px`};
  font-family: ${theme.fontFamily};
  color: ${({ disabled }) => `${theme.colors.default[disabled ? 'base' : 'dark']}`};
  line-height: 1.2;
  pointer-events: none;
`;

export const HelpText = styled.span<{ color: keyof typeof theme.colors }>`
  display: block;
  padding: 4px 0;
  font-size: 12px;
  color: ${({ color }) => theme.colors[color].base};
`;