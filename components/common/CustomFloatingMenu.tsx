import { BlockquoteButton, BoldButton, CodeButton, HeadingButton, ItalicButton, Menu, MenuGroup, ParagraphButton } from "@bangle.dev/react-menu";

export function CustomFloatingMenu() {
  return (
    <Menu>
      <MenuGroup>
        <BoldButton />
        <ItalicButton />
        <CodeButton />
      </MenuGroup>
      <MenuGroup>
        <ParagraphButton />
        <BlockquoteButton />
        <HeadingButton level={1} />
        <HeadingButton level={2} />
        <HeadingButton level={3} />
      </MenuGroup>
    </Menu>
  );
}