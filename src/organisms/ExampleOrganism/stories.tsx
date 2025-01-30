import { ExampleOrganism } from "./index";
import { StoryWrapper } from '@components/StoryWrapper';

export default {
  title: "Organisms/ExampleOrganism",
  component: ExampleOrganism,
};

export const Default = () => (
  <StoryWrapper title="Example">
    <ExampleOrganism />
  </StoryWrapper>
);
