import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Grid, GridItem } from '../../../../atoms/Grid';
import { FieldsWrapper, SubHeader, PageHeader, Description } from '../../styled';
import type { SettingsItem, FieldGroup, FieldSetting } from '../../interface';
import VirtualizedItem from '../VirtualizedItem';

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

// same guards as your form
const isFieldGroup = (item: SettingsItem): item is FieldGroup => 'header' in item;
const hasTabs = (item: SettingsItem): item is FieldGroup =>
  isFieldGroup(item) && Array.isArray(item.tabs) && item.tabs.length > 0;
const hasFields = (item: SettingsItem): item is FieldGroup =>
  isFieldGroup(item) && Array.isArray(item.fields) && item.fields.length > 0;

/**
 * Walk the SettingsItem tree and render a skeleton slot for every field,
 * preserving headers, subheaders, tabs, and column spans—and virtualize them.
 */
export function renderSkeletonSection(items: SettingsItem[]): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let standalone: FieldSetting[] = [];
  let flushCount = 0;

  const flush = () => {
    if (!standalone.length) return;
    nodes.push(
      <FieldsWrapper key={`skel-flush-${flushCount++}`}>
        <Grid>
          {standalone.map(fs => {
            const key = fs.name ?? fs.label;
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
      </FieldsWrapper>
    );
    standalone = [];
  };

  items.forEach((item, idx) => {
    if (hasTabs(item)) {
      flush();
      const group = item as FieldGroup;
      nodes.push(
        <React.Fragment key={`skel-hdr-tabs-${idx}`}>
          {group.isSubHeader
            ? <SubHeader>{group.header}</SubHeader>
            : <PageHeader>{group.header}</PageHeader>}
          {group.description && <Description>{group.description}</Description>}
          {group.tabs!.map((tab, i) => (
            <React.Fragment key={`skel-tab-${idx}-${i}`}>
              {renderSkeletonSection(tab.fields)}
            </React.Fragment>
          ))}
        </React.Fragment>
      );
      return;
    }

    if (hasFields(item)) {
      flush();
      const group = item as FieldGroup;
      nodes.push(
        <React.Fragment key={`skel-hdr-${idx}`}>
          {group.isSubHeader
            ? <SubHeader>{group.header}</SubHeader>
            : <PageHeader>{group.header}</PageHeader>}
          {group.description && <Description>{group.description}</Description>}
          <FieldsWrapper $hasHeader>
            {renderSkeletonSection(group.fields!)}
          </FieldsWrapper>
        </React.Fragment>
      );
      return;
    }

    standalone.push(item as FieldSetting);
  });

  flush();
  return nodes;
}

export default renderSkeletonSection;
