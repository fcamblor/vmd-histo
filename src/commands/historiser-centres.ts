/// <reference path="../../types.d.ts" />
import cron from 'node-cron'
import {Historique} from "../services/Historique";
import {ViteMaDose} from "../services/ViteMaDose";
import {Chronodoses} from "../services/Chronodoses";

async function refreshStats() {
    const [lieuxParDepartement, statsLieux]: [LieuxParDepartementAvecDepartement[], StatsLieu[]] = await Promise.all([
        ViteMaDose.INSTANCE.lieuxParDepartements(),
        Historique.INSTANCE.statsLieux()
    ]);

    const [_, lieuxInternalIdsPersistes] = await Promise.all([
        Historique.INSTANCE.historiserCentresParDepartements(lieuxParDepartement),
        Historique.INSTANCE.historiserStatsCentre(lieuxParDepartement, statsLieux)
    ]);

    // On a besoin que les stats centre aient été mis à jour / persisté pour pouvoir calculer les
    // centres éligibles aux chronodoses
    const centresChronodose = await Chronodoses.INSTANCE.trouverCentresEligiblesChronodose();
    await Historique.INSTANCE.historiserCentresChronodose(centresChronodose);

    console.log(`${lieuxInternalIdsPersistes.size} lieux mis à jour !`);
}

cron.schedule('*/2 * * * *', async () => {
    console.log(`${new Date().toISOString()} => Triggered task`)
    const start = Date.now();
    await refreshStats();
    console.log(`Refresh stats is over, it took ${Date.now()-start}ms`)
});
