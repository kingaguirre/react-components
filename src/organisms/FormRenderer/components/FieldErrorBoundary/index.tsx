// src/organisms/FormRenderer/components/FieldErrorBoundary/index.tsx
import React from "react";
import styled from "styled-components";
import { Label } from "../../../../atoms/FormControl/styled";
import { theme } from "../../../../styles";

const ErrorBox = styled.div<{ $type?: string }>`
  border: 1px solid ${theme.colors.danger.base};
  background: ${theme.colors.danger.pale};
  padding: 8px;
  min-height: ${({ $type }) => ($type === "textarea" ? 80 : 32)}px;
  max-height: 150px;
  overflow-y: auto;
  box-sizing: border-box;
  font-size: 14px;
  border-radius: 2px;
  ${({ $type }) => ($type !== "textarea" ? `line-height: 1;` : "")}
  > b {
    color: ${theme.colors.danger.base};
  }
`;

export interface FieldErrorBoundaryProps {
  label?: string;
  type?: string;
  required?: boolean;
  children: React.ReactNode;
}

interface FieldErrorBoundaryState {
  error: Error | null;
}

export default class FieldErrorBoundary extends React.Component<
  FieldErrorBoundaryProps,
  FieldErrorBoundaryState
> {
  state: FieldErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): FieldErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Field error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div>
          <Label>
            {this.props.required && <span>*</span>}
            {this.props.label}
          </Label>
          <ErrorBox $type={this.props.type}>
            <b>Error: </b>
            {this.state.error.message}
          </ErrorBox>
        </div>
      );
    }
    return this.props.children;
  }
}
