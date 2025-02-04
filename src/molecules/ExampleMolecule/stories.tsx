import { ExampleMolecule } from "./index";
import { StoryWrapper } from '@components/StoryWrapper';

export default {
  title: "Molecules/ExampleMolecule",
  component: ExampleMolecule,
};

export const Default = () => (
  <StoryWrapper title="Example">
    <ExampleMolecule label="Example Label" />
  </StoryWrapper>
);
