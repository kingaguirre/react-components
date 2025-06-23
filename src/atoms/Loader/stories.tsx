// src/components/Loader/stories.tsx
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Loader from './index';
import type { LoaderProps } from './interface';
import { StoryWrapper, Title } from '../../components/StoryWrapper';
import { Grid, GridItem } from '../../atoms/Grid';
import type { ColorType, SizeType } from '../../common/interface';
import { Button } from '../Button';

const descriptionText =
  'Loader supports both a top‑attached progress bar (“line” type) and a circular spinner (“default” type), each in indeterminate, determinate, and buffer modes.';

const COLORS = [
  'primary',
  'success',
  'warning',
  'danger',
  'info',
  'default',
] as const;
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

const meta: Meta<typeof Loader> = {
  title: 'Atoms/Loader',
  component: Loader,
  parameters: {
    docs: {
      description: { component: descriptionText },
    },
  },
  argTypes: {
    type: { control: 'radio', options: ['default', 'line'] },
    color: {
      control: 'select',
      options: COLORS,
    },
    size: {
      control: 'select',
      options: SIZES,
    },
    value: {
      control: { type: 'number', min: 0, max: 100 },
    },
    valueBuffer: {
      control: { type: 'number', min: 0, max: 100 },
    },
    thickness: { control: 'number' },
  },
};

export default meta;

export const Default: StoryObj<LoaderProps> = {
  args: { type: 'default' },
  tags: ['!dev'],
};

export const Examples: StoryObj<LoaderProps> = {
  tags: ['!autodocs'],
  render: () => {
    const [showLoader, setShowLoader] = React.useState(true);

    const DynamicDemo: React.FC = () => {
      const [val, setVal] = React.useState(0);
      const [buf, setBuf] = React.useState(10);

      React.useEffect(() => {
        const timer = setInterval(() => {
          setVal((prev) => {
            const next = prev >= 100 ? 0 : prev + 1;
            setBuf(next === 0 ? 10 : Math.min(100, next + 10));
            return next;
          });
        }, 100);
        return () => clearInterval(timer);
      }, []);

      return (
        <>
          <Title>Interactive Progress</Title>
          <Grid>
            <GridItem xs={12}>
              <Loader

                value={val}
                valueBuffer={buf}
                size="lg"
                thickness={4}
                color="success"
              />
            </GridItem>
            <GridItem xs={12}>
              <Loader
                type="line"
                value={val}
                valueBuffer={buf}
                color="danger"
              />
            </GridItem>
          </Grid>
        </>
      );
    };

    return (
      <StoryWrapper title="Loader Examples" subTitle={descriptionText}>
        <Title>Circular Colors</Title>
        <Grid>
          {COLORS.map((col) => (
            <GridItem xs={6} sm={4} md={2} key={col}>
              <div style={{ marginTop: 6, textAlign: 'center' }}>
                <Loader color={col as ColorType} />
                <div>{col}</div>
              </div>
            </GridItem>
          ))}
        </Grid>

        <Title>Circular Sizes</Title>
        <Grid>
          {SIZES.map((sz) => (
            <GridItem xs={6} sm={4} md={2} key={sz}>
              <div style={{ marginTop: 6, textAlign: 'center' }}>
                <Loader size={sz as SizeType} />
                <div>{sz}</div>
              </div>
            </GridItem>
          ))}
        </Grid>

        <Title>Custom Sizes (px)</Title>
        <Grid>
          {[20, 30, 40, 50, 60].map((px) => (
            <GridItem xs={6} sm={4} md={2} key={px}>
              <div style={{ marginTop: 6, textAlign: 'center' }}>
                <Loader size={px} thickness={px / 10} />
                <div>{px}px</div>
              </div>
            </GridItem>
          ))}
        </Grid>

        <Title>Determinate Circular Value</Title>
        <Grid>
          {[25, 50, 75, 100].map((v) => (
            <GridItem xs={6} sm={3} md={2} key={v}>
              <div style={{ textAlign: 'center', marginTop: 6 }}>
                <Loader value={v} size="md" thickness={4} />
                <div>{v}%</div>
              </div>
            </GridItem>
          ))}
        </Grid>

        <Title>Buffered</Title>
        <Grid>
          <GridItem xs={12}>
            <div style={{ textAlign: 'left', marginTop: 6 }}>
              <Loader
                value={40}
                valueBuffer={80}
                size="md"
              />
              <div><b>value:</b> 40%</div>
              <div><b>buffer value:</b> 80%</div>
            </div>
          </GridItem>
          <GridItem xs={12}>
            <div style={{ textAlign: 'left', marginTop: 6 }}>
              <Loader
                type="line"
                value={40}
                valueBuffer={80}
              />
              <div><b>value:</b> 40%</div>
              <div><b>buffer value:</b> 80%</div>
            </div>
          </GridItem>
        </Grid>

        <Title>Line Loader</Title>
        <Grid>
          <GridItem xs={12}>
            <div style={{ overflow: 'hidden' }}>
              {COLORS.map((col) => (
                <React.Fragment key={col}>
                  <div style={{ marginBottom: 12, textAlign: 'left' }}>
                    <Loader type="line" color={col as ColorType} />
                    <div>{col}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </GridItem>
        </Grid>

        <DynamicDemo />

        <Title>Append To</Title>
        <Button
          onClick={() => setShowLoader((s) => !s)}
          style={{ margin: '16px 0' }}
        >
          {showLoader ? 'Hide' : 'Show'} Loader
        </Button>

        <Grid>
          <GridItem xs={12}>
            <div
              className="append-demo-line"
              style={{
                position: 'relative',
                height: 60,
                background: '#e0f7fa',
                padding: 12,
                marginBottom: 12,
                overflow: 'hidden',
              }}
            >
              {showLoader && (
                <Loader
                  type="line"
                  appendTo=".append-demo-line"
                  color="info"
                />
              )}
              <div style={{ marginTop: 6 }}>
                Line loader (appendTo) in container
              </div>
            </div>
            <div
              className="append-demo-circle"
              style={{
                position: 'relative',
                height: 80,
                background: '#fce4ec',
                padding: 12,
              }}
            >
              {showLoader && (
                <Loader
                  color="danger"
                  appendTo=".append-demo-circle"
                  label='Loading...'
                />
              )}
              <div style={{ marginTop: 6 }}>
                Circle loader (appendTo) with overlay & centered
              </div>
            </div>
          </GridItem>
        </Grid>

        <Title>Within button</Title>
        <Button>
          test <Loader size="xs" />
        </Button>
      </StoryWrapper>
    );
  },
};
