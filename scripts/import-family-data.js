/**
 * 将 tokyo-family-trip 数据直接导入 seed.json + Supabase
 * 不地理编码，lat/lon 默认 0（待 admin 手动订正）
 * 运行: node scripts/import-family-data.js
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SOURCE_DIR = path.resolve("E:/kimicode/tokyo-family-trip/data");
const SEED_PATH = path.resolve("src/data/seed.json");
const SEED_OUT = path.resolve("src/data/seed_new.json");

// Supabase client for direct DB insert
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

function mapCategory(dataType, subcategory, tags) {
  if (dataType === "park" || tags?.includes("公園")) return "park";
  if (dataType === "library" || subcategory?.includes("図書館")) return "library";
  if (subcategory?.includes("児童館") || subcategory?.includes("子育て")) return "children_center";
  if (subcategory?.includes("博物館") || subcategory?.includes("美術館")) return "museum";
  if (subcategory?.includes("水族館")) return "aquarium";
  if (subcategory?.includes("動物園")) return "zoo";
  if (tags?.includes("室内") || tags?.includes("雨天OK")) return "indoor_play";
  return "park";
}

function extractWard(address) {
  const match = address?.match(/東京都([^区市町村]+[区市町村])/);
  return match ? match[1] : "";
}

function slugify(name) {
  // Preserve Japanese kana/kanji while removing punctuation and special chars
  const s = name
    .toLowerCase()
    .replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
  return s || undefined; // caller falls back to id if empty
}

function loadSources() {
  const sources = [
    "tokyo_family_spots_with_coords.json",
    "libraries_base.json",
  ];
  const all = [];
  for (const fname of sources) {
    const fpath = path.join(SOURCE_DIR, fname);
    if (!fs.existsSync(fpath)) continue;
    const data = JSON.parse(fs.readFileSync(fpath, "utf-8"));
    all.push(...(Array.isArray(data) ? data : []));
    console.log(`Loaded ${fname}: ${data.length}`);
  }
  return all;
}

async function main() {
  console.log("=== Importing family data (no geocoding) ===\n");

  const existing = JSON.parse(fs.readFileSync(SEED_PATH, "utf-8"));
  console.log(`Existing seed places: ${existing.length}`);

  const raw = loadSources();
  console.log(`Total source: ${raw.length}`);

  // Filter: must have name and Tokyo address
  const valid = raw.filter(
    (r) => r.address?.startsWith("東京都") && r.name?.length > 1
  );
  console.log(`Valid: ${valid.length}`);

  // Deduplicate by address
  const byAddr = new Map();
  for (const r of valid) {
    if (!byAddr.has(r.address)) byAddr.set(r.address, r);
  }
  const unique = Array.from(byAddr.values());
  console.log(`After dedup: ${unique.length}\n`);

  const newPlaces = [];
  let skipped = 0;

  for (const r of unique) {
    // Skip if likely duplicate of existing seed
    const dup = existing.some(
      (p) =>
        p.address === r.address ||
        (p.name_ja && r.name && p.name_ja.includes(r.name.substring(0, 4)))
    );
    if (dup) {
      skipped++;
      continue;
    }

    const ft = r.family_tags || {};
    const category = mapCategory(r.data_type, r.subcategory, r.tags);
    const ward = extractWard(r.address);

    const place = {
      id: crypto.randomUUID(),
      slug: slugify(r.name) || crypto.randomUUID(),
      name_zh: r.name_zh || r.name,
      name_ja: r.name,
      category,
      ward,
      latitude: 0,
      longitude: 0,
      address: r.address,
      nearest_station: r.access || "",
      age_min: ft["适合年龄_0-3岁"] ? 0 : ft["适合年龄_3-6岁"] ? 3 : 1,
      age_max: ft["适合年龄_小学生"] ? 12 : ft["适合年龄_3-6岁"] ? 9 : 6,
      indoor: !!ft["室内"],
      rainy_day: !!ft["雨天可行"],
      free_entry: r.fee === "無料" || !!ft["免费"],
      stroller_score: ft["推车友好"] ? 5 : 3,
      diaper_score: ft["哺乳换尿布"] ? 5 : 2,
      parking_score: 3,
      play_score: category === "park" ? 5 : category === "library" ? 3 : 4,
      description: r.description || `${ward}の${r.subcategory || ""}。`,
      tips: r.tel ? `电话: ${r.tel}` : "",
      image_url: "",
    };

    newPlaces.push(place);
  }

  // 1. Save new seed.json (for SSG build)
  const merged = [...existing, ...newPlaces];
  fs.writeFileSync(SEED_OUT, JSON.stringify(merged, null, 2));
  console.log(`\nSeed output: ${SEED_OUT}`);
  console.log(`  Existing: ${existing.length}`);
  console.log(`  Skipped (dup): ${skipped}`);
  console.log(`  New (lat/lon=0): ${newPlaces.length}`);
  console.log(`  Total: ${merged.length}`);

  // 2. Insert into Supabase (for runtime)
  console.log(`\nInserting ${newPlaces.length} places into Supabase...`);
  const BATCH = 50;
  for (let i = 0; i < newPlaces.length; i += BATCH) {
    const batch = newPlaces.slice(i, i + BATCH);
    const { error } = await supabase.from("places").insert(batch);
    if (error) {
      console.error(`Batch ${i / BATCH + 1} failed:`, error.message);
    } else {
      console.log(`  Batch ${i / BATCH + 1}/${Math.ceil(newPlaces.length / BATCH)} OK`);
    }
    await sleep(300);
  }

  console.log("\nDone. Please copy seed_new.json to seed.json to update SSG data.");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch(console.error);
