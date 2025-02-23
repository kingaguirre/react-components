import theme from '@styles/theme'
import styled from 'styled-components'

export const SettingsPanelContainer = styled.div`
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  animation: fadeIn 0.15s ease-in-out;
  position: absolute;
  right: -1px;
  width: 250px;
  z-index: 20;
  top: 38px;
  max-height: calc(100% - 108px);
  overflow-y: auto;
  border-left: 1px solid ${theme.colors.default.pale};

  .panel-content {
    padding: 0;
  }

  .panel-header {
    position: sticky;
    top: 0;

    .right-header-icons-container .icon-clear {
      transition: ${theme.transition};

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
        transition: all .3s ease;

        &:hover {
          background-color: ${theme.colors.primary.pale};
        }
      }
    }
  }
`