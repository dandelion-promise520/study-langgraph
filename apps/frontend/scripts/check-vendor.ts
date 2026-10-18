/**
 * registry vendor 结构校验
 *
 * 目的：把「哪些文件是 registry 来的、它们该在哪」从口头约定变成 CI 硬约束。
 *
 * 校验项：
 *   1. 覆盖率      vendorRoots 下每个文件都必须登记（或在 firstPartyFiles 白名单里）
 *   2. 路径一致    未标记 fork 的文件，实际路径必须与其 target 声明的路径一致
 *   3. 符号唯一    同一个导出名不允许出现在两个文件里（消除重复实现）
 *   4. 单向依赖    vendor 文件不得 import 第一方业务层
 *
 * 用法：bun scripts/check-vendor.ts
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const PROJECT_ROOT = resolve(import.meta.dir, "..");
const MANIFEST_PATH = join(PROJECT_ROOT, "registry.manifest.json");

const SOURCE_FILE = /\.(ts|tsx)$/;
const SKIPPED_SOURCE = /\.(test|spec)\.(ts|tsx)$/;

/** target 前缀 -> 文件系统路径（与 components.json 的 aliases 保持一致） */
const TARGET_PREFIXES: readonly (readonly [string, string])[] = [
  ["@components", "src/components"],
  ["@ui", "src/components/ui"],
  ["@lib", "src/lib"],
  ["@hooks", "src/hooks"],
];

/** vendor 文件唯一允许的 @frontend 依赖面：只许往下依赖 vendor 层自身 */
const VENDOR_IMPORT_PREFIXES = [
  "@frontend/components/ui",
  "@frontend/components/motion",
  "@frontend/lib",
];

interface VendorEntry {
  path: string;
  registry: string;
  item: string;
  target: string;
  fork?: boolean;
}

interface Manifest {
  vendorRoots: string[];
  firstPartyFiles?: string[];
  allowDuplicateExports?: (string | { name: string; reason?: string })[];
  entries: VendorEntry[];
}

const errors: string[] = [];

function fail(message: string) {
  errors.push(message);
}

function toRel(absolute: string): string {
  return relative(PROJECT_ROOT, absolute).replaceAll("\\", "/");
}

function walkSourceFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  const found: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...walkSourceFiles(absolute));
      continue;
    }
    if (!entry.isFile() || !SOURCE_FILE.test(entry.name) || SKIPPED_SOURCE.test(entry.name))
      continue;
    found.push(absolute);
  }
  return found;
}

function readManifest(): Manifest {
  if (!existsSync(MANIFEST_PATH)) {
    fail("找不到 registry.manifest.json —— vendor 层缺少台账，无法校验");
    return { vendorRoots: [], entries: [] };
  }
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as Manifest;
}

function expectedPathForTarget(target: string): string | null {
  for (const [alias, directory] of TARGET_PREFIXES) {
    if (target === alias) return directory;
    if (target.startsWith(`${alias}/`)) return directory + target.slice(alias.length);
  }
  return null;
}

function checkCoverage(manifest: Manifest) {
  const declared = new Map(manifest.entries.map((entry) => [entry.path, entry]));
  const firstParty = new Set(manifest.firstPartyFiles ?? []);

  for (const [path] of declared) {
    if (!existsSync(join(PROJECT_ROOT, path))) {
      fail(`[覆盖率] 台账登记了 ${path}，但文件已不存在 —— 请从 registry.manifest.json 删除该条目`);
    }
  }
  for (const path of firstParty) {
    if (!existsSync(join(PROJECT_ROOT, path))) {
      fail(`[覆盖率] firstPartyFiles 登记了 ${path}，但文件已不存在`);
    }
  }

  for (const root of manifest.vendorRoots) {
    for (const absolute of walkSourceFiles(join(PROJECT_ROOT, root))) {
      const path = toRel(absolute);
      if (declared.has(path) || firstParty.has(path)) continue;
      fail(
        `[覆盖率] ${path} 位于 vendor 层但未登记 —— 是 registry 文件就在 registry.manifest.json 补一条，` +
          `是自有文件就加进 firstPartyFiles，两者都不是就搬出 vendor 层`,
      );
    }
  }
}

function checkTargets(manifest: Manifest) {
  for (const entry of manifest.entries) {
    if (entry.fork) continue;
    const expected = expectedPathForTarget(entry.target);
    if (!expected) {
      fail(`[路径一致] ${entry.path} 的 target "${entry.target}" 使用了无法识别的别名前缀`);
      continue;
    }
    if (expected !== entry.path) {
      fail(
        `[路径一致] ${entry.path} 偏离了 registry 路径 ${expected} —— 若是有意 fork，请把该条目标记为 ` +
          `"fork": true；否则把它搬回去，否则 CLI 将无法再对这项做 --diff/--overwrite`,
      );
    }
  }
}

const EXPORT_PATTERN =
  /\bexport\s+(?:declare\s+)?(?:async\s+)?(?:function|const|let|var|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g;

function checkDuplicateExports(manifest: Manifest) {
  const allowed = new Set(
    (manifest.allowDuplicateExports ?? []).map((item) =>
      typeof item === "string" ? item : item.name,
    ),
  );
  const owners = new Map<string, string[]>();

  for (const absolute of walkSourceFiles(join(PROJECT_ROOT, "src"))) {
    const path = toRel(absolute);
    const source = readFileSync(absolute, "utf8");
    for (const match of source.matchAll(EXPORT_PATTERN)) {
      const name = match[1];
      if (!name) continue;
      const files = owners.get(name) ?? [];
      if (!files.includes(path)) files.push(path);
      owners.set(name, files);
    }
  }

  for (const [name, files] of owners) {
    if (files.length < 2 || allowed.has(name)) continue;
    fail(
      `[符号唯一] "${name}" 被 ${files.length} 个文件同时导出 —— 同一个符号只应有一个实现：\n    ${files.join("\n    ")}`,
    );
  }
}

const IMPORT_PATTERN = /(?:from\s+|import\s*\(\s*)["']([^"']+)["']/g;

function checkOneWayImports(manifest: Manifest) {
  for (const entry of manifest.entries) {
    const absolute = join(PROJECT_ROOT, entry.path);
    if (!existsSync(absolute)) continue;
    const source = readFileSync(absolute, "utf8");
    for (const match of source.matchAll(IMPORT_PATTERN)) {
      const specifier = match[1];
      if (!specifier?.startsWith("@frontend/")) continue;
      const allowed = VENDOR_IMPORT_PREFIXES.some(
        (prefix) => specifier === prefix || specifier.startsWith(`${prefix}/`),
      );
      if (allowed) continue;
      fail(
        `[单向依赖] ${entry.path} 反向 import 了第一方业务模块 "${specifier}" —— ` +
          `vendor 层只能依赖 @frontend/components/ui、@frontend/components/motion、@frontend/lib`,
      );
    }
  }
}

function main() {
  const manifest = readManifest();

  checkCoverage(manifest);
  checkTargets(manifest);
  checkDuplicateExports(manifest);
  checkOneWayImports(manifest);

  const scope = `${manifest.entries.length} 个 vendor 文件 / ${manifest.vendorRoots.length} 个 vendor 目录`;

  if (errors.length > 0) {
    console.error(`registry vendor 校验失败（${scope}，${errors.length} 项问题）\n`);
    for (const error of errors) console.error(`  ${error}\n`);
    process.exit(1);
  }

  console.log(`registry vendor 校验通过（${scope}）`);
}

main();
