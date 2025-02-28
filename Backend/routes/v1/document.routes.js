import express from "express";
import { processPdf, upload, processDocument } from "../../controllers/document.controller.js";

const router = express.Router();

router.post('/process-pdf', upload.single('pdfFile'), processPdf);
router.post('/process', upload.single('documentFile'), processDocument);

export default router;