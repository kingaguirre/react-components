import styled from 'styled-components';

export const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  max-height: 500px; /* vertical scrolling if needed */
  border: 1px solid #ddd;
`;

export const TableStyled = styled.table`
  border-collapse: collapse;
  width: 100%;
  thead {
    position: sticky;
    top: 0;
    background: #fff;
    z-index: 2;
  }
`;

export const ThStyled = styled.th`
  border: 1px solid #ccc;
  padding: 8px;
  background: #f4f4f4;
  text-align: left;
  position: relative;
  user-select: none;
`;

export const TdStyled = styled.td`
  border: 1px solid #ccc;
  padding: 8px;
  vertical-align: top;
`;

export const ActionButton = styled.button`
  margin: 0 4px;
  padding: 4px 8px;
  cursor: pointer;
`;

export const FooterWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 0.9rem;
`;

export const PaginationButton = styled.button`
  margin: 0 4px;
  padding: 4px 8px;
  cursor: pointer;
`;

export const PaginationSelect = styled.select`
  margin: 0 8px;
  padding: 4px;
`;

export const HeaderCellWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const ResizeHandle = styled.div`
  width: 5px;
  cursor: col-resize;
  user-select: none;
  height: 100%;
  position: absolute;
  right: 0;
  top: 0;
  z-index: 1;
`;
