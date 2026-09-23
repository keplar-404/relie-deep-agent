import { listFsTool } from "./listFsTool";
import { getFileDetailsTool } from "./getFileDetailsTool";
import { createFolderTool } from "./createFolderTool";
import { uploadFileTool } from "./uploadFileTool";
import { uploadFilesTool } from "./uploadFilesTool";
import { readFileTextTool } from "./readFileTextTool";
import { readFilesTextTool } from "./readFilesTextTool";
import { deleteFileTool } from "./deleteFileTool";
import { setFilePermissionsTool } from "./setFilePermissionsTool";
import { searchFilesTool } from "./searchFilesTool";
import { findFilesTool } from "./findFilesTool";
import { replaceInFilesTool } from "./replaceInFilesTool";
import { moveFilesTool } from "./moveFilesTool";
import { downloadFileStreamTool } from "./downloadFileStreamTool";

/** Aggregate array of all fs operation tools — pass directly to `createDeepAgent({ tools })`. */
export const fsTools = [
  listFsTool,
  getFileDetailsTool,
  createFolderTool,
  uploadFileTool,
  uploadFilesTool,
  readFileTextTool,
  readFilesTextTool,
  deleteFileTool,
  setFilePermissionsTool,
  searchFilesTool,
  findFilesTool,
  replaceInFilesTool,
  moveFilesTool,
  downloadFileStreamTool,
];