import { RightIconButtonContainer } from "./styled";
import { Icon } from "../../../../../atoms/Icon";
import { Tooltip } from "../../../../../atoms/Tooltip";

export const RightIconButton = ({
  onClick,
  title,
  icon,
  className,
  isAction,
  disabled,
  testId,
}: {
  onClick?: () => void;
  title?: string;
  icon: string;
  className?: string;
  isAction?: boolean;
  disabled?: boolean;
  testId?: string;
}) => (
  <Tooltip content={title} type="title">
    <RightIconButtonContainer
      {...(!disabled ? { onClick } : {})}
      className={`${className ?? ""} ${isAction ? "active" : ""} ${disabled ? "disabled" : ""}`}
      data-testid={testId}
    >
      <Icon icon={icon} />
    </RightIconButtonContainer>
  </Tooltip>
);
