import type { Meta, StoryObj } from "@storybook/react";
import DatePicker from "./index";
import { StoryWrapper, Title } from "@components/StoryWrapper";
import { useState } from "react";
import Button from "@atoms/Button";
import styled from "styled-components";
import { Grid, GridItem } from "@atoms/Grid";

const meta = {
  title: "Molecules/DatePicker",
  component: DatePicker,
  argTypes: {
    required: { control: "boolean" },
    disabled: { control: "boolean" },
    range: { control: "boolean" },
    color: { control: "select", options: ["primary", "success", "danger", "info", "warning", "default"] },
  },
} satisfies Meta<typeof DatePicker>;

export default meta;

/** ✅ Default DatePicker */
export const Default: StoryObj<typeof meta> = {
  args: {
    label: "Pick a Date",
  },
  tags: ["!dev"],
};

// Styled Grid Layout
const GridContainer = styled.div`
  margin-top: 16px;
`;

const COLORS = ["primary", "success", "danger", "info", "warning", "default"];

/** ✅ All Examples */
export const Examples = {
  tags: ["!autodocs"],
  render: () => {
    const [singleDate, setSingleDate] = useState<any>("2025-02-10");
    const [rangeDate, setRangeDate] = useState<any>("2025-02-10,2025-02-28");
    const [isSingleDisabled, setIsSingleDisabled] = useState(false);
    const [isRangeDisabled, setIsRangeDisabled] = useState(false);
    const [isSingleRequired, setIsSingleRequired] = useState(false);
    const [isRangeRequired, setIsRangeRequired] = useState(false);

    return (
      <StoryWrapper title="Date Picker Examples">
        {/* 📌 Color Variants */}
        <Title>Color Variants</Title>
        <Grid>
          {COLORS.map((color: any) => (
            <GridItem xs={12} sm={6} md={4} key={color}>
              <DatePicker label={`${color.charAt(0).toUpperCase() + color.slice(1)} Color`} color={color} helpText="This is a help text"/>
            </GridItem>
          ))}
        </Grid>

        {/* 📌 Form Props */}
        <Grid style={{marginTop: 20}}>
          {/* Left Column: Single Date Picker */}
          <GridItem xs={12} sm={6}>
            <Title>Single Date Picker</Title>
            <DatePicker
              label="Single Date"
              selectedDate={singleDate}
              onChange={(date) => console.log(date)}
              required={isSingleRequired}
              disabled={isSingleDisabled}
              minDate={new Date()}
            />
            <GridContainer>
              <Grid>
                <GridItem xs={6}>
                  <Button size="sm" fullWidth color="primary" onClick={() => setIsSingleDisabled((prev) => !prev)}>
                    Toggle Disabled
                  </Button>
                </GridItem>
                <GridItem xs={6}>
                  <Button size="sm" fullWidth color="warning" onClick={() => setIsSingleRequired((prev) => !prev)}>
                    Toggle Required
                  </Button>
                </GridItem>
                <GridItem xs={6}>
                  <Button size="sm" fullWidth color="success" onClick={() => setSingleDate(new Date())}>
                    Set Today's Date
                  </Button>
                </GridItem>
                <GridItem xs={6}>
                  <Button size="sm" fullWidth color="danger" onClick={() => setSingleDate(null)}>
                    Clear Date
                  </Button>
                </GridItem>
              </Grid>
            </GridContainer>
          </GridItem>

          {/* Right Column: Date Range Picker */}
          <GridItem xs={12} sm={6}>
            <Title>Date Range Picker</Title>
            <DatePicker
              label="Date Range"
              selectedDate={rangeDate}
              onChange={(date) => console.log(date)}
              required={isRangeRequired}
              disabled={isRangeDisabled}
              range
            />
            <GridContainer>
              <Grid>
                <GridItem xs={6}>
                  <Button size="sm" fullWidth color="primary" onClick={() => setIsRangeDisabled((prev) => !prev)}>
                    Toggle Disabled
                  </Button>
                </GridItem>
                <GridItem xs={6}>
                  <Button size="sm" fullWidth color="warning" onClick={() => setIsRangeRequired((prev) => !prev)}>
                    Toggle Required
                  </Button>
                </GridItem>
                <GridItem xs={6}>
                  <Button size="sm" fullWidth color="success" onClick={() => setRangeDate([new Date(), new Date(new Date().setDate(new Date().getDate() + 7))])}>
                    Set Next 7 Days
                  </Button>
                </GridItem>
                <GridItem xs={6}>
                  <Button size="sm" fullWidth color="danger" onClick={() => setRangeDate(null)}>
                    Clear Date Range
                  </Button>
                </GridItem>
              </Grid>
            </GridContainer>
          </GridItem>
        </Grid>
      </StoryWrapper>
    );
  },
};
