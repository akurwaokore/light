// One-off audit: compare API paths referenced in code vs. route files that exist.
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

// 1. Collect existing routes (directories containing route.ts/tsx)
const existing = new Set();
function walk(dir) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.isFile() && /^route\.tsx?$/.test(e.name)) {
      // path relative to app/
      let rel = path.relative(path.join(ROOT, "app"), path.dirname(full));
      rel = rel.replace(/\\/g, "/");
      // convert [id] -> :id style for matching, but keep raw too
      const slash = "/" + rel.replace(/^api\//, "");
      existing.add(slash);
    }
  }
}
walk(path.join(ROOT, "app", "api"));

// 2. Collect referenced paths from source files
const referenced = new Map(); // path -> [file:line]
const re = /\/api\/[A-Za-z0-9_\-\/]+/g;
function scan(dir) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === ".next" || e.name === ".git") continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) scan(full);
    else if (e.isFile() && /\.(ts|tsx|js|jsx|mjs)$/.test(e.name)) {
      let txt = "";
      try {
        txt = fs.readFileSync(full, "utf8");
      } catch {
        continue;
      }
      const lines = txt.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        let m;
        const reLocal = /\/api\/[A-Za-z0-9_\-\/]+/g;
        while ((m = reLocal.exec(lines[i])) !== null) {
          const p = m[0];
          if (!referenced.has(p)) referenced.set(p, []);
          referenced.get(p).push(full.replace(ROOT + path.sep, "").replace(/\\/g, "/") + ":" + (i + 1));
        }
      }
    }
  }
}
scan(path.join(ROOT, "app"));
scan(path.join(ROOT, "components"));
scan(path.join(ROOT, "hooks"));
scan(path.join(ROOT, "src"));
scan(path.join(ROOT, "lib"));

// 3. Classify a referenced path against existing routes.
// Existing uses Next dynamic segments [id]; referenced uses literal ids or ${id}.
function routesThatCouldMatch(refPath) {
  // Strip query string / fragments
  refPath = refPath.split(/[?#]/)[0];
  // Normalize trailing slash
  refPath = refPath.replace(/\/$/, "");
  // Existing routes are stored without the leading "api/" segment; match that convention.
  refPath = refPath.replace(/^\/api\//, "/");
  const segs = refPath.split("/").filter(Boolean); // e.g. ['posts','123']
  // candidate routes: same number of segments OR existing [id] wildcards
  const candidates = [];
  for (const route of existing) {
    const rSegs = route.split("/").filter(Boolean);
    if (rSegs.length !== segs.length) continue;
    let ok = true;
    for (let i = 0; i < rSegs.length; i++) {
      if (rSegs[i] === segs[i]) continue;
      if (/^\[.+\]$/.test(rSegs[i])) continue; // dynamic segment matches anything
      ok = false;
      break;
    }
    if (ok) candidates.push(route);
  }
  return candidates;
}

const missing = [];
const matched = [];
for (const [p] of referenced) {
  const cands = routesThatCouldMatch(p);
  if (cands.length === 0) {
    // ignore template-literal-only dynamic ones like /api/${x}
    if (/\$\{/.test(p)) continue;
    missing.push(p);
  } else {
    matched.push([p, cands]);
  }
}

console.log("=== REFERENCED BUT NO MATCHING ROUTE (missing) ===");
missing.sort();
for (const m of missing) {
  console.log(m);
  console.log("   used in:", referenced.get(m).slice(0, 3).join(" | "));
}
console.log("\n=== EXISTING ROUTES NEVER REFERENCED ===");
const refBases = new Set();
for (const [p] of referenced) {
  // reduce literal ids to a generic form to compare
  const segs = p.replace(/\/$/, "").split("/").filter(Boolean);
  refBases.add(segs.join("/"));
}
const unreferenced = [];
for (const route of existing) {
  // check if any referenced path could map to this route
  let used = false;
  for (const [p] of referenced) {
    if (routesThatCouldMatch(p).includes(route)) {
      used = true;
      break;
    }
  }
  if (!used) unreferenced.push(route);
}
unreferenced.sort();
for (const u of unreferenced) console.log(u);
