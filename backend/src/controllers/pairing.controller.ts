import { Request, Response } from 'express';
import { sendSuccess } from '../lib/response';
import {
  addCategoryToPairing,
  createPairing,
  deletePairing,
  findAllPairings,
  findPairingById,
  removeCategoryFromPairing,
  updatePairing,
} from '../services/pairing.service';

export async function getPairings(_req: Request, res: Response): Promise<void> {
  const pairings = await findAllPairings();
  sendSuccess(res, 200, pairings);
}

export async function getPairingById(req: Request, res: Response): Promise<void> {
  const pairingId = Number(req.params.id);
  const pairing = await findPairingById(pairingId);
  sendSuccess(res, 200, pairing);
}

export async function postPairing(req: Request, res: Response): Promise<void> {
  const pairing = await createPairing(req.body);
  sendSuccess(res, 201, pairing);
}

export async function putPairing(req: Request, res: Response): Promise<void> {
  const pairingId = Number(req.params.id);
  const pairing = await updatePairing(pairingId, req.body);
  sendSuccess(res, 200, pairing);
}

export async function deletePairingHandler(req: Request, res: Response): Promise<void> {
  const pairingId = Number(req.params.id);
  await deletePairing(pairingId);
  sendSuccess(res, 200, { id: pairingId, deleted: true });
}

// ─── Liaisons atomiques ───────────────────────────────────────────────────────

export async function postPairingCategory(req: Request, res: Response): Promise<void> {
  const id_pairing = Number(req.params.id);
  const pairing = await addCategoryToPairing(id_pairing, req.body.id_category);
  sendSuccess(res, 200, pairing);
}

export async function deletePairingCategory(req: Request, res: Response): Promise<void> {
  const id_pairing = Number(req.params.id);
  const id_category = Number(req.params.id_category);
  const pairing = await removeCategoryFromPairing(id_pairing, id_category);
  sendSuccess(res, 200, pairing);
}
