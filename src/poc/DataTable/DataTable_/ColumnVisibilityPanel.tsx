import React from 'react';
import styled from 'styled-components';
import { ColumnSetting } from './index';

interface ColumnVisibilityPanelProps {
  columnSettings: ColumnSetting[];
  columnVisibility: Record<string, boolean>;
  onVisibilityChange: (visibility: Record<string, boolean>) => void;
}

const PanelWrapper = styled.div`
  display: inline-block;
  margin-left: 16px;
  border: 1px solid #ccc;
  padding: 8px;
`;

export const ColumnVisibilityPanel: React.FC<ColumnVisibilityPanelProps> = ({
  columnSettings,
  columnVisibility,
  onVisibilityChange,
}) => {
  const toggleColumn = (accessor: string) => {
    onVisibilityChange({
      ...columnVisibility,
      [accessor]: !columnVisibility[accessor],
    });
  };

  return (
    <PanelWrapper>
      <strong>Columns</strong>
      <div>
        {columnSettings.map((col, ci) => (
          <div key={`${col.column}-${ci}`}>
            <label>
              <input
                type="checkbox"
                checked={columnVisibility[col.accessor] !== false}
                onChange={() => toggleColumn(col.accessor)}
              />
              {col.title}
            </label>
          </div>
        ))}
      </div>
    </PanelWrapper>
  );
};
