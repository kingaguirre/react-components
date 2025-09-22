import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Wrap,
  MenuContainer,
  TitleContainer,
  MenuItem,
  TitleText,
  ArrowContainer,
  InfoContainer,
  TitleInfo,
  ChildContainer,
  ChildRow,
  NoDataContainer,
} from './styled';
import type {
  IChildNode,
  INode,
  SideMenuProps,
  MenuItemClickPayload,
} from './interfaces';
import { ensureSelection, rowHeightPx } from './utils';
import { Badge } from '../../atoms/Badge';
import { Icon } from '../../atoms/Icon';

/**
 * SideMenu (React + styled-components)
 * - Uses project atoms: <Badge/> and <Icon/>
 * - Active/hover colors from theme.colors.primary.base
 * - 0.2s ease transitions everywhere
 * - Controlled/uncontrolled behavior (no imperative API)
 */
export const SideMenu = forwardRef<HTMLDivElement, SideMenuProps>(function SideMenu(
  {
    data,
    disabled = false,
    noItemsText = 'No items to show',
    width = '190px',
    selectedItem,
    selectedChildItem,
    onMenuItemClick,
    className,
    style,
  },
  _ref
) {
  // Internal state (supports controlled & uncontrolled usage)
  const [internalData, setInternalData] = useState<INode[] | undefined>(data || undefined);
  const isItemControlled = selectedItem !== undefined;
  const isChildControlled = selectedChildItem !== undefined;
  const [selItem, setSelItem] = useState<string | undefined>(selectedItem);
  const [selChild, setSelChild] = useState<string | undefined>(selectedChildItem);

  // For controlled mode UX: local highlight when parent doesn’t immediately feed back
  const [activeLocalId, setActiveLocalId] = useState<string | undefined>(undefined);

  // Expanded state map (drives open/close animation)
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  // Sync props → state
  useEffect(() => {
    setInternalData(data || undefined);
  }, [data]);

  useEffect(() => {
    if (isItemControlled) setSelItem(selectedItem);
    // Clear local highlight once controller updates
    setActiveLocalId(undefined);
  }, [isItemControlled, selectedItem]);

  useEffect(() => {
    if (isChildControlled) setSelChild(selectedChildItem);
  }, [isChildControlled, selectedChildItem]);

  // Initialize selection + expansion
  useEffect(() => {
    if (!internalData || internalData.length === 0) return;
    const { selectedItem: si, selectedChildItem: sc } = ensureSelection(
      internalData,
      selItem,
      selChild
    );
    if (!isItemControlled) setSelItem(si);
    if (!isChildControlled) setSelChild(sc);

    const activeId = isItemControlled ? selectedItem : si;
    const next: Record<string, boolean> = {};
    internalData.forEach((n) => (next[n.id] = n.id === activeId && !!(n.childNodes?.length)));
    setExpandedMap(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internalData]);

  // If controller changes selectedItem, reflect in expansion (single-open)
  useEffect(() => {
    if (!internalData || !isItemControlled) return;
    const next: Record<string, boolean> = {};
    internalData.forEach((n) => (next[n.id] = n.id === selectedItem && !!(n.childNodes?.length)));
    setExpandedMap(next);
  }, [isItemControlled, selectedItem, internalData]);

  const setExpandedSingle = useCallback(
    (id?: string) => {
      setExpandedMap(() => {
        const next: Record<string, boolean> = {};
        (internalData || []).forEach((n) => (next[n.id] = !!id && n.id === id && !!(n.childNodes?.length)));
        return next;
      });
    },
    [internalData]
  );

  const handleParentClick = useCallback(
    (item: INode) => {
      if (item.disabled) return;

      // Always emit
      const payload: MenuItemClickPayload = { id: item.id };
      onMenuItemClick?.(payload);

      const hasChild = !!item.childNodes && item.childNodes.length > 0;

      if (isItemControlled) {
        // Controlled: animate expansion locally. If no child, visually highlight locally.
        if (hasChild) {
          const isOpen = !!expandedMap[item.id];
          setExpandedSingle(isOpen ? undefined : item.id);
        } else {
          setActiveLocalId(item.id);
        }
        return;
      }

      // Uncontrolled: toggle open and manage child selection
      const nextIsSelected = selItem !== item.id ? item.id : undefined; // toggle open/close
      let nextChild: string | undefined;
      if (nextIsSelected && hasChild) {
        const firstChild = item.childNodes?.[0];
        nextChild = firstChild ? firstChild.id : undefined;
      }
      setSelItem(nextIsSelected);
      setSelChild(nextChild);
      setExpandedSingle(nextIsSelected);
    },
    [isItemControlled, expandedMap, setExpandedSingle, selItem, onMenuItemClick]
  );

  const handleChildClick = useCallback(
    (cItem: IChildNode, parentId: string) => {
      if (cItem.disabled) return;

      // Always emit
      onMenuItemClick?.({ id: cItem.id, parent: { id: parentId } });

      if (isItemControlled) {
        // Keep parent open for UX when controlled
        setExpandedSingle(parentId);
        setActiveLocalId(cItem.id);
        return;
      }

      setSelItem(parentId);
      setSelChild(cItem.id);
      setExpandedSingle(parentId);
    },
    [isItemControlled, setExpandedSingle, onMenuItemClick]
  );

  const renderIcon = useCallback(
    (icon?: string, onClick?: (e: React.MouseEvent) => void, color?: string) => {
      if (!icon) return null;
      const click = onClick
        ? (e: React.MouseEvent) => {
            e.stopPropagation();
            onClick(e);
          }
        : undefined;
      return (
        <InfoContainer>
          <Icon icon={icon} onClick={click as any} color={color} />
        </InfoContainer>
      );
    },
    []
  );

  const renderBadge = useCallback((badgeValue?: number, color?: any, outlined?: boolean) => {
    if (badgeValue === undefined || badgeValue === null) return null;
    const capped = badgeValue > 99 ? '99+' : String(badgeValue);
    const tooltip = badgeValue > 99 ? String(badgeValue) : undefined;

    return (
      <InfoContainer title={tooltip} className="tx-badge-wrap">
        <Badge color={color} outlined={outlined} borderRadius="4px" size="md">
          &nbsp;{capped}&nbsp;
        </Badge>
      </InfoContainer>
    );
  }, []);

  const Row = useMemo(() => {
    type RowProps = { item: INode; expanded: boolean; active: boolean };
    const C: React.FC<RowProps> = React.memo(
      ({ item, expanded, active }) => {
        const hasChild = !!item.childNodes && item.childNodes.length > 0;
        const targetHeightPx = hasChild ? item.childNodes!.length * rowHeightPx : 0;

        return (
          <MenuItem
            key={item.id}
            className={active ? 'active' : ''}
            data-expanded={expanded ? '' : undefined}
            data-disabled={item.disabled ? '' : undefined}
          >
            <TitleContainer onClick={() => handleParentClick(item)}>
              <TitleText className={`tx-title-text ${hasChild ? 'has-child' : ''}`} $color={item.textColor}>
                {hasChild && (
                  <ArrowContainer className="tx-arrow">
                    <Icon icon="chevron-right" size={8} />
                  </ArrowContainer>
                )}
                <span className="tx-title-span">{item.title || '[No Title]'}</span>
              </TitleText>

              <TitleInfo>
                {renderIcon(
                  item.icon,
                  item.iconClick ? (e) => item.iconClick?.(item, e) : undefined,
                  item.iconColor
                )}
                {renderBadge(item.badgeValue, item.badgeColor, item.badgeOutlined)}
              </TitleInfo>
            </TitleContainer>

            {hasChild && (
              <ChildContainer
                className="tx-child-container"
                // Use CSS var to guarantee smooth transition 0px <-> Npx
                style={{ ['--target-h' as any]: expanded ? `${targetHeightPx}px` : '0px' }}
                data-expanded={expanded ? '' : undefined}
                aria-hidden={!expanded}
              >
                {item.childNodes!.map((c) => {
                  const controllerChild = isChildControlled ? selectedChildItem : selChild;
                  const cActive = controllerChild === c.id || activeLocalId === c.id;
                  return (
                    <ChildRow
                      key={c.id}
                      className={cActive ? 'active' : ''}
                      data-disabled={c.disabled ? '' : undefined}
                      onClick={() => handleChildClick(c, item.id)}
                    >
                      <div className="tx-child-title" style={{ color: c.textColor }}>
                        <span className="tx-child-title tx-child-title-inner">
                          {c.title || '[No Title]'}
                        </span>
                      </div>
                      <InfoContainer>
                        {typeof c.value === 'number' ? (
                          <strong style={{ color: c.valueColor }}>{c.value}</strong>
                        ) : c.icon ? (
                          <Icon icon={c.icon} color={c.iconColor} />
                        ) : null}
                      </InfoContainer>
                    </ChildRow>
                  );
                })}
              </ChildContainer>
            )}
          </MenuItem>
        );
      },
      (prev, next) => {
        // Prevent re-render unless selection/expanded or shallow item changes
        const p = prev.item;
        const n = next.item;
        const shallowEqual =
          p.id === n.id &&
          p.title === n.title &&
          p.icon === n.icon &&
          p.iconColor === n.iconColor &&
          p.textColor === n.textColor &&
          p.disabled === n.disabled &&
          p.badgeValue === n.badgeValue &&
          (p.badgeColor as any) === (n.badgeColor as any) &&
          p.badgeOutlined === n.badgeOutlined &&
          (p.childNodes?.length || 0) === (n.childNodes?.length || 0);

        return shallowEqual && prev.expanded === next.expanded && prev.active === next.active;
      }
    );
    return C;
  }, [renderBadge, renderIcon, selChild, isChildControlled, selectedChildItem, activeLocalId, handleChildClick, handleParentClick]);

  if (!internalData || internalData.length === 0) {
    return (
      <Wrap $width={width} className={className} style={style} data-disabled={disabled ? '' : undefined}>
        <NoDataContainer className="fade-in-container">{noItemsText}</NoDataContainer>
      </Wrap>
    );
  }

  return (
    <Wrap $width={width} className={className} style={style} data-disabled={disabled ? '' : undefined}>
      <MenuContainer className="menu-container">
        {internalData.map((item) => {
          const controllerActiveId = isItemControlled ? selectedItem : selItem;
          const active = controllerActiveId === item.id || (!item.childNodes?.length && activeLocalId === item.id);
          const expanded = expandedMap[item.id] || false;
          return <Row key={item.id} item={item} expanded={expanded} active={active} />;
        })}
      </MenuContainer>
    </Wrap>
  );
});

export default SideMenu;
