import React from "react";
import {
  MainHeadercontainer,
  SearhContainer,
  RightDetailsContainer,
  IconContainer,
  LeftDetailsContainer
} from "./styled";
import { DebouncedInput } from "../ColumnHeader/Filter";
import { Button as FooterButton } from "../Footer/styled";
import { Icon } from "../../../../atoms/Icon";
import { Tooltip } from "../../../../atoms/Tooltip";
import { Button } from "../../../../atoms/Button";
import { DataTableProps } from "../../interface";
import { HeaderElementRenderer } from "./HeaderElementRenderer";
import { RightIconButton } from "./RightIconButton";

import { DownloadIconDropdown } from "./DownloadIconDropdown";
import { UploadIconButton } from "./UploadIconButton";
import type { DownloadControls } from "./DownloadIconDropdown";
import type { UploadControls } from "./UploadIconButton";

type BuiltInIds = Set<string> | string[] | Record<string, boolean> | undefined;
type ExportFormat = "xlsx" | "csv";

export interface MainHeaderProps {
  value?: string;
  enableGlobalFiltering?: boolean;
  onChange: (value: string | number) => void;
  onClear?: () => void;
  isClearDisabled?: boolean;
  isAddBtnDisabled?: boolean;
  enableRowAdding?: boolean;
  onClearAllIconClick?: () => void;
  onAddBtnClick?: () => void;
  onSettingsIconClick?: (e: any) => void;
  isSettingsPanelOpen?: boolean;
  handleDeleteIconClick?: () => void;
  showDeleteIcon?: boolean;
  handleResetColumnSettings?: () => void;
  headerRightControls?: boolean;
  headerRightElements?: DataTableProps["headerRightElements"];
  headerLeftElements?: DataTableProps["headerRightElements"];
  bulkRestoreMode?: boolean;
  enableRowSelection?: boolean;
  hideClearAllFiltersButton?: boolean;
  addNewButtonText?: string;

  disabled?: boolean;
  builtInColumnIds?: BuiltInIds;
  /** filename base without extension */
  exportFileBaseName?: string;
  /** xlsx | csv */
  exportFormat?: ExportFormat;
  /** prepend parsed rows to your table data (required for Upload) */
  onImportPrepend?: (rows: Array<Record<string, any>>) => void;
  /** signal busy to parent so you can disable wrapper */
  onImportBusyChange?: (busy: boolean) => void;
  /** optional toast hook (uses your existing showToast shape) */
  onToast?: (cfg: {
    color: "success" | "info" | "warning" | "danger" | "default";
    title: string;
    message: React.ReactNode;
    icon?: string;
  }) => void;
  /** optional: real full-dataset export in server mode */
  fetchAllRows?: () => Promise<any[]>;

  enableDownload?: boolean;
  enableUpload?: boolean;
  downloadControls?: DownloadControls;
  uploadControls?: UploadControls;
  getVisibleNonBuiltInColumns?: () => Array<{ id: string; headerText: string }>;
  getAllNonBuiltInColumns?: () => Array<{ id: string; headerText: string }>;
  downloadSelectedCount?: number;
  downloadAllCount?: number;
  getAOAForSelected?: (opts?: { includeHidden?: boolean }) => any[][];
  getAOAForAll?: (opts?: { includeHidden?: boolean }) => any[][];
  getRowsForSelected?: (opts?: { includeHidden?: boolean }) => any[];
  getRowsForAll?: (opts?: { includeHidden?: boolean }) => any[];
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  disabled,
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
  headerLeftElements,
  bulkRestoreMode = false,
  enableRowSelection,
  hideClearAllFiltersButton,
  getVisibleNonBuiltInColumns,
  getAllNonBuiltInColumns,
  downloadSelectedCount = 0,
  downloadAllCount = 0,
  getAOAForSelected,
  getAOAForAll,
  uploadControls,
  downloadControls,
  enableDownload = false,
  enableUpload = false,
  getRowsForSelected,
  getRowsForAll,
  addNewButtonText,
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
            testId="global-filter-input"
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
            disabled={disabled}
          />
          {!hideClearAllFiltersButton && (
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
          )}
        </SearhContainer>
      )}

      {/* ——— Left elements right after the Search container ——— */}
      {headerLeftElements && headerLeftElements.length > 0 && (
        <LeftDetailsContainer className="left-details-container">
          <HeaderElementRenderer elements={headerLeftElements} />
        </LeftDetailsContainer>
      )}

      <RightDetailsContainer className="right-details-container">
        <HeaderElementRenderer elements={headerRightElements} />

        {enableRowAdding && (
          <Button
            data-testid="add-row-button"
            size="sm"
            disabled={isAddBtnDisabled || isSettingsPanelOpen || disabled}
            {...(!isAddBtnDisabled ? { onClick: onAddBtnClick } : {})}
          >
            {addNewButtonText} <Icon icon="add_circle_outline" />
          </Button>
        )}

        <IconContainer className="container-icon">
          {enableUpload && getVisibleNonBuiltInColumns && (
            <UploadIconButton
              controls={uploadControls}
              getVisibleNonBuiltInColumns={getVisibleNonBuiltInColumns}
              getAllNonBuiltInColumns={getAllNonBuiltInColumns}
              disabled={isAddBtnDisabled || isSettingsPanelOpen || disabled}
            />
          )}

          {enableDownload && getAOAForSelected && getAOAForAll && (
            <DownloadIconDropdown
              controls={downloadControls}
              selectedCount={downloadSelectedCount ?? 0}
              allCount={downloadAllCount ?? 0}
              getAOAForSelected={getAOAForSelected}
              getAOAForAll={getAOAForAll}
              disabled={isAddBtnDisabled || isSettingsPanelOpen || disabled}
              enableRowSelection={enableRowSelection}
              getRowsForSelected={getRowsForSelected}
              getRowsForAll={getRowsForAll}
            />
          )}

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
              disabled={isAddBtnDisabled || isSettingsPanelOpen || disabled}
            />
          )}

          {headerRightControls && (
            <>
              <RightIconButton
                icon="settings"
                title="Settings"
                onClick={onSettingsIconClick}
                isAction={isSettingsPanelOpen}
                disabled={isAddBtnDisabled || disabled}
              />
              <RightIconButton
                icon="replay"
                title="Reset to default"
                onClick={handleResetColumnSettings}
                disabled={isAddBtnDisabled || disabled}
              />
            </>
          )}
        </IconContainer>
      </RightDetailsContainer>
    </MainHeadercontainer>
  ) : null;
};
