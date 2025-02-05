import { ExamplePOC } from "./index";
import { StoryWrapper } from '@components/StoryWrapper';

export default {
  title: "POC/ExamplePOC",
  component: ExamplePOC,
};

export const Default = () => (
  <StoryWrapper title="Example">
    <ExamplePOC />
  </StoryWrapper>
);
