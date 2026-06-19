import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { main, runTsNoUnused } from "../src/cli.ts";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })),
  );
});

describe("runTsNoUnused", () => {
  it("removes unused locals and parameters from project files", async () => {
    const projectDir = await createFixture({
      "src/nest/unused3.ts": unusedSource("bar3", "baz3", "foo3"),
      "src/unused.ts": unusedSource("bar", "baz", "foo"),
    });

    const result = runTsNoUnused({
      cwd: projectDir,
      tsconfigPath: "tsconfig.json",
    });

    expect(relativePaths(projectDir, result.processedFiles)).toEqual([
      "src/nest/unused3.ts",
      "src/unused.ts",
    ]);
    await expect(readFixture(projectDir, "src/unused.ts")).resolves.toBe(
      expectedSource("bar", "baz", "foo"),
    );
    await expect(readFixture(projectDir, "src/nest/unused3.ts")).resolves.toBe(
      expectedSource("bar3", "baz3", "foo3"),
    );
  });

  it("limits writes to the target glob", async () => {
    const projectDir = await createFixture({
      "src/nest/unused3.ts": unusedSource("bar3", "baz3", "foo3"),
      "src/unused.ts": unusedSource("bar", "baz", "foo"),
    });

    const result = runTsNoUnused({
      cwd: projectDir,
      targetPattern: "src/nest/*.ts",
      tsconfigPath: "tsconfig.json",
    });

    expect(relativePaths(projectDir, result.processedFiles)).toEqual([
      "src/nest/unused3.ts",
    ]);
    expect(relativePaths(projectDir, result.skippedFiles)).toEqual([
      "src/unused.ts",
    ]);
    await expect(readFixture(projectDir, "src/unused.ts")).resolves.toBe(
      unusedSource("bar", "baz", "foo"),
    );
    await expect(readFixture(projectDir, "src/nest/unused3.ts")).resolves.toBe(
      expectedSource("bar3", "baz3", "foo3"),
    );
  });
});

describe("main", () => {
  it("accepts the documented --configPath alias", async () => {
    const projectDir = await createFixture({
      "src/unused.ts": unusedSource("bar", "baz", "foo"),
    });

    const result = main(["--configPath", "tsconfig.json"], {
      cwd: projectDir,
      logger: () => {},
    });

    expect(relativePaths(projectDir, result.processedFiles)).toEqual([
      "src/unused.ts",
    ]);
    await expect(readFixture(projectDir, "src/unused.ts")).resolves.toBe(
      expectedSource("bar", "baz", "foo"),
    );
  });
});

async function createFixture(files: Record<string, string>): Promise<string> {
  const projectDir = await mkdtemp(join(tmpdir(), "ts-no-unused-"));
  tempDirs.push(projectDir);

  await writeFixture(
    projectDir,
    "tsconfig.json",
    `${JSON.stringify(
      {
        compilerOptions: {
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          noUnusedLocals: true,
          noUnusedParameters: true,
          skipLibCheck: true,
          strict: true,
          target: "es2020",
        },
        include: ["src/**/*.ts"],
      },
      null,
      2,
    )}\n`,
  );

  await Promise.all(
    Object.entries(files).map(([filePath, content]) =>
      writeFixture(projectDir, filePath, content),
    ),
  );

  return projectDir;
}

async function writeFixture(
  projectDir: string,
  filePath: string,
  content: string,
): Promise<void> {
  const fullPath = join(projectDir, filePath);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content);
}

async function readFixture(
  projectDir: string,
  filePath: string,
): Promise<string> {
  return readFile(join(projectDir, filePath), "utf8");
}

function relativePaths(projectDir: string, files: string[]): string[] {
  return files
    .map((filePath) => relative(projectDir, filePath).replaceAll("\\", "/"))
    .sort();
}

function unusedSource(
  functionName: string,
  arrowName: string,
  valueName: string,
): string {
  return `function ${functionName}(unused: string) {
  const baz = "";
}

const ${arrowName} = (unused: string) => {};

const ${valueName} = "bar";
`;
}

function expectedSource(
  functionName: string,
  arrowName: string,
  valueName: string,
): string {
  return `function ${functionName}() {
}

const ${arrowName} = () => {};

const ${valueName} = "bar";
`;
}
