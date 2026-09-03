import { Router } from 'express';
import { requireAuth, requireSuperAdmin, supabaseAdmin } from './supabaseAuth.js';
import { resolveLang, tr } from './lib/serverI18n.js';

const router = Router();

// Panel del dueño de la plataforma -- ver todas las agencias y ajustar el
// pool de licencias que cada una tiene cargado. Distinto de
// requireAgencyAdmin (que solo ve la propia agencia): acá no hay
// req.agencyId, se opera sobre cualquier agencia por :id.
router.get('/admin/agencies', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('trippulse_agencies')
      .select('id, name, slug, contact_email, license_credits_allocated, license_credits_used, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ agencies: data });
  } catch (error) {
    console.error('Error listando agencias:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/admin/agencies/:id/pool', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const lang = resolveLang(req);
    const delta = Number(req.body?.delta);

    if (!Number.isInteger(delta) || delta === 0) {
      return res.status(400).json({ error: tr(lang, 'delta debe ser un entero distinto de cero') });
    }

    const { data: agency, error: fetchError } = await supabaseAdmin
      .from('trippulse_agencies')
      .select('license_credits_allocated, license_credits_used')
      .eq('id', req.params.id)
      .single();
    if (fetchError || !agency) {
      return res.status(404).json({ error: tr(lang, 'Agencia no encontrada') });
    }

    const nextAllocated = agency.license_credits_allocated + delta;
    if (nextAllocated < agency.license_credits_used) {
      return res.status(400).json({ error: tr(lang, 'No puedes bajar el cupo por debajo de lo que la agencia ya consumió') });
    }
    if (nextAllocated < 0) {
      return res.status(400).json({ error: tr(lang, 'El cupo asignado no puede quedar negativo') });
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('trippulse_agencies')
      .update({ license_credits_allocated: nextAllocated })
      .eq('id', req.params.id)
      .select('id, name, license_credits_allocated, license_credits_used')
      .single();
    if (updateError) throw updateError;

    res.json({ agency: updated });
  } catch (error) {
    console.error('Error ajustando pool de licencias:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
