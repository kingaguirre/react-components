import React from "react";
import {
  MainHeadercontainer,
  SearhContainer,
  RightDetailsContainer,
  IconContainer,
  RightIconButtonContainer,
} from "./styled";
import { DebouncedInput } from "../ColumnHeader/Filter";
import { Button as FooterButton } from "../Footer/styled";
import { Icon } from "../../../../atoms/Icon";
import { Tooltip } from "../../../../atoms/Tooltip";
import { Button } from "../../../../atoms/Button";
import { DataTableProps } from "../../interface";
import { HeaderRightElementRenderer } from "./HeaderRightElementRenderer";

interface MainHeaderProps {
  value?: string;
  enableGlobalFiltering?: boolean;
  onChange: (value: string | number) => void;
  onClear?: () => void;
  isClearDisabled?: boolean;
  isAddBtnDisabled?: boolean;
  enableRowAdding?: boolean;
  onClearAllIconClick?: () => void;
  onAddBtnClick?: () => void;
  onSettingsIconClick?: () => void;
  isSettingsPanelOpen?: boolean;
  handleDeleteIconClick?: () => void;
  showDeleteIcon?: boolean;
  handleResetColumnSettings?: () => void;
  headerRightControls?: boolean;
  headerRightElements?: DataTableProps["headerRightElements"];
  bulkRestoreMode?: boolean;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  value,
  enableGlobalFiltering,
  onChange,
  onClear,
  isClearDisabled,
  isAddBtnDisabled,
  enableRowAdding,
  onClearAllIconClick,
  onAddBtnClick,
  onSettingsIconClick,
  isSettingsPanelOpen,
  handleDeleteIconClick,
  showDeleteIcon,
  handleResetColumnSettings,
  headerRightControls,
  headerRightElements,
  bulkRestoreMode = false,
}) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  return enableGlobalFiltering ||
    enableRowAdding ||
    showDeleteIcon ||
    headerRightControls ||
    (headerRightElements && headerRightElements.length > 0) ? (
    <MainHeadercontainer className="main-header-container">
      {enableGlobalFiltering && (
        <SearhContainer className="search-container">
          <DebouncedInput
            name="main-header-search-input"
            value={value ?? ""}
            onChange={onChange}
            placeholder="Search all columns..."
            ref={inputRef}
            iconRight={[
              ...(value
                ? [
                    {
                      icon: "clear",
                      color: "default",
                      hoverColor: "danger",
                      onClick: onClear,
                      title: "Clear Global Filter",
                    },
                  ]
                : []),
              {
                icon: "search",
                onClick: () => inputRef?.current?.focus(),
              },
            ]}
            clearable={false}
          />
          <Tooltip
            content={!isClearDisabled ? "Clear All Filters" : undefined}
            placement="right"
          >
            <FooterButton
              $outlined
              onClick={onClearAllIconClick}
              disabled={isClearDisabled}
            >
              <Icon icon="clear" />
            </FooterButton>
          </Tooltip>
        </SearhContainer>
      )}

      <RightDetailsContainer className="right-details-container">
        <HeaderRightElementRenderer elements={headerRightElements} />

        {enableRowAdding && (
          <Button
            data-testid="add-row-button"
            size="sm"
            disabled={isAddBtnDisabled || isSettingsPanelOpen}
            {...(!isAddBtnDisabled ? { onClick: onAddBtnClick } : {})}
          >
            Add New <Icon icon="add_circle_outline" />
          </Button>
        )}
        <IconContainer className="container-icon">
          {showDeleteIcon && (
            <RightIconButton
              testId="bulk-delete-button"
              icon={bulkRestoreMode ? "rotate_left" : "delete_forever"}
              title={
                bulkRestoreMode
                  ? "Restore Selected Rows"
                  : "Delete Selected Rows"
              }
              onClick={handleDeleteIconClick}
              className={bulkRestoreMode ? "restore-icon" : "delete-icon"}
              disabled={isAddBtnDisabled || isSettingsPanelOpen}
            />
          )}
          {/* <RightIconButton
            icon='file_upload'
            title='Upload Excel'
            onClick={() => {}}
          />
          <RightIconButton
            icon='file_download'
            title='Download to Excel'
            onClick={() => {}}
          /> */}
          {headerRightControls && (
            <>
              <RightIconButton
                icon="settings"
                title="Settings"
                onClick={onSettingsIconClick}
                isAction={isSettingsPanelOpen}
                disabled={isAddBtnDisabled}
              />
              <RightIconButton
                icon="replay"
                title="Reset to default"
                onClick={handleResetColumnSettings}
                disabled={isAddBtnDisabled}
              />
            </>
          )}
        </IconContainer>
      </RightDetailsContainer>
    </MainHeadercontainer>
  ) : null;
};

const RightIconButton = ({
  onClick,
  title,
  icon,
  className,
  isAction,
  disabled,
  testId,
}: {
  onClick?: () => void;
  title?: string;
  icon: string;
  className?: string;
  isAction?: boolean;
  disabled?: boolean;
  testId?: string;
}) => (
  <Tooltip content={title} type="title">
    <RightIconButtonContainer
      {...(!disabled ? { onClick } : {})}
      className={`${className ?? ""} ${isAction ? "active" : ""} ${disabled ? "disabled" : ""}`}
      data-testid={testId}
    >
      <Icon icon={icon} />
    </RightIconButtonContainer>
  </Tooltip>
);
