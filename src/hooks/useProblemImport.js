import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import mammoth from "mammoth";

import {
  guessCategory,
  findBestMatch,
  neetCodeMap,
  LOCAL_KNOWLEDGE_BASE,
  fetchMetadata,
} from "../utils/problemUtils";

const LEETCODE_URL_PATTERN =
  /https?:\/\/leetcode\.com\/problems\/([a-z0-9-]+)\/?/g;

function getFileExtension(filename) {
  return filename.split(".").pop().toLowerCase();
}

function isDocumentFile(filename) {
  const ext = getFileExtension(filename);
  return ["txt", "md", "markdown", "docx", "pdf"].includes(ext);
}

function isSpreadsheetFile(filename) {
  const ext = getFileExtension(filename);
  return ["xlsx", "xls", "csv"].includes(ext);
}

// --- 4. Document Parsing Functions ---

// Parse text files (.txt, .md)
async function parseTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Failed to read text file"));
    reader.readAsText(file);
  });
}

// Parse DOCX files
async function parseDocxFile(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error("DOCX parsing error:", error);
    throw new Error("Failed to parse DOCX file");
  }
}

// Parse PDF files (lazy load pdf.js)
async function parsePdfFile(file) {
  try {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map((item) => item.str).join(" ") + "\n";
    }
    return fullText;
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error(
      "Failed to parse PDF. Try installing: npm install pdfjs-dist",
    );
  }
}

// Extract LeetCode URLs from text
function extractUrlsFromText(text) {
  const slugs = [];
  let match;
  LEETCODE_URL_PATTERN.lastIndex = 0;

  while ((match = LEETCODE_URL_PATTERN.exec(text)) !== null) {
    const slug = match[1];
    if (slug && !slugs.includes(slug)) {
      slugs.push(slug);
    }
  }
  return slugs;
}

// Convert slug to display title
function slugToTitle(slug) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Parse document file based on type
async function parseDocumentFile(file) {
  const ext = getFileExtension(file.name);
  switch (ext) {
    case "txt":
    case "md":
    case "markdown":
      return parseTextFile(file);
    case "docx":
      return parseDocxFile(file);
    case "pdf":
      return parsePdfFile(file);
    default:
      throw new Error(`Unsupported document type: ${ext}`);
  }
}

export const useProblemImport = () => {
  const { userData, updateUserData } = useAuth();
  const [importing, setImporting] = useState(false);

  // Load metadata on mount
  useEffect(() => {
    fetchMetadata();
  }, []);

  const importProblems = useCallback(
    async (file) => {
      if (!file) return;
      setImporting(true);

      // Ensure metadata is loaded before processing
      await fetchMetadata();

      try {
        // --- DOCUMENT FILES: Extract URLs ---
        if (isDocumentFile(file.name)) {
          const text = await parseDocumentFile(file);
          const slugs = extractUrlsFromText(text);

          if (slugs.length === 0) {
            alert("No LeetCode problem URLs found in this file.");
            setImporting(false);
            return;
          }

          const importId = `file-${Date.now()}-${file.name.replace(/[^a-z0-9]/gi, "_")}`;

          // Build problems from slugs
          const newProblems = slugs.map((slug) => {
            const match = findBestMatch(slug);
            return {
              title: slugToTitle(slug),
              titleSlug: slug,
              difficulty: match?.d || "Unknown",
              type: match?.t || guessCategory(slug),
              status: "Todo",
              url: `https://leetcode.com/problems/${slug}/`,
              addedAt: new Date().toISOString(),
              sourceImportIds: [importId],
            };
          });

          // Merge with existing
          const existing = userData?.problems || [];
          const existingMap = new Map(existing.map((p) => [p.titleSlug, p]));

          let addedCount = 0;
          newProblems.forEach((p) => {
            if (existingMap.has(p.titleSlug)) {
              const existingProb = existingMap.get(p.titleSlug);
              const sourceImportIds = existingProb.sourceImportIds || [];
              if (!sourceImportIds.includes(importId)) {
                existingMap.set(p.titleSlug, {
                  ...existingProb,
                  sourceImportIds: [...sourceImportIds, importId],
                });
              }
            } else {
              existingMap.set(p.titleSlug, p);
              addedCount++;
            }
          });

          const mergedProblems = Array.from(existingMap.values());

          const newImport = {
            id: importId,
            name: file.name,
            type: "file",
            date: new Date().toISOString(),
            count: slugs.length,
          };

          await updateUserData({
            ...userData,
            problems: mergedProblems,
            imports: [newImport, ...(userData.imports || [])],
          });

          alert(
            `Found ${slugs.length} LeetCode URLs. Successfully imported ${addedCount} new problems!`,
          );
          setImporting(false);
          return;
        }

        // --- SPREADSHEET FILES: Original Excel/CSV parsing ---
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!jsonData || jsonData.length === 0) {
          alert("No data found in file.");
          setImporting(false);
          return;
        }

        // Find header row
        let headerRowIndex = 0;
        let headers = [];

        for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
          const row = jsonData[i];
          if (
            row.some(
              (cell) =>
                typeof cell === "string" &&
                ["title", "problem", "link", "url", "name"].some((k) =>
                  cell.toLowerCase().includes(k),
                ),
            )
          ) {
            headerRowIndex = i;
            headers = row;
            break;
          }
        }

        if (headers.length === 0) headers = jsonData[0];

        const finalData = jsonData.slice(headerRowIndex + 1).map((row) => {
          let obj = {};
          headers.forEach((h, i) => {
            if (h) obj[h] = row[i];
          });
          return obj;
        });

        const getValue = (row, keys) => {
          const rowKeys = Object.keys(row);
          for (const key of keys) {
            const foundKey = rowKeys.find(
              (k) => k.toLowerCase().trim() === key.toLowerCase(),
            );
            if (foundKey) return row[foundKey];
          }
          return null;
        };

        const newProblems = finalData
          .map((row) => {
            // Try to find title
            let title = getValue(row, [
              "Problem Name",
              "Title",
              "Name",
              "Problem",
            ]);

            // Try to find URL
            const url = getValue(row, ["Link", "URL", "Url", "Slug"]);

            // If no title but we have URL, use URL to derive title
            if (!title && url) {
              title = url;
            }

            if (!title && !url) return null;

            // --- 4. URL Cleaning & Import Logic ---
            let rawUrl = url || title;

            // CLEANING STEP: Remove query params like ?envType=...
            if (rawUrl) {
              rawUrl = rawUrl.split("?")[0];
            }

            // Extract Name from URL if possible
            let name = title;
            if (rawUrl && rawUrl.includes("/problems/")) {
              name =
                rawUrl.split("/problems/")[1]?.split("/")[0] ||
                rawUrl.split("/").pop();
            } else if (!name && rawUrl) {
              name = rawUrl.split("/").pop();
            }

            if (!name) return null;

            name = name.replace(/\/$/, "").replace(/-/g, " ");

            let diff =
              getValue(row, ["Difficulty", "Diff", "Level"]) || "Unknown";
            let type = "Uncategorized"; // Default

            // Attempt Match
            const match = findBestMatch(name);
            if (match) {
              if (match.d) diff = match.d;
              if (match.t) type = match.t;
            } else {
              type = guessCategory(name);
            }

            // Format Name for Display (Capitalize)
            const displayName = name
              .split(" ")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");

            // Status
            let status = "Todo";
            const rowStatus = getValue(row, ["Status", "State"]);
            if (
              rowStatus &&
              ["Done", "Solved", "ac"].includes(rowStatus.toLowerCase())
            ) {
              status = "Done";
            }

            // Generate slug for uniqueness
            const titleSlug = displayName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "");

            return {
              title: displayName,
              titleSlug,
              difficulty: diff,
              type: type, // Added type
              status,
              url: url || `https://leetcode.com/problems/${titleSlug}/`,
              addedAt: new Date().toISOString(),
            };
          })
          .filter((p) => p !== null);

        if (newProblems.length === 0) {
          alert("Could not parse any problems.");
          setImporting(false);
          return;
        }

        const importId = `file-${Date.now()}-${file.name.replace(/[^a-z0-9]/gi, "_")}`;

        // Merge with existing
        const existing = userData?.problems || [];
        const existingMap = new Map(existing.map((p) => [p.titleSlug, p]));

        let addedCount = 0;
        newProblems.forEach((p) => {
          if (existingMap.has(p.titleSlug)) {
            const existingProb = existingMap.get(p.titleSlug);
            const sourceImportIds = existingProb.sourceImportIds || [];
            if (!sourceImportIds.includes(importId)) {
              existingMap.set(p.titleSlug, {
                ...existingProb,
                sourceImportIds: [...sourceImportIds, importId],
              });
            }
          } else {
            existingMap.set(p.titleSlug, {
              ...p,
              sourceImportIds: [importId],
            });
            addedCount++;
          }
        });

        const mergedProblems = Array.from(existingMap.values());

        const newImport = {
          id: importId,
          name: file.name,
          type: "file",
          date: new Date().toISOString(),
          count: newProblems.length,
        };

        await updateUserData({
          ...userData,
          problems: mergedProblems,
          imports: [newImport, ...(userData.imports || [])],
        });

        alert(`Successfully imported ${addedCount} new problems!`);
      } catch (error) {
        console.error("Import failed:", error);
        alert("Failed to import file. " + error.message);
      } finally {
        setImporting(false);
      }
    },
    [userData, updateUserData],
  );

  const mergeProblems = useCallback(
    async (newProblems, importMetadata = null) => {
      const existing = userData?.problems || [];
      const existingMap = new Map(existing.map((p) => [p.titleSlug, p]));

      let importId = importMetadata?.id;
      if (importMetadata && !importId) {
        importId = `${importMetadata.type || "import"}-${Date.now()}`;
      }

      let addedCount = 0;
      newProblems.forEach((p) => {
        if (existingMap.has(p.titleSlug)) {
          // MERGE sourceSheets if they exist
          const existingProb = existingMap.get(p.titleSlug);

          const currentSheets = existingProb.sourceSheets || [];
          const newSheets = p.sourceSheets || [];
          const mergedSheets = [...new Set([...currentSheets, ...newSheets])];

          const currentImportIds = existingProb.sourceImportIds || [];
          const mergedImportIds = importId
            ? [...new Set([...currentImportIds, importId])]
            : currentImportIds;

          existingMap.set(p.titleSlug, {
            ...existingProb,
            sourceSheets: mergedSheets,
            sourceImportIds: mergedImportIds,
          });
        } else {
          existingMap.set(p.titleSlug, {
            ...p,
            sourceImportIds: importId ? [importId] : [],
          });
          addedCount++;
        }
      });

      const mergedProblems = Array.from(existingMap.values());
      const updatedData = {
        ...userData,
        problems: mergedProblems,
      };

      if (importMetadata) {
        const fullImport = {
          ...importMetadata,
          id: importId,
          date: new Date().toISOString(),
          count: newProblems.length,
        };
        updatedData.imports = [fullImport, ...(userData.imports || [])];
      }

      await updateUserData(updatedData);
      return addedCount;
    },
    [userData, updateUserData],
  );

  return { importProblems, mergeProblems, importing };
};
