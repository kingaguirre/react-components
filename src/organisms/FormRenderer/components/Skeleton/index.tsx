// src/organisms/FormRenderer/components/Skeleton.tsx
import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Grid, GridItem } from '../../../../atoms/Grid';
import {
  Description,
  SectionWrapper,
} from '../../styled';
import type {
  SettingsItem,
  FieldGroup,
  FieldSetting,
  AccordionSection,
  DataTableSection,
} from '../../interface';
import VirtualizedItem from '../VirtualizedItem';
import { Tabs } from '../../../../organisms/Tabs';
import { Accordion } from '../../../../molecules/Accordion';
import { Panel } from '../../../../molecules/Panel';

// shimmer animation
const shimmer = keyframes`
  0%   { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`;

// placeholder for a field’s label
const SkeletonLabel = styled.div`
  width: 40%;
  height: 12px;
  margin-bottom: 8px;
  background: #eee;
  background-image: linear-gradient(
    to right,
    #eee 25%,
    #f5f5f5 50%,
    #eee 75%
  );
  background-size: 200px 100%;
  animation: ${shimmer} 1.2s ease-in-out infinite;
  border-radius: 1px;
`;

// placeholder for the field itself: 32px or 80px for textarea
const SkeletonField = styled.div<{ type?: string }>`
  width: 100%;
  height: ${p => (p.type === 'textarea' ? '80px' : '32px')};
  background: #eee;
  background-image: linear-gradient(
    to right,
    #eee 25%,
    #f5f5f5 50%,
    #eee 75%
  );
  background-size: 200px 100%;
  animation: ${shimmer} 1.2s ease-in-out infinite;
  border-radius: 2px;
`;

// placeholder for the entire data-table area
const SkeletonTable = styled.div<{ height: number }>`
  width: 100%;
  height: ${p => p.height}px;
  background: #eee;
  background-image: linear-gradient(
    to right,
    #eee 25%,
    #f5f5f5 50%,
    #eee 75%
  );
  background-size: 200px 100%;
  animation: ${shimmer} 1.2s ease-in-out infinite;
  border-radius: 2px;
`;

const SkeletonActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  margin-bottom: 24px;
`;

const SkeletonButton = styled.div`
  width: 75px;
  height: 24px;
  background: #eee;
  background-image: linear-gradient(
    to right,
    #eee 25%,
    #f5f5f5 50%,
    #eee 75%
  );
  background-size: 200px 100%;
  animation: ${shimmer} 1.2s ease-in-out infinite;
  border-radius: 2px;
`;

// default number of skeleton rows for tables
const BASE_TABLE_HEIGHT = 106; // base padding/header height
const ROW_HEIGHT = 30;
const DEFAULT_TABLE_ROWS = 5;

// utility to grab nested data by dot-path
function getDataByPath(path: string, obj: any): any {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

// type guards
const isFieldGroup = (item: SettingsItem): item is FieldGroup =>
  ('fields' in item && Array.isArray(item.fields)) ||
  ('tabs' in item && Array.isArray(item.tabs)) ||
  ('accordion' in item && Array.isArray(item.accordion));
const hasAccordion = (
  item: SettingsItem
): item is FieldGroup & { accordion: AccordionSection[] } =>
  isFieldGroup(item) && Array.isArray(item.accordion) && item.accordion.length > 0;
const hasTabs = (item: SettingsItem): item is FieldGroup =>
  isFieldGroup(item) && Array.isArray(item.tabs) && item.tabs.length > 0;
const hasFields = (item: SettingsItem): item is FieldGroup =>
  isFieldGroup(item) && Array.isArray(item.fields) && item.fields.length > 0;
const hasDataTable = (item: SettingsItem): item is { dataTable: DataTableSection } =>
  Boolean((item as any).dataTable);

/**
 * Walk the SettingsItem tree and render skeleton UI,
 * matching your real form’s layout—including DataTableSections.
 */
export function renderSkeletonSection(
  items: SettingsItem[],
  values: Record<string, any>
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let standalone: FieldSetting[] = [];
  let flushCount = 0;

  // render a plain fields grid
  const renderFields = (fields: FieldSetting[]) => (
    <SectionWrapper className='fields-wrapper'>
      <Grid>
        {fields?.map((fs, i) => {
          const key = fs.name ?? fs.label ?? `skeleton-${i}`;
          return (
            <GridItem
              key={key}
              xs={fs.col?.xs ?? 12}
              sm={fs.col?.sm ?? 6}
              md={fs.col?.md ?? 4}
              lg={fs.col?.lg ?? 3}
            >
              <VirtualizedItem>
                <SkeletonLabel />
                <SkeletonField type={fs.type} />
              </VirtualizedItem>
            </GridItem>
          );
        })}
      </Grid>
    </SectionWrapper>
  );

  // render a DataTable placeholder area with dynamic height
  const renderDataTable = (table: DataTableSection, idx: number) => {
    // calculate hide for the table itself
    const hideTable = (table as any).hidden;
    const isHiddenTable = typeof hideTable === 'function'
      ? hideTable(values)
      : hideTable === true;
    if (isHiddenTable) return null;

    // calculate height based on row count
    const array = getDataByPath(table.config.dataSource, values);
    const rawLength = Array.isArray(array) ? array.length : DEFAULT_TABLE_ROWS;
    const dataLength = Math.min(rawLength, DEFAULT_TABLE_ROWS);
    const skeletonHeight = BASE_TABLE_HEIGHT + dataLength * ROW_HEIGHT + 1;

    return (
      <React.Fragment key={`skel-dt-${idx}`}>
        <Panel title={table.header} isSubHeader={table.isSubHeader} hideShadow>
          {table.description && <Description>{table.description}</Description>}
          <SectionWrapper className="data-table-wrapper" $hasHeader={!!table.header}>
            <SkeletonTable height={skeletonHeight} />
            <SkeletonActions>
              <SkeletonButton />
              <SkeletonButton />
              <SkeletonButton />
              <SkeletonButton />
            </SkeletonActions>
            {/* placeholder fields below the table skeleton */}
            {renderSkeletonSection(table.fields as any, values)}
          </SectionWrapper>
        </Panel>
      </React.Fragment>
    );
  };

  const flush = () => {
    if (!standalone.length) return;
    nodes.push(
      <React.Fragment key={`skel-flush-${flushCount++}`}>
        {renderFields(standalone)}
      </React.Fragment>
    );
    standalone = [];
  };

  items.forEach((item, idx) => {
    // skip hidden items
    const hide = (item as any).hidden;
    const isHidden = typeof hide === 'function' ? hide(values) : hide === true;
    if (isHidden) {
      flush();
      return;
    }

    // DataTableSection?
    if (hasDataTable(item)) {
      flush();
      nodes.push(renderDataTable((item as any).dataTable, idx));
      return;
    }

    // Accordion group
    if (hasAccordion(item)) {
      flush();
      const group = item as FieldGroup & { accordion: AccordionSection[] };
      const panels = group.accordion.filter(sec => {
        const h = sec.hidden;
        return typeof h === 'function' ? !h(values) : h !== true;
      });
      if (!panels.length) return;

      nodes.push(
        <React.Fragment key={`skel-acc-${idx}`}>
          <Panel title={group.header} isSubHeader={group.isSubHeader} hideShadow>
            {group.description && <Description>{group.description}</Description>}
            <SectionWrapper className="accordion-wrapper" $hasHeader={!!group.header}>
              <Accordion
                allowMultiple={group.allowMultiple}
                items={panels.map((sec, i) => ({
                  id: sec.id ?? `skel-acc-${idx}-${i}`,
                  title: sec.title,
                  open: sec.open,
                  children: renderSkeletonSection(sec.fields, values),
                }))}
              />
            </SectionWrapper>
          </Panel>
        </React.Fragment>
      );
      return;
    }

    // Tabs group
    if (hasTabs(item)) {
      flush();
      const group = item as FieldGroup;
      const tabs = group.tabs!.filter(tab => {
        const h = tab.hidden;
        return typeof h === 'function' ? !h(values) : h !== true;
      });
      if (!tabs.length) return;

      nodes.push(
        <React.Fragment key={`skel-tabs-${idx}`}>
          <Panel title={group.header} isSubHeader={group.isSubHeader} hideShadow>
            {group.description && <Description>{group.description}</Description>}
            <SectionWrapper className='tabs-wrapper'>
              <Tabs
                key={`skel-tabs-${idx}`}
                tabs={tabs.map((tab) => ({
                  title: tab.title,
                  content: renderSkeletonSection(tab.fields, values),
                }))}
              />
            </SectionWrapper>
          </Panel>
        </React.Fragment>
      );
      return;
    }

    // Nested FieldGroup
    if (hasFields(item)) {
      flush();
      const group = item as FieldGroup;
      nodes.push(
        <React.Fragment key={`skel-hdr-${idx}`}>
          <Panel title={group.header} isSubHeader={group.isSubHeader} hideShadow>
            {group.description && <Description>{group.description}</Description>}
            <SectionWrapper $hasHeader={!!group.header}>
              {renderSkeletonSection(group.fields!, values)}
            </SectionWrapper>
          </Panel>
        </React.Fragment>
      );
      return;
    }

    // otherwise collect as standalone FieldSetting
    standalone.push(item as FieldSetting);
  });

  flush();
  return nodes;
}

export default renderSkeletonSection;
