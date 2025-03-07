import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  max-width: 1000px;
  margin: 3rem auto;

  .button + .alert,
  .alert + .alert {
    margin-top: 12px;
  }

  .grid-item {
    > .button {
      margin-bottom: 12px;
    }
  
    > .button + .button,
    > .form-control-input-container + .form-control-input-container {
      margin-top: 12px;
    }
    > .button {
      margin-right: 12px;
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

  @media screen and (max-width: 767px) {
    padding: 16px;
  }


  > .form-control-input-container + .button,
  > .button {
    margin-bottom: 12px;
  }

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

const StorySubTitle = styled.div`
  font-size: 14px;
  margin: 16px 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  -webkit-overflow-scrolling: touch;
  line-height: 24px;
  color: #2E3438;
`

interface StoryWrapperProps {
  title: string;
  subTitle?: string;
  children: React.ReactNode;
}

export const StoryWrapper: React.FC<StoryWrapperProps> = ({ title, subTitle, children }) => (
  <Wrapper>
    <StoryTitle>{title}</StoryTitle>
    {subTitle && <StorySubTitle>{subTitle}</StorySubTitle>}
    <Container>{children}</Container>
  </Wrapper>
);


const TitleContainer = styled(StoryTitle)`
  position: relative;
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

