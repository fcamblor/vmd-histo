/// <reference path="../../types.d.ts" />
import cron from 'node-cron'
import {Historique} from "../services/Historique";
import {ViteMaDose} from "../services/ViteMaDose";
import {Chronodoses} from "../services/Chronodoses";
import {GitService} from "../services/GitService";
import {outputDir} from "../services/Config";

async function historiserCentres() {
    console.log(`${new Date().toISOString()} => Started centre historisation`)
    const start = Date.now();

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

    if(lieuxInternalIdsPersistes.size) {
        await GitService.INSTANCE.synchronizeContent([
            {from: `${outputDir}/departements/*.json`, to: `departements/`},
            {from: `${outputDir}/lieux/`, to: `lieux/`},
            {from: `${outputDir}/lieux-candidats-chronodose/`, to: `lieux-candidats-chronodose/`},
            {from: `${outputDir}/lieux-candidats-chronodose.json`, to: `lieux-candidats-chronodose.json`, avoidMkDir: true},
        ]);

        console.log("Files pushed to git repository !");
    }

    console.log(`Refresh stats is over, it took ${Date.now()-start}ms`)
}

if(process.env.START_CRON) {
    cron.schedule('*/2 * * * *', historiserCentres);
    console.log("CRON started !")
}
historiserCentres();
