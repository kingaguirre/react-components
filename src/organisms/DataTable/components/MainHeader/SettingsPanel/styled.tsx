import { theme, fadeInOnMount } from '../../../../../styles'
import styled from 'styled-components'

export const SettingsPanelContainer = styled.div<{ $hasTitle?: boolean }>`
  position: absolute;
  right: -1px;
  width: 250px;
  z-index: 20;
  top: ${({ $hasTitle }) => $hasTitle ? 65 : 38}px;
  max-height: calc(100% - ${({ $hasTitle }) => $hasTitle ? 132 : 105}px);
  height: 100%;
  min-height: 115px;
  overflow-y: auto;
  border-left: 1px solid ${theme.colors.default.pale};
  ${fadeInOnMount}

  .panel {
    height: 100%;
  }

  .panel-content {
    padding: 0;
  }

  .panel-header {
    position: sticky;
    top: 0;

    .right-header-icons-container .clear-icon {
      &:hover {
        color: ${theme.colors.danger.base};
      }
    }
  }
`

export const SettingsContainer = styled.div`
  .form-control-input-container {
    .form-control-wrapper {
      > label {
        width: 100%;
        padding: 8px 12px;
        border-bottom: 1px solid ${theme.colors.default.pale};

        &:hover {
          background-color: ${theme.colors.primary.pale};
        }
      }
    }
  }
`