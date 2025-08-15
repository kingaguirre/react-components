import styled from 'styled-components';
import { theme } from '../../styles/theme';

export const FormWrapper = styled.form`
  position: relative;
  margin-bottom: 24px;

  .data-table-wrapper-section > div,
  > div {
    &:not(.header) {
      margin-bottom: 24px;
    }
  }

  .accordion-body .header {
    top: initial;
  }
`;

// sticky blue header
export const PageHeader = styled.div`
  position: sticky;
  top: 0;
  background: ${theme.colors.primary.dark};
  color: white;
  padding: 8px 16px;
  font-size: 1.25rem;
  z-index: 1000;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  line-height: 1.4;
  margin-bottom: 12px;
  white-space: nowrap;
  overflow: hidden;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

// grey sub-header bar
export const SubHeader = styled(PageHeader)`
  background: ${theme.colors.lightA};
  color: ${theme.colors.primary.dark};
  position: sticky;
  z-index: 999;
  top: 28px;
`;

// sticky tabs container under header
export const TabsWrapper = styled.div`
  background: white;
  z-index: 900;
`;

export const FieldsWrapper = styled.div<{ $hasHeader?: boolean }>`
  ${({ $hasHeader }) => $hasHeader ? 'padding: 0 12px;' : ''}
  &:not(:last-child) {
    margin-bottom: 24px;
  }
`;

export const Description = styled.p`
  margin: 8px 12px 16px;
  font-size: 14px;
  color: ${theme.colors.default.dark};
`;

export const SectionWrapper = styled.div<{ $hasHeader?: boolean }>`
  padding: 0 ${({ $hasHeader }) => $hasHeader ? 12 : 0}px 0;

  .button-wrapper,
  .data-table-wrapper-section + * {
    margin-top: 24px;
  }
`

export const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  > button {
    width: 75px;
  }
`