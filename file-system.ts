export {}

abstract class FileSystemNode {
  public name: string;
  public createdAt: Date;
  public parent: Directory | null;

  constructor(name: string, parent: Directory | null) {
    this.name = name;
    this.createdAt = new Date();
    this.parent = parent;
  }

  abstract getSize(): number;
  abstract print(indent?: string): void;

  getFullPath(): string {
    return this.parent ? `${this.parent.getFullPath()}/${this.name}` : this.name;
  }

}

class File extends FileSystemNode {
  public content: string;

  constructor(name: string, content: string, parent: Directory | null = null) {
    super(name, parent);
    this.content = content;
  }

  getSize(): number {
    return this.content.length; 
  }

  print(indent: string = ""): void {
    console.log(`${indent}- [FILE] ${this.name} (${this.getSize()} bytes)`);
  }
}

class Directory extends FileSystemNode {
  private children: FileSystemNode[] = [];

  constructor(name: string, parent: Directory | null = null) {
    super(name, parent);
  }

  getChildNode(name: string) {
    return this.children.find((node) => node.name === name);
  }

  addChildNode(node: FileSystemNode) {
    if (this.getChildNode(node.name)) {
      console.error(`Already a node exists with name ${node.name} in directory ${this.name}`);
      return false;
    }

    node.parent = this;
    this.children.push(node);
    return true;
  }

  getSize(): number {
    let totalSize = 0;
    for (let node of this.children) {
      totalSize += node.getSize();
    }

    // console.log('this.children', this.children, totalSize);
    return totalSize;
  }

  listChildNodes(): string[] {
    return this.children.map(child => child.name);
  }

  print(indent: string = ""): void {
    console.log(`${indent}[DIR]${this.name} (${this.getSize()} bytes)`);
    for (let node of this.children) {
      node.print(indent + " ");
    }
  }
}

class FileSystem {
  public rootDir: Directory;
  public currentDir: Directory;

  constructor() {
    this.rootDir = new Directory("root", null);
    this.currentDir = this.rootDir;
  }

  changeDir(path: string) {
    const parts = path.split("/");
    let curDir: Directory = path.startsWith("/") ? this.rootDir : this.currentDir;

    for (let part of parts) {
      if (!part) {
        console.log('Invalid path');
        return false;
      }

      if (part === ".") continue;
      if (part === "..") {
        if (curDir.parent) {
          curDir = curDir.parent;
          continue;
        }
      }

      const nextNode = curDir.getChildNode(part);
      if (!(nextNode instanceof Directory)) {
        console.error(`${part} is not a Directory`);
        return false;
      }

      curDir = nextNode;
    }

    this.currentDir = curDir;
    return true;
  }

  makeDir(name: string) {
    this.currentDir.addChildNode(new Directory(name, this.currentDir));
  }

  makeFile(name: string, content: string = "") {
    this.currentDir.addChildNode(new File(name, content, this.currentDir));
  }

  list(): void {
    this.currentDir.listChildNodes().forEach(name => console.log(name));
  }

  tree(): void {
    this.rootDir.print();
  }
}

// Driver code
const fs = new FileSystem();
fs.makeDir("projects");
fs.changeDir("projects");
fs.makeFile("readme.txt", "Welcome to the file system!");
fs.makeDir("src");
fs.changeDir("src");
fs.makeFile("index.ts", "console.log('Hello, world!');");
fs.changeDir("..");
fs.changeDir("..");

fs.tree();
