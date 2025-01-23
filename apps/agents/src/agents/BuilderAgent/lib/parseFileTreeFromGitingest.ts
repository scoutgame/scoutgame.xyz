export type GithubFileNode = {
  name: string;
  content?: string;
  children?: GithubFileNode[];
};

export function parseFileTreeFromGitingest(input: string): GithubFileNode {
  const root: GithubFileNode = { name: 'root', children: [] };

  // Split the input by file delimiters
  const fileSections = input.split('================================================\nFile: ').slice(1);

  for (const fileSection of fileSections) {
    const [header, ...contentLines] = fileSection.split('\n');
    const filePath = header.trim();
    const content = contentLines.join('\n').trim();

    let current = root;
    const parts = filePath.split('/');

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      let child = current.children?.find((node) => node.name === part);
      if (!child) {
        child = { name: part };
        if (!isFile) child.children = [];
        if (!current.children) current.children = [];
        current.children.push(child);
      }

      if (isFile) {
        child.content = content;
      } else {
        current = child;
      }
    }
  }

  return root;
}
