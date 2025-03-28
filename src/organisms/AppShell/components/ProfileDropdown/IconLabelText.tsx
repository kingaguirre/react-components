import React from 'react'
import styled from 'styled-components'
import { Icon } from 'src/atoms/Icon';
import { theme } from 'src/styles';

interface IconLabelTextProps {
  icon: string;
  label: string;
  text: string;
}

const Container = styled.div`
  display: flex;
  align-items: center;
`

const IconWrapper = styled.div`
  width: 34px;
  .icon {
    font-size: 18px;
    color: ${theme.colors.primary.darker};
  }
`

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
`

const Label = styled.div`
  margin-bottom: 8px;
  color: ${theme.colors.default.dark};
  font-size: 10px;
  line-height: 1;
`

const Text = styled.div`
  color: ${theme.colors.primary.base};
  font-size: 10px;
  line-height: 1;
`

export const IconLabelText: React.FC<IconLabelTextProps> = ({ icon, label, text }) => {
  return (
    <Container>
      <IconWrapper>
        <Icon icon={icon}/>
      </IconWrapper>
      <ContentWrapper>
        <Label>{label}</Label>
        <Text>{text}</Text>
      </ContentWrapper>
    </Container>
  )
}
