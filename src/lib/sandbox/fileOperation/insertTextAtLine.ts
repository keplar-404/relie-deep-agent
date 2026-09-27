import { daytona } from "../index";
import { resolvePath } from "./resolvePath";

/**
 * Inserts text, code lines, or empty line gaps at a specific 1-indexed line number in a file.
 * Avoids full-file overwrites and preserves all existing content above and below the inserted position.
 */
export async function insertTextAtLine({
  path,
  line,
  text,
  sandBoxId,
}: {
  path: string;
  line: number;
  text: string;
  sandBoxId: string;
}) {
  try {
    const sandbox = await daytona.get(sandBoxId);
    const resolvedPath = resolvePath(path);

    const buffer = await sandbox.fs.downloadFile(resolvedPath);
    const originalText = buffer.toString("utf-8");
    const fileLines = originalText.split(/\r?\n/);

    // Normalize target line index (1-indexed input to 0-indexed position)
    const targetLineNum = Number(line);
    const insertIdx =
      isNaN(targetLineNum) || targetLineNum <= 1
        ? 0
        : targetLineNum > fileLines.length
          ? fileLines.length
          : targetLineNum - 1;

    // Split incoming text by newline so each line is inserted cleanly
    const incomingLines = text.split(/\r?\n/);

    // Splice incoming lines into the file lines array without overwriting
    fileLines.splice(insertIdx, 0, ...incomingLines);

    const updatedContent = fileLines.join("\n");
    await sandbox.fs.uploadFile(
      Buffer.from(updatedContent, "utf-8"),
      resolvedPath
    );

    const insertedCount = incomingLines.length;
    return `Successfully inserted ${insertedCount} line(s) at line ${insertIdx + 1} in ${path}. File now has ${fileLines.length} lines.`;
  } catch (error) {
    console.error("[fsOperations: insertTextAtLine] Error:", error);
    throw error;
  }
}

export default insertTextAtLine;
