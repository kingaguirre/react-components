// src/atoms/FormControl/styled.tsx
import styled, { css } from 'styled-components';
import { FormControlProps, IconRight } from './interface';
import { theme } from '../../styles/theme';
import { ColorType, SizeType } from '../../common/interface';

export const FormControInputContainer = styled.div`
  box-sizing: border-box;
  position: relative;
  display: block;
  font-family: ${theme.fontFamily};
  line-height: 1.4;
  max-width: 100%;

  &.textarea {
    width: 100%;
  }

  * {
    box-sizing: border-box;
  }
`;

export const FormControlWrapper = styled.div<{
  $type?: string;
  $size: keyof typeof theme.sizes.boxSize;
  $iconRight?: IconRight;
  $simple?: boolean;
}>`
  position: relative;
  display: flex;
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type="number"] {
    -moz-appearance: textfield;
  }

  ${({ $type, $size, $iconRight, $simple }) => {
    if (
      $type === 'checkbox' ||
      $type === 'radio' ||
      $type === 'switch' ||
      $type === 'checkbox-group' ||
      $type === 'radio-group' ||
      $type === 'switch-group'
    ) {
      return !$simple ? `
        border-bottom: 1px solid ${theme.colors.default.pale};
        padding: 4px 0;
        min-height: ${theme.sizes.boxSize[$size]}px;
      ` : '';
    } else {
      const iconCount = Array.isArray($iconRight) ? $iconRight.length : 0;
      let paddingRight = '';

      if (iconCount === 1) {
        paddingRight = `> *:not(.wrapper-icon):not(svg) { padding-right: ${$size === 'sm' ? 22 : 32}px!important; }`;
      } else if (iconCount > 1) {
        paddingRight = `> *:not(.wrapper-icon):not(svg) { padding-right: ${$size === 'sm' ? 44 : 60}px!important; }`;
      }

      return `
        &.invalid {
          .wrapper-icon > .container-icon {
            color: ${theme.colors.danger.base};
            &:hover {
              color: ${theme.colors.danger.light};
            }
          }
        }
        ${paddingRight}
      `;
    }
  }}

  > svg {
    position: absolute;
    right: 8px;
    top: 8px;
    pointer-events: none;
    background-color: white;
    border-radius: 50%;
  }
`;

export const Label = styled.span<{
  size?: FormControlProps['size'];  // Reuse the type for size
}>`
  display: block;
  position: relative;
  margin-bottom: 8px;
  line-height: 1;
  text-align: left;
  font-size: ${({ size }) => `${theme.sizes.label[size ?? 'md']}px`};
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
  color?:FormControlProps['color'];
  size?: keyof typeof theme.sizes.boxSize;
  $variant?: 'outlined';
}>`
  display: block;
  width: 100%;
  padding: 8px;
  font-size: ${({ size = 'md' }) => `${theme.sizes.fontSize[size]}px`};
  font-family: ${theme.fontFamily};
  border-radius: 2px;
  background-color: white;
  border: none;
  transition: all 0.3s ease;
  color: ${theme.colors.default.darker};
  text-overflow: ellipsis;
  box-sizing: border-box;
  * { box-sizing: border-box; }

  box-shadow: ${({ $variant: variant, color = 'primary' }) =>
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
    box-shadow: ${({ color = 'primary' }) => `
      inset 0 1px 0 ${theme.colors[color].light}, 
      inset -1px 0 0 ${theme.colors[color].light}, 
      inset 0 -1px 0 ${theme.colors[color].light}, 
      inset 1px 0 0 ${theme.colors[color].light}
    `}
  }

  &:focus:not(:disabled) {
    outline: none;
    box-shadow: ${({ color = 'primary' }) => `
      inset 0 1px 0 ${theme.colors[color].light}, 
      inset -1px 0 0 ${theme.colors[color].light}, 
      inset 0 -1px 0 ${theme.colors[color].light}, 
      inset 1px 0 0 ${theme.colors[color].light},
      0 0 0 4px ${theme.colors[color].lighter}
    `}
  }

  &:read-only {
    background-color: white;
    color: ${theme.colors.default.darker};
    cursor: default;
  }

  &:disabled {
    background-color: ${theme.colors.default.lighter};
    cursor: not-allowed;
    color: ${theme.colors.default.darker};
    box-shadow: ${({ $variant: variant, color = 'primary' }) =>
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

  &.invalid,
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
      `};
    }

    &:focus:not(:disabled) {
      outline: none;
      box-shadow: ${`
        inset 0 1px 0 ${theme.colors.danger.light}, 
        inset -1px 0 0 ${theme.colors.danger.light}, 
        inset 0 -1px 0 ${theme.colors.danger.light}, 
        inset 1px 0 0 ${theme.colors.danger.light},
        0 0 0 4px ${theme.colors.danger.pale}
      `};
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

  ${({ $variant, color = 'primary' }) => $variant === 'outlined' ? `
    background-color: ${theme.colors[color].pale};
    &:focus:not(:disabled) {
      background-color: white;
    }
  ` : ''}
`;

export const Input = styled.input<{
  color?: FormControlProps['color'];
  size?: keyof typeof theme.sizes.boxSize;
  $variant?: 'outlined';
}>`
  ${sharedInputStyles};
  height: ${({ size = 'md' }) => `${theme.sizes.boxSize[size]}px`};

  &::placeholder {
    color: ${theme.colors.default.base};
  }
`;

export const TextArea = styled.textarea<{
  color?: FormControlProps['color'];
  size?: keyof typeof theme.sizes.boxSize;
  $variant?: 'outlined';
}>`
  ${sharedInputStyles};
  resize: vertical;
  min-height: 80px; /* Default height for TextArea */
  max-width: 100%;
  &::placeholder {
    color: ${theme.colors.default.base};
  }
`;

const getCustomCheckboxRadio = ({
  type,
  color,
  size,
  _theme,
}: {
  type?: string;
  color: ColorType;
  size?: SizeType;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  _theme: any;
}) => {
  if (type === 'radio' && (size === 'xs' || size === 'sm')) {
    return css`
      width: 6px;
      height: 6px;
      top: 2px;
      left: 2px;
      border: none;
      border-radius: 50%;
      background-color: ${_theme.colors[color].base};
    `;
  } else if (type === 'radio') {
    return css`
      width: 8px;
      height: 8px;
      top: 3px;
      left: 3px;
      border: none;
      border-radius: 50%;
      background-color: ${_theme.colors[color].base};
    `;
  } else if (size === 'xs' || size === 'sm') {
    return css`
      width: 4px;
      height: 8px;
      top: 0;
      left: 3px;
      border: solid white;
      border-width: 0 2px 2px 0;
      position: absolute;
    `;
  } else {
    return css`
      width: 6px;
      height: 12px;
      top: -1px;
      left: 4px;
      border: solid white;
      border-width: 0 2px 2px 0;
      position: absolute;
    `;
  }
};

export const CustomCheckboxRadio = styled.input<{
  color?: ColorType;
  size?: SizeType;
}>`
  appearance: none;
  min-width: ${({ size }) => (size === 'xs' || size === 'sm' ? 12 : 16)}px;
  min-height: ${({ size }) => (size === 'xs' || size === 'sm' ? 12 : 16)}px;
  background-color: white;
  border: 1px solid ${({ color = 'primary' }) => theme.colors[color].light};
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
    transform: scale(0);
    ${({ type, color = 'primary', size }) => getCustomCheckboxRadio({ type, color, size, _theme: theme })}
  }

  &:focus:not(:disabled) {
    outline: none;
    box-shadow: ${({ color = 'primary' }) => `0 0 0 4px ${theme.colors[color].pale}, 0 0 1px 5px ${theme.colors[color].lighter}`};
  }

  ${({ type, color = 'primary' }) => (type === 'radio' ? css`
    &:focus:not(:checked):not(:disabled),
    &:hover:not(:checked):not(:disabled) {
      &:before {
        opacity: 0.4;
        border-color: ${theme.colors[color].base};
        transform: scale(1);
      }
    }
  ` : css`
    &:focus:not(:checked):not(:disabled):not(:indeterminate),
    &:hover:not(:checked):not(:disabled):not(:indeterminate) {
      &:before {
        opacity: 0.4;
        border-color: ${theme.colors[color].base};
        transform: scale(1) rotate(45deg);
      }
    }
  `)};

  &:disabled:checked,
  &:disabled {
    cursor: not-allowed;
    border-color: ${({ color = 'primary' }) => theme.colors[color].lighter};
    background-color: ${theme.colors.default.lighter};
    &:before {
      border-color: ${({ color = 'primary' }) => theme.colors[color].light};
    }
  }

  &:checked {
    border-color: ${({ color = 'primary' }) => theme.colors[color].base};
    ${({ type, color = 'primary' }) => (type === 'radio' ? `` : `
      background-color: ${theme.colors[color].base};
    `)};

    &:before {
      transform: scale(1) rotate(45deg);
    }
  }

  ${({ type, color = 'primary' }) => (type === 'checkbox' ? `
    &:indeterminate {
      background-color: ${theme.colors[color].base};
      transition: all 0s ease;
      &:before {
        transform-origin: bottom center;
        transform: scale(1) translate(-50%, -50%);
        border: none;
        height: 2px;
        width: 8px;
        background-color: white;
        top: 50%;
        left: 50%;
        transition: all 0s ease;
      }
    }
  ` : ``)};

  &.invalid,
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

    &:focus:not(:disabled) {
      outline: none;
      box-shadow: ${`0 0 0 4px ${theme.colors.danger.pale}, 0 0 1px 5px ${theme.colors.danger.lighter}`};
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
  background-color: ${({ color = 'primary' }) => theme.colors[color].pale};
  border-color: ${({ color = 'primary' }) => theme.colors[color].pale};
  position: relative;
  box-shadow: 0 0 1px 0px rgba(0, 0, 0, 0.5);

  &:before {
    content: '';
    min-width: ${({ size }) => (size === 'xs' || size === 'sm' ? 12 : 16)}px;
    min-height: ${({ size }) => (size === 'xs' || size === 'sm' ? 12 : 16)}px;
    border-radius: 50%;
    border: 1px solid ${({ color = 'primary' }) => theme.colors[color].light};
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
      box-shadow: ${({ color = 'primary' }) => `0 0 0 4px ${theme.colors[color].pale}, 0 0 1px 5px ${theme.colors[color].lighter}`};
    }
  }

  &:focus:not(:disabled) {
    box-shadow: 0 0 1px 0px rgba(0, 0, 0, 0.5);
    &:before {
      box-shadow: ${({ color = 'primary' }) => `0 0 0 4px ${theme.colors[color].pale}, 0 0 1px 5px ${theme.colors[color].lighter}`};
    }
  }

  &:disabled {
    &:before {
      border: 1px solid ${({ color = 'primary' }) => theme.colors[color].lighter};
    }
    &:checked {
      background-color: ${theme.colors.default.lighter};
      &:before {
        border-color: white;
        background-color: ${({ color = 'primary' }) => theme.colors[color].light};
      }
    }
  }

  &:checked {
    background-color: ${({ color = 'primary' }) => theme.colors[color].pale};
    border-color: ${({ color = 'primary' }) => theme.colors[color].pale};
    &:before {
      transform: translateX(100%);
      background-color: ${({ color = 'primary' }) => theme.colors[color].base};
      border-color: white;
    }
  }

  &.invalid,
  &:invalid {
    background-color: ${theme.colors.danger.pale};
    border-color: ${theme.colors.danger.pale};

    &:before {
      border: 1px solid ${theme.colors.danger.light};
    }

    &:hover:not(:disabled) {
      &:before {
        opacity: 1!important;
        box-shadow: ${`0 0 0 4px ${theme.colors.danger.pale}, 0 0 1px 5px ${theme.colors.danger.lighter}`};
      }
    }

    &:focus:not(:disabled) {
      box-shadow: none;
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

export const RadioButtonContainer = styled.label<{
  disabled?: boolean;
}>`
  display: block;
  flex: 1;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  .button {
    pointer-events: none;
    padding-left: 12px;
    padding-right: 12px;
  }
`;

export const RadioButton = styled(CustomCheckboxRadio)`
  display: none;
`;

export const TextContainer = styled.label<{
  disabled?: boolean;
}>`
  display: inline-flex;
  align-items: flex-start;
  justify-content: flex-start;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  > span {
    margin-left: 8px;
  }
`;

export const Text = styled.span<{
  size?: FormControlProps["size"];
  disabled?: boolean;
}>`
  font-size: ${({ size = 'md' }) => `${theme.sizes.fontSize[size]}px`};
  font-family: ${theme.fontFamily};
  color: ${({ disabled }) => `${theme.colors.default[disabled ? 'base' : 'dark']}`};
  line-height: 1.2;
  pointer-events: none;
  text-align: left;
`;

export const HelpText = styled.span<{ color: FormControlProps['color'] }>`
  text-align: left;
  display: block;
  padding: 4px 0;
  font-size: 12px;
  color: ${({ color = 'primary' }) => theme.colors[color].base};
  white-space: break-spaces;
`;

export const GroupControlContainer = styled.div<{
  $isVerticalOptions?: boolean;
  $gap?: number;
}>`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: ${({ $gap = 12 }) => $gap}px;
  ${({ $isVerticalOptions }) => $isVerticalOptions ? 'flex-direction: column;' : ''}
`;

export const IconWrapper = styled.div<{
  $size: keyof typeof theme.sizes.boxSize;
  $color: FormControlProps['color'];
  $disabled?: boolean;
}>`
  display: flex;
  align-items: center;
  position: absolute;
  right: 0;
  top: 0;
  height: ${({ $size }) => theme.sizes.boxSize[$size]}px;
  padding: 6px;
  ${({ $disabled }) => $disabled ? `
    pointer-events: none;
    * {
      pointer-events: none;
    }
  ` : ''}
`;

export const IconContainer = styled.span<{
  $size: keyof typeof theme.sizes.boxSize;
  $color: FormControlProps['color'];
  $hoverColor: FormControlProps['color'];
  $disabled?: boolean;
}>`
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $color = 'primary' }) => theme.colors[$color].base};
  cursor: pointer;
  height: ${({ $size }) => theme.sizes.boxSize[$size] - 16}px;
  width: ${({ $size }) => theme.sizes.boxSize[$size] - 6}px;

  &:last-child {
    border-left: 1px solid ${({ $color = 'primary' }) => theme.colors[$color].lighter};
    padding-left: 4px;
  }

  &:hover {
    color: ${({ $hoverColor = 'primary' }) => theme.colors[$hoverColor].light};
  }

  ${({ $disabled }) => $disabled ? `
    pointer-events: none;
    cursor: not-allowed;
    color: ${theme.colors.default.base};
    * {
      pointer-events: none;
    }
  ` : ''}
`;

export const NoOptionsContainer = styled.div`
  font-size: 12px;
  width: 100%;
  color: ${theme.colors.default.base};
  font-style: italic;
  pointer-events: none;
`;