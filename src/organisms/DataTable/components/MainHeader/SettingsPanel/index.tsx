import React from "react";
import { flexRender } from "@tanstack/react-table";
import { SettingsPanelContainer, SettingsContainer } from "./styled";
import { Panel } from "../../../../../molecules/Panel";
import { FormControl } from "../../../../../atoms/FormControl";
import { CUSTOM_COLUMN } from "../../../utils/columnSettings";
import { useOnClickOutside } from "../../../hooks/useOnClickOutside";

export const SettingsPanel = ({
  table,
  show,
  hasTitle,
  onClose,
  setDefaultColumnVisibility,
}: {
  table: any;
  show: boolean;
  hasTitle: boolean;
  onClose?: () => void;
  setDefaultColumnVisibility?: () => void;
}) => {
  const settingPanelRef = React.useRef<HTMLDivElement>(null);

  useOnClickOutside(settingPanelRef, () => onClose?.());

  return show ? (
    <SettingsPanelContainer
      ref={settingPanelRef}
      className="settings-panel-container"
      $hasTitle={hasTitle}
    >
      <Panel
        title="Visible Columns"
        rightIcons={[
          {
            icon: "clear",
            onClick: onClose,
          },
        ]}
        leftIcon={{
          icon: "replay",
          onClick: setDefaultColumnVisibility,
          tooltip: "Reset",
          tooltipType: "title",
        }}
      >
        <SettingsContainer>
          <FormControl
            type="checkbox"
            text="Toggle All"
            checked={table.getIsAllColumnsVisible()}
            onChange={table.getToggleAllColumnsVisibilityHandler()}
            simple
          />
          {table
            .getAllLeafColumns()
            .filter((i: any) => !CUSTOM_COLUMN.includes(i.id))
            .map((column: any) => {
              const header = column.columnDef.header;
              const headerContext = { column, table };

              return (
                <FormControl
                  key={column.id}
                  type="checkbox"
                  text={flexRender(header, headerContext)}
                  checked={column.getIsVisible()}
                  onChange={column.getToggleVisibilityHandler()}
                  simple
                />
              );
            })}
        </SettingsContainer>
      </Panel>
    </SettingsPanelContainer>
  ) : null;
};
