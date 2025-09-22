import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';

export const FormWrapper = styled.form<{ $stickyHeader?: boolean }>`
  position: relative;
  margin-bottom: 24px;

  .button-wrapper,
  .fields-wrapper + * {
    margin-top: 24px;
  }

  .panel {
    .panel-content {
      padding-top: 0;
      padding-bottom: 0;
    }
    .panel-header {
      margin-bottom: 12px;
    }
    &.no-header {
      .panel-content {
        padding-left: 0;
        padding-right: 0;
      }
    }
  }

  .panel:not(:last-child),
  > div
  .data-table-wrapper-section > div:not(:last-child) {
    margin-bottom: 24px;
  }

  .accordion-body .header {
    top: initial;
  }

  ${({ $stickyHeader }) => !!$stickyHeader ? css`
    .panel {
      &.is-sub-header .panel-header,
      .panel-header {
        position: sticky;
        top: 0;
        z-index: 1000;
        border-radius: 2px;
      }

      &.is-sub-header .panel-header {
        z-index: 999;
      }
    }
  ` : ''}

`;

export const Description = styled.p`
  margin: 8px 12px 16px;
  font-size: 14px;
  color: ${theme.colors.default.dark};
`;

export const SectionWrapper = styled.div<{ $hasHeader?: boolean }>`
`;

export const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  > button {
    width: 75px;
  }
`;
