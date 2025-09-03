import styled from 'styled-components';
import { theme } from '../../styles/theme';

export const FormWrapper = styled.form`
  position: relative;
  margin-bottom: 24px;

  .button-wrapper,
  .fields-wrapper + * {
    margin-top: 24px;
  }

  .panel .panel-content {
    padding-top: 0;
    padding-bottom: 0;
  }

  .panel .panel-header {
    margin-bottom: 12px;
  }

  .panel:not(:last-child),
  > div
  .data-table-wrapper-section > div:not(:last-child) {
    margin-bottom: 24px;
  }

  .accordion-body .header {
    top: initial;
  }
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
