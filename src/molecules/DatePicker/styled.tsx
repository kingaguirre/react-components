// src/atoms/DatePicker/styled.tsx
import styled, { createGlobalStyle } from "styled-components";
import { theme } from "../../styles/theme";
import { scrollStyle } from '../../styles/GlobalStyles';

export const DatePickerContainer = styled.div`
  .react-datepicker-wrapper {
    width: 100%;
  }
`;

export const DatePickerGlobalStyles = createGlobalStyle`
  .react-datepicker__triangle {
    fill: white!important;
    stroke: rgba(0, 0, 0, 0.04)!important;
  }

  .react-datepicker {
    border: none!important;
    box-shadow: 1px 0 0 #e6e6e6, -1px 0 0 #e6e6e6, 0 1px 0 #e6e6e6, 0 -1px 0 #e6e6e6, 0 3px 13px rgba(0, 0, 0, 0.08);
    border-radius: 4px;
    font-size: 14px;
    box-sizing: border-box;
    ${scrollStyle}

    * {
      box-sizing: border-box;
    }

    .react-datepicker__header__dropdown {
      margin-bottom: 6px;
    }

    .react-datepicker__year-dropdown,
    .react-datepicker__month-dropdown,
    .react-datepicker__month-year-dropdown {
      box-shadow: 1px 0 0 #e6e6e6, -1px 0 0 #e6e6e6, 0 1px 0 #e6e6e6, 0 -1px 0 #e6e6e6, 0 3px 13px rgba(0, 0, 0, 0.08);
      background-color: white;
      width: 120px;
      height: 230px;
      overflow: auto;
      border-radius: 2px;
      border: none;
      left: 50%;
      transform: translateX(-50%);
    }

    .react-datepicker__navigation--years-previous,
    .react-datepicker__navigation--years-upcoming {
      position: relative!important;
      display: block;
      top: auto!important;
      text-indent: unset;
      position: relative;

      &:before {
        content: '';
        height: 8px;
        width: 8px;
        top: 8px;
        border-width: 2px 2px 0 0;
        border-color: #ccc;
        border-style: solid;
        position: absolute;
        transform: rotate(-45deg);
      }
    }

    .react-datepicker__navigation--years-previous {
      &:before {
        top: 3px;
        transform: rotate(135deg);
      }
    }

    .react-datepicker__year-option:first-of-type,
    .react-datepicker__month-option:first-of-type,
    .react-datepicker__month-year-option:first-of-type {
      border-top-left-radius: 2px;
      border-top-right-radius: 2px;
    }

    .react-datepicker__year-option:last-of-type,
    .react-datepicker__month-option:last-of-type,
    .react-datepicker__month-year-option:last-of-type {
      border-bottom-left-radius: 2px;
      border-bottom-right-radius: 2px;
    }

    .react-datepicker__year-option,
    .react-datepicker__month-option,
    .react-datepicker__month-year-option {
      font-size: 14px;
      padding: 4px 12px;
      font-weight: 400;
      color: ${theme.colors.default.dark};
      transition: all .3s ease;

      &:not(:last-child) {
        border-bottom: 1px solid ${theme.colors.default.pale};
      }

      .react-datepicker__navigation--years {
        height: 20px;
      }

      &:hover {
        background-color: ${theme.colors.default.pale};
      }

      &.react-datepicker__year-option--selected_year,
      &.react-datepicker__month-option--selected_month {
        color: ${theme.colors.primary.dark};
      }
    }

    .react-datepicker__year-option--selected,
    .react-datepicker__month-option--selected,
    .react-datepicker__month-year-option--selected {
      right: 12px;
      left: auto;
    }
  
    .react-datepicker__navigation-icon::before,
    .react-datepicker__year-read-view--down-arrow,
    .react-datepicker__month-read-view--down-arrow,
    .react-datepicker__month-year-read-view--down-arrow {
      border-width: 2px 2px 0 0;
    }

    .react-datepicker__navigation {
      top: 8px;
      > span:before {
        transition: all .3s ease;
      }
    }

    .react-datepicker__header {
      background: transparent;
      border: none;
      font-weight: bold;
      font-size: 18px;
      color: rgba(0, 0, 0, 0.7);
      padding-top: 12px;
      transition: all .3s ease;

      .react-datepicker__year-dropdown-container,
      .react-datepicker__month-dropdown-container {
        transition: all .3s ease;
        position: relative;

        .react-datepicker__year-read-view,
        .react-datepicker__month-read-view {
          visibility: visible!important;
        }

        .react-datepicker__year-read-view--down-arrow,
        .react-datepicker__month-read-view--down-arrow {
          transition: all .3s ease;
          height: 8px;
          width: 8px;
          top: 7px;
        }
        
        &:hover {
          color: ${theme.colors.primary.dark};
          .react-datepicker__year-read-view--down-arrow,
          .react-datepicker__month-read-view--down-arrow {
            border-color: ${theme.colors.primary.dark};
          }
        }
      }

    }

    .react-datepicker__current-month {
      display: none;
    }

    .react-datepicker__day-names {
      .react-datepicker__day-name {
        font-size: 12px;
        font-weight: bold;
        color: rgba(0, 0, 0, 0.5);
        width: 40px;
        margin: 1px;
      }
    }

    .react-datepicker__month {
      margin: 0;
      .react-datepicker__week {
        .react-datepicker__day {
          width: 40px;
          height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all .15s ease;
          color: #393939;
          margin: 1px;
  
          &.react-datepicker__day--today {
            background-color: white;
            border: 1px solid ${theme.colors.default.base};
            &:hover {
              background-color: ${theme.colors.default.pale};
            }
          }
  
          &.react-datepicker__day--selected {
            background-color: ${theme.colors.primary.pale};
            border-color: ${theme.colors.primary.base};
            &:hover {
              background-color: ${theme.colors.primary.base};
              color: white;
            }
          }

          &.react-datepicker__day--in-selecting-range,
          &.react-datepicker__day--in-range {
            background-color: ${theme.colors.primary.pale};
            border-radius: 0;

            &.react-datepicker__day--today {
              border-color: ${theme.colors.primary.base};
              &:hover {
                background-color: ${theme.colors.primary.base};
                color: white;
              }
            }

            &.react-datepicker__day--selecting-range-start,
            &.react-datepicker__day--selecting-range-end,
            &.react-datepicker__day--range-end,
            &.react-datepicker__day--range-start {
              background-color: ${theme.colors.primary.base};
              color: white;
            }

            &.react-datepicker__day--selecting-range-end,
            &.react-datepicker__day--range-end {
              border-top-right-radius: 50%;
              border-bottom-right-radius: 50%;
            }

            &.react-datepicker__day--selecting-range-start,
            &.react-datepicker__day--range-start {
              border-top-left-radius: 50%;
              border-bottom-left-radius: 50%;
            }
          }

          &.react-datepicker__day--disabled {
            opacity: 0.3;
          }
        }
      }
    }
  }
`;

export const CustomInputWrapper = styled.div<{ $value?: string }>`
  position: relative;
  box-sizing: border-box;
  * {
    box-sizing: border-box;
  }

  .form-control-text {
    padding-right: ${({ $value }) => $value ? 60 : 30}px; /* Ensures space for icons */
  }

  .form-control-input-container.invalid + .icon-container > .calendar-icon {
    border-left: 1px solid ${theme.colors.danger.lighter}!important;
    color: ${theme.colors.danger.light}!important;
    &:hover {
      color: ${theme.colors.danger.base}!important;
    }
  }

  .form-control-input-container.disabled + .icon-container {
    pointer-events: none;
    > span, .icon {
      pointer-events: none;
    }
  }
`;
