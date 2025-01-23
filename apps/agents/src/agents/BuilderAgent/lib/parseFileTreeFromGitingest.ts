import { prettyPrint } from '@packages/utils/strings';

export type GithubFileNode = {
  name: string;
  content?: string;
  children?: GithubFileNode[];
};

export function parseFileTreeFromGitingest(input: string, ignorePatterns: (string | RegExp)[] = []): GithubFileNode {
  const root: GithubFileNode = { name: 'root', children: [] };

  // Split the input by file delimiters
  const fileSections = input.split('================================================\nFile: ').slice(1);

  // Iterate through each file section from the input
  for (const fileSection of fileSections) {
    // Split the section into header (file path) and content lines
    const [header, ...contentLines] = fileSection.split('\n');
    // Get the cleaned file path
    const filePath = header.trim();
    // Join content lines back together and clean whitespace
    const content = contentLines.join('\n').trim();

    // Start at the root node of our tree
    let current = root;
    // Split the file path into directory/file parts
    const parts = filePath.split('/');

    // Iterate through each part of the path
    for (let i = 0; i < parts.length; i++) {
      // Get the current path segment
      const part = parts[i];
      // Check if this is the last segment (file) or a directory
      const isFile = i === parts.length - 1;

      // Try to find an existing child node with this name
      let child = current.children?.find((node) => node.name === part);
      // If no existing child found, create a new one
      if (!child) {
        // Create new node with the part name
        child = { name: part };
        // If it's a directory, initialize children array
        if (!isFile) child.children = [];
        // Ensure current node has a children array
        if (!current.children) current.children = [];
        // Add the new child to current node
        current.children.push(child);
      }

      // If this is a file node, add the content
      if (isFile && !ignorePatterns.some((pattern) => parts.join('/').match(pattern))) {
        child.content = content;
      } else {
        // Otherwise move down the tree to this directory
        current = child;
      }
    }
  }

  return root;
}
