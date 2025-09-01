import React from "react";
import styled from "styled-components";
import { CodeBlock } from "./CodeBlock";

/* -----------------------------------------------------------------------------
   Reusable Guide (styled-components, same visuals)
----------------------------------------------------------------------------- */
const GuideWrap = styled.div`
  margin-top: 16px;
  padding: 16px;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 4px;
  background: linear-gradient(
    180deg,
    var(--panel-bg, #f7f7f9),
    var(--sb-doc-bg, #ffffff)
  );
  color: var(--color-text, #0b0c0f);
  font-size: 13px;
  line-height: 1.55;
`;
const GuideHeader = styled.header`
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--color-border, #e5e7eb);
  margin-bottom: 12px;
`;
const GuideIcon = styled.span`
  font-size: 22px;
`;
const GuideTitle = styled.div`
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 0.2px;
`;
const GuideSubtitle = styled.div`
  font-size: 12px;
  color: var(--color-text-muted, #4b5563);
`;
const GuideSection = styled.section`
  margin-top: 10px;
`;
const GuideSectionTitle = styled.div`
  font-weight: 700;
  margin-bottom: 6px;
`;
const GuideUl = styled.ul`
  margin: 6px 0 0 0;
  padding-left: 18px;
`;
const GuideHr = styled.hr`
  border: 0;
  border-top: 1px dashed var(--color-border, #e5e7eb);
  margin: 12px 0;
`;

type GuideSectionDef = {
  heading: string;
  body?: string;
  code?: string;
  bullets?: string[];
};

export function Guide({
  emoji,
  title,
  subtitle,
  sections,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  sections: GuideSectionDef[];
}) {
  return (
    <GuideWrap aria-label={`${title} – Guide`}>
      <GuideHeader>
        <GuideIcon>{emoji}</GuideIcon>
        <div>
          <GuideTitle>{title}</GuideTitle>
          {subtitle && <GuideSubtitle>{subtitle}</GuideSubtitle>}
        </div>
      </GuideHeader>

      {sections.map((sec, i) => (
        <GuideSection key={i}>
          <GuideSectionTitle>{sec.heading}</GuideSectionTitle>
          {sec.body && <div style={{ marginBottom: 6 }}>{sec.body}</div>}
          {sec.bullets && (
            <GuideUl>
              {sec.bullets.map((b, j) => (
                <li key={j} dangerouslySetInnerHTML={{ __html: b }} />
              ))}
            </GuideUl>
          )}
          {sec.code && <CodeBlock code={sec.code} />}
          {i < sections.length - 1 && <GuideHr />}
        </GuideSection>
      ))}
    </GuideWrap>
  );
}
