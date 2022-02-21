import * as Icons from "@geist-ui/icons";
import { Menu } from "@headlessui/react";
import styled from "styled-components";
import * as React from "react";

import * as Next from "@nextui-org/react";

const Container = styled.div`
  position: relative;
  margin-right: 5px;
`;

const Items = styled(Menu.Items)`
  position: absolute;
  left: 0;
  top: 100%;

  display: flex;
  flex-direction: column;
  align-items: stretch;

  margin-top: 5px;
  border-radius: 10px;

  padding: 8px;
  background: white;

  z-index: 100;
`;

const Item = styled.div`
  white-space: nowrap;
  padding: 5px;
  margin-bottom: 5px;
`;

const Button = React.forwardRef<HTMLButtonElement>(({ children, ...rest }, ref) => {
  return (
    <Next.Button {...rest} size="xs" auto flat bordered ref={ref} iconRight={<Icons.ChevronDown size={15} />}>
      {children}
    </Next.Button>
  );
});

type Item = {
  name: string;
  value: string;
};

type Props = {
  items: Item[];
  onSelect: (item: Item) => void;
  active?: string;
};

export const Dropdown: React.FC<Props> = (props) => {
  const selected = props.items.find((item) => item.value === props.active);

  return (
    <Menu as={Container}>
      <Menu.Button as={Button}>{selected?.name}</Menu.Button>

      <Items>
        {props.items.map((item, i) => {
          return (
            <Menu.Item onClick={() => props.onSelect(item)}>
              {() => {
                return (
                  <Next.Button
                    color={item.value === selected?.value ? "secondary" : "default"}
                    flat
                    auto
                    size="sm"
                    style={{ marginBottom: i === props.items.length - 1 ? 0 : 5 }}
                  >
                    {item.name}
                  </Next.Button>
                );
              }}
            </Menu.Item>
          );
        })}
      </Items>
    </Menu>
  );
};

export default Dropdown;
