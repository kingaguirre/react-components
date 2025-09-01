import React from "react";
import {
  MainHeadercontainer,
  SearhContainer,
  RightDetailsContainer,
  IconContainer,
} from "./styled";
import { DebouncedInput } from "../ColumnHeader/Filter";
import { Button as FooterButton } from "../Footer/styled";
import { Icon } from "../../../../atoms/Icon";
import { Tooltip } from "../../../../atoms/Tooltip";
import { Button } from "../../../../atoms/Button";
import { DataTableProps } from "../../interface";
import { HeaderRightElementRenderer } from "./HeaderRightElementRenderer";
import { RightIconButton } from "./RightIconButton";
import type { Table } from "@tanstack/react-table";

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
  onSettingsIconClick?: () => void;
  isSettingsPanelOpen?: boolean;
  handleDeleteIconClick?: () => void;
  showDeleteIcon?: boolean;
  handleResetColumnSettings?: () => void;
  headerRightControls?: boolean;
  headerRightElements?: DataTableProps["headerRightElements"];
  bulkRestoreMode?: boolean;
  enableRowSelection?: boolean;

  /** —— NEW: for Upload/Download controls —— */
  table?: Table<any>;
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
  downloadSelectedCount?: number;
  downloadAllCount?: number;
  getAOAForSelected?: (opts?: { includeHidden?: boolean }) => any[][];
  getAOAForAll?: (opts?: { includeHidden?: boolean }) => any[][];
  getRowsForSelected?: (opts?: { includeHidden?: boolean }) => any[];
  getRowsForAll?: (opts?: { includeHidden?: boolean }) => any[];
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
  enableRowSelection,
  getVisibleNonBuiltInColumns,
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
          {enableUpload && getVisibleNonBuiltInColumns && (
            <UploadIconButton
              controls={uploadControls}
              getVisibleNonBuiltInColumns={getVisibleNonBuiltInColumns}
              disabled={isAddBtnDisabled || isSettingsPanelOpen}
            />
          )}

          {enableDownload && getAOAForSelected && getAOAForAll && (
            <DownloadIconDropdown
              controls={downloadControls}
              selectedCount={downloadSelectedCount ?? 0}
              allCount={downloadAllCount ?? 0}
              getAOAForSelected={getAOAForSelected}
              getAOAForAll={getAOAForAll}
              disabled={isAddBtnDisabled || isSettingsPanelOpen}
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
              disabled={isAddBtnDisabled || isSettingsPanelOpen}
            />
          )}

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
