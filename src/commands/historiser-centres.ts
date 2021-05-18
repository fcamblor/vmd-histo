/// <reference path="../../types.d.ts" />
import cron from 'node-cron'
import {Historique} from "../services/Historique";
import {ViteMaDose} from "../services/ViteMaDose";

async function refreshStats() {
    const [lieuxParDepartement, statsLieux]: [LieuxParDepartementAvecDepartement[], StatsLieu[]] = await Promise.all([
        ViteMaDose.INSTANCE.lieuxParDepartements(),
        Historique.INSTANCE.statsLieux()
    ]);

    const [_, lieuxInternalIdsPersistes] = await Promise.all([
        Historique.INSTANCE.historiserCentresParDepartements(lieuxParDepartement),
        Historique.INSTANCE.historiserStatsCentre(lieuxParDepartement, statsLieux)
    ])

    console.log(`${lieuxInternalIdsPersistes.size} lieux mis à jour !`);
}

cron.schedule('*/2 * * * *', async () => {
    console.log(`${new Date().toISOString()} => Triggered task`)
    const start = Date.now();
    await refreshStats();
    console.log(`Refresh stats is over, it took ${Date.now()-start}ms`)
});
