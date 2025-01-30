import React from "react";
import { ExampleMolecule } from "../../molecules/ExampleMolecule";
import { StyledOrganism } from "./styled";

export const ExampleOrganism: React.FC = () => {
  return (
    <StyledOrganism>
      <h1>Example Organism</h1>
      <ExampleMolecule label="Your Name" />
      <ExampleMolecule label="Your Email" />
      <ExampleMolecule type="checkbox" label="Agree" />
    </StyledOrganism>
  );
};
