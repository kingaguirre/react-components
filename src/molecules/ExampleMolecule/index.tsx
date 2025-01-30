import React from "react";
import { FormControl } from "../../atoms/FormControl";
import { StyledContainer } from "./styled";

export interface ExampleMoleculeProps {
  label: string;
  type?: string
}

export const ExampleMolecule: React.FC<ExampleMoleculeProps> = ({ label, type = 'text' }) => {
  return (
    <StyledContainer>
      <FormControl label={label} placeholder="Type here..." type={type} />
    </StyledContainer>
  );
};
