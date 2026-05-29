import express from 'express';
import fs from 'fs';
import prisma from '../lib/prisma';
import { logInfoFlow } from '../lib/ils';
import {
  ORDER_DOCUMENT_TYPES,
  deleteDocumentFile,
  documentAbsolutePath,
  uploadOrderDocument,
} from '../lib/orderDocuments';

const router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const order = await prisma.logisticsOrder.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Заказ не найден' });

    const documents = await prisma.logisticsOrderDocument.findMany({
      where: { orderId },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json(documents);
  } catch (error) {
    console.error('Error fetching order documents:', error);
    res.status(500).json({ error: 'Не удалось загрузить документы' });
  }
});

router.post('/', uploadOrderDocument.single('file'), async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const order = await prisma.logisticsOrder.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Заказ не найден' });

    if (!req.file) {
      return res.status(400).json({ error: 'Выберите файл для загрузки' });
    }

    const documentType = String(req.body.documentType || 'OTHER');
    if (!ORDER_DOCUMENT_TYPES.includes(documentType as (typeof ORDER_DOCUMENT_TYPES)[number])) {
      return res.status(400).json({ error: 'Недопустимый тип документа' });
    }

    const description = req.body.description?.trim() || null;

    const document = await prisma.logisticsOrderDocument.create({
      data: {
        orderId,
        fileName: req.file.originalname,
        storedName: req.file.filename,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        documentType,
        description,
      },
    });

    await logInfoFlow({
      ilsFunction: 'PLANNING',
      eventType: 'CREATE',
      entityType: 'LOGISTICS_ORDER_DOCUMENT',
      entityId: document.id,
      orderId,
      message: `К заказу ${order.orderNumber} прикреплён документ «${document.fileName}»`,
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading order document:', error);
    res.status(400).json({ error: 'Не удалось загрузить документ' });
  }
});

router.get('/:docId/download', async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const docId = Number(req.params.docId);

    const document = await prisma.logisticsOrderDocument.findFirst({
      where: { id: docId, orderId },
    });
    if (!document) return res.status(404).json({ error: 'Документ не найден' });

    const filePath = documentAbsolutePath(orderId, document.storedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Файл не найден на сервере' });
    }

    res.download(filePath, document.fileName);
  } catch (error) {
    console.error('Error downloading order document:', error);
    res.status(500).json({ error: 'Не удалось скачать документ' });
  }
});

router.delete('/:docId', async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const docId = Number(req.params.docId);

    const document = await prisma.logisticsOrderDocument.findFirst({
      where: { id: docId, orderId },
    });
    if (!document) return res.status(404).json({ error: 'Документ не найден' });

    const order = await prisma.logisticsOrder.findUnique({ where: { id: orderId } });

    deleteDocumentFile(orderId, document.storedName);
    await prisma.logisticsOrderDocument.delete({ where: { id: docId } });

    if (order) {
      await logInfoFlow({
        ilsFunction: 'PLANNING',
        eventType: 'DELETE',
        entityType: 'LOGISTICS_ORDER_DOCUMENT',
        entityId: docId,
        orderId,
        message: `Из заказа ${order.orderNumber} удалён документ «${document.fileName}»`,
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting order document:', error);
    res.status(500).json({ error: 'Не удалось удалить документ' });
  }
});

export default router;
