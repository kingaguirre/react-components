import React from 'react';
import styled from 'styled-components';

interface EditableCellProps {
  value: any;
  editorType: 'text' | 'checkbox' | 'radio' | 'date' | 'tags';
  onChange: (value: any) => void;
}

const InputStyled = styled.input`
  width: 100%;
  padding: 4px;
`;

export const EditableCell: React.FC<EditableCellProps> = ({ value, editorType, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (editorType === 'checkbox') {
      onChange(e.currentTarget.checked);
    } else {
      onChange(e.currentTarget.value);
    }
  };

  switch (editorType) {
    case 'checkbox':
      return <input type="checkbox" checked={Boolean(value)} onChange={handleChange} />;
    case 'radio':
      return <input type="radio" checked={Boolean(value)} onChange={handleChange} />;
    case 'date':
      return <InputStyled type="date" value={value} onChange={handleChange} />;
    case 'tags':
      // You could integrate a tag-input component here.
      return (
        <InputStyled
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="Enter tags separated by commas"
        />
      );
    default:
      return <InputStyled type="text" value={value} onChange={handleChange} />;
  }
};
