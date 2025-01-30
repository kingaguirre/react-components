import React from "react";
import { ExampleMolecule } from "../../molecules/ExampleMolecule";
import { StyledOrganism } from "./styled";

export const ExamplePOC: React.FC = () => {
  return (
    <StyledOrganism>
      <h1>Example POC</h1>
      <ExampleMolecule label="Label Text" />
      <ExampleMolecule type="checkbox" label="Checkbox" />
      <ExampleMolecule type="radio" label="Radio" />
      <ExampleMolecule type="switch" label="Switch" />
    </StyledOrganism>
  );
};
