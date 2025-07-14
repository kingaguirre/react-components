import styled from 'styled-components';
import { theme } from '../../styles/theme';

export const FormWrapper = styled.form`
  position: relative;
  .fields-wrapper + .main-header {
    /* margin-top: 12px; */
  }

  .grid-item + .sub-header {
    margin-top: 12px;
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
  padding-bottom: 24px;
`;

export const Description = styled.p`
  margin: 8px 12px 16px;
  font-size: 14px;
  color: ${theme.colors.default.dark};
`;