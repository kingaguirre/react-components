import React from "react";
import { StyledOrganism } from "./styled";
import Tooltip from "@atoms/Tooltip";

export const ExamplePOC: React.FC = () => {
  return (
    <StyledOrganism>
      <Tooltip content="test">
        <h1>Example POC</h1>
      </Tooltip>
    </StyledOrganism>
  );
};
