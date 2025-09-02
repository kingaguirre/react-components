// Form.stories.tsx
import React, { useRef, useState } from 'react'
import { Button } from '../../atoms/Button'
import type { Meta, StoryObj } from '@storybook/react'
import { FormRenderer } from './index'
import { StoryWrapper, Title } from '../../components/StoryWrapper'
import {  demoData, demoSettings } from './data'
// import { FieldSettingsAIAgent } from './FieldSettingsAIAgent'

const descriptionText =
  'A fully dynamic, schema-validated form built with React Hook Form + Zod + styled-components.'

const meta: Meta<typeof FormRenderer> = {
  title: 'POC/FormRenderer',
  component: FormRenderer,
  parameters: {
    docs: {
      description: {
        component: descriptionText,
      },
    },
  },
  argTypes: {
    onChange: { action: 'valuesChanged' },
    onSubmit: { action: 'submitted' },
  },
}

export default meta

export const Playground: StoryObj<typeof FormRenderer> = {
  tags: ['!autodocs'],
  render: () => {
    const [loading, setLoading] = useState<boolean>(false)
    const [disabled, setDisabled] = useState<boolean>(false)
    const formRef = useRef<any>(null)
    return (
      <StoryWrapper title="Imperative Submit Example" subTitle={descriptionText}>
        <Title>Form Feature Demo</Title>
        {/* <FieldSettingsAIAgent/> */}
        
        <div style={{ display: 'flex', gap: 12, marginBottom: 30, justifyContent: 'flex-end'}}>
          <Button onClick={() => setLoading(!loading)}>
            {loading ? 'Loading' : 'Loaded'}
          </Button>
          <Button onClick={() => setDisabled(!disabled)}>
            {disabled ? 'Disabled' : 'Enabled'}
          </Button>
          <Button onClick={() => formRef.current?.submit()}>
            Submit Form
          </Button>
        </div>

        {/* <div style={{height: 200, overflow: 'auto'}}> */}
          <FormRenderer
            ref={formRef}
            dataSource={demoData}
            fieldSettings={demoSettings}
            onChange={(d) => console.log('changed:', d)}
            onSubmit={(d) => console.log('submitted:', d)}
            loading={loading}
            disabled={disabled}
          />
        {/* </div> */}
        <Button onClick={() => formRef.current?.submit()}>
          Submit Form
        </Button>
      </StoryWrapper>
    )
  },
}
