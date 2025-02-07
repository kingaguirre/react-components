import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  max-width: 1000px;
  margin: 3rem auto;

  .grid-item {
    .button + .button,
    .form-control-input-container + .form-control-input-container {
      margin-top: 16px;
    }
    .button {
      margin-right: 16px;
    }
  }
`;

const Container = styled.div`
  min-height: 65vh;
  position: relative;
  overflow: hidden;
  margin: 20px 0 20px;
  padding: 30px;
  border-radius: 4px;
  background: #FFFFFF;
  box-shadow: rgba(0, 0, 0, 0.10) 0 1px 3px 0;
  border: 1px solid hsla(203, 50%, 30%, 0.15);
`;

const StoryTitle = styled.div`
  font-size: 32px;
  line-height: 36px;
  margin: 0 0 8px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  -webkit-overflow-scrolling: touch;
  padding: 0;
  cursor: text;
  position: relative;
  color: #2E3438;
  font-weight: bold;
`;

interface StoryWrapperProps {
  title: string;
  children: React.ReactNode;
}

export const StoryWrapper: React.FC<StoryWrapperProps> = ({ title, children }) => (
  <Wrapper>
    <StoryTitle>{title}</StoryTitle>
    <Container>{children}</Container>
  </Wrapper>
);


const TitleContainer = styled(StoryTitle)`
  padding-bottom: 4px;
  border-bottom: 1px solid hsla(203, 50%, 30%, 0.15);
  font-size: 13px;
  font-weight: 700;
  line-height: 16px;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: #202020;
  border: 0;
  margin-bottom: 12px;
  &:not(:first-child) {
    margin-top: 40px;
  }
`;

/* eslint-disable @typescript-eslint/no-explicit-any */
export const Title: React.FC<any> = ({ children }) => (
  <TitleContainer># {children}</TitleContainer>
);

