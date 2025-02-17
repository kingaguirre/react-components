import styled from 'styled-components'

const AppContainer = styled.div`
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: #333;
  text-align: center;
  padding: 20px;
  background: #f7f9fc;
  min-height: 100vh;
`;

const Header = styled.header`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 60px 20px;
  border-radius: 8px;
  margin-bottom: 40px;
`;

const HeroTitle = styled.h1`
  font-size: 2.8rem;
  margin-bottom: 10px;
`;

const HeroSubtitle = styled.p`
  font-size: 1.3rem;
`;

const Main = styled.main`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Section = styled.section`
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: left;
`;

const SectionTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 15px;
  color: #444;
`;

const CodeSnippet = styled.pre`
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 15px;
  border-radius: 5px;
  text-align: left;
  overflow-x: auto;
  font-size: 0.9rem;
`;

const Footer = styled.footer`
  margin-top: 40px;
  font-size: 0.9rem;
  color: #777;
`;

function App() {
  return (
    <AppContainer>
      <Header>
        <HeroTitle>Welcome to react-components-lib</HeroTitle>
        <HeroSubtitle>
          Your ultimate React component library for building robust, modern interfaces.
        </HeroSubtitle>
      </Header>
      <Main>
        <Section>
          <SectionTitle>Introduction</SectionTitle>
          <p>
            react-components-lib provides a rich collection of reusable, customizable components designed to accelerate your development process.
          </p>
        </Section>
        <Section>
          <SectionTitle>Installation</SectionTitle>
          <CodeSnippet>npm install react-components-lib</CodeSnippet>
        </Section>
        <Section>
          <SectionTitle>Usage Example</SectionTitle>
          <p>Here's a quick start example:</p>
          <CodeSnippet>
{`import { Button } from 'react-components-lib';

function App() {
  return <Button onClick={() => console.log('Button clicked!')}>Click Me</Button>;
}

export default App;`}
          </CodeSnippet>
        </Section>
        <Section>
          <SectionTitle>Explore Components in Storybook</SectionTitle>
          <p>
            To see our interactive component demos, run the following command:
          </p>
          <CodeSnippet>npm run start</CodeSnippet>
        </Section>
      </Main>
      <Footer>
        &copy; {new Date().getFullYear()} react-components-lib. All rights reserved.
      </Footer>
    </AppContainer>
  )
}

export default App
