import {mkdir, readdir, readFile, rmdir, writeFile} from "fs/promises";
import {outputDir} from "./Config";
import {existsSync} from "fs";

export class Historique {
    public static readonly INSTANCE = new Historique();
    private constructor() {
    }

    async statsLieux() {
        const files = await readdir(`${outputDir}/lieux/`, {});
        const statsLieux = await Promise.all(
            files.map(file => readFile(`${outputDir}/lieux/${file}`, 'utf8')
                .then(content => JSON.parse(content))))
                .then(([...statsLieux]: StatsLieu[]) => statsLieux as StatsLieu[])
        return statsLieux;
    }

    async historiserCentresParDepartements(lieuxParDepartement: LieuxParDepartementAvecDepartement[]) {
        await Promise.all(lieuxParDepartement.map(lieuParDepartementAvecDepartement => {
            const {departement, ...lieuParDepartement} = lieuParDepartementAvecDepartement;
            return Promise.all([
                writeFile(`${outputDir}/departements/${lieuParDepartementAvecDepartement.departement.code_departement}.json`, JSON.stringify(lieuParDepartement), 'utf8'),
                mkdir(`${outputDir}/departements/historique/${lieuParDepartementAvecDepartement.departement.code_departement}/`, {recursive: true})
                    .then(() => writeFile(`${outputDir}/departements/historique/${lieuParDepartementAvecDepartement.departement.code_departement}/${lieuParDepartementAvecDepartement.last_updated}.json`, JSON.stringify(lieuParDepartement), 'utf8'))
            ])
        }));
    }

    private mettreAJourHistoriqueStatsCentreAvec(lieuParDepartement: LieuxParDepartementAvecDepartement, statsLieuxParInternalId: Map<string, StatsLieu>): string[] {
        const lieux = lieuParDepartement.centres_disponibles.concat(lieuParDepartement.centres_indisponibles);
        return lieux.map(lieu => {
            const lieuInStat = {
                internal_id: lieu.internal_id,
                departement: lieu.departement,
                location: lieu.location,
                nom: lieu.nom,
                url: lieu.url,
                appointment_by_phone_only: lieu.appointment_by_phone_only,
                plateforme: lieu.plateforme,
                metadata: lieu.metadata,
                type: lieu.type,
                vaccine_type: lieu.vaccine_type
            };

            const stat = {
                date: lieuParDepartement.last_updated,

                prochain_rdv: lieu.prochain_rdv,
                appointment_count: lieu.appointment_count,
                chronodose_appointment_count: lieu.appointment_schedules?.find(sc => sc.name === 'chronodose')?.total
            };

            let updatedStats: StatLieu[]|undefined = undefined;

            if(statsLieuxParInternalId.has(lieu.internal_id)) {
                const statsLieu = statsLieuxParInternalId.get(lieu.internal_id)!;
                if(!statsLieu.stats.find(s => s.date === lieuParDepartement.last_updated)) {
                    const latestStats = statsLieu.stats[statsLieu.stats.length-1];
                    updatedStats = Historique.statDifferenceDetected(latestStats, stat) ? statsLieu.stats.concat([stat]) : undefined;
                }
            } else {
                updatedStats = [ stat ];
            }

            if(updatedStats) {
                statsLieuxParInternalId.set(lieu.internal_id, {
                    lieu: lieuInStat,
                    stats: updatedStats
                })
                return lieu.internal_id;
            }

            return undefined;
        }).filter(lieuInternalId => !!lieuInternalId) as string[];
    }

    async historiserStatsCentre(lieuxParDepartement: LieuxParDepartementAvecDepartement[], statsLieux: StatsLieu[]) {
        const statsLieuxParInternalId = statsLieux.reduce((res, statsLieu) => {
            res.set(statsLieu.lieu.internal_id, statsLieu);
            return res;
        }, new Map<string, StatsLieu>());

        const lieuxInternalIdsAPersister = lieuxParDepartement.reduce((results, lieuParDepartement) => {
            const updatedLieuInternalIds = this.mettreAJourHistoriqueStatsCentreAvec(lieuParDepartement, statsLieuxParInternalId);
            updatedLieuInternalIds.forEach(internalId => results.add(internalId))
            return results;
        }, new Set<string>());


        await Promise.all(Array.from(lieuxInternalIdsAPersister).map(internalId => {
            const statsLieu = statsLieuxParInternalId.get(internalId)!;
            return writeFile(`${outputDir}/lieux/${internalId}.json`, JSON.stringify(statsLieu), 'utf8')
        }));

        return lieuxInternalIdsAPersister;
    }

    private static statDifferenceDetected(latestStats: StatLieu, candidate: StatLieu): boolean {
        if(latestStats.appointment_count !== candidate.appointment_count) {
            return true;
        }

        if(latestStats.chronodose_appointment_count !== latestStats.chronodose_appointment_count) {
            return true;
        }

        return false;
    }

    async historiserCentresChronodose(lieuCandidatAuxChronodoses: LieuCandidatAuxChronodoses[]) {
        if(existsSync(`${outputDir}/lieux-candidats-chronodose/`)) {
            await rmdir(`${outputDir}/lieux-candidats-chronodose/`, {recursive: true});
        }
        await mkdir(`${outputDir}/lieux-candidats-chronodose/`, {recursive: true})

        await Promise.all(lieuCandidatAuxChronodoses.map(candidat =>
            writeFile(`${outputDir}/lieux-candidats-chronodose/${candidat.lieu.internal_id}.json`, JSON.stringify(candidat), 'utf8')
        ));
        await writeFile(`${outputDir}/lieux-candidats-chronodose.json`, JSON.stringify({
            lieux: lieuCandidatAuxChronodoses.map(c => c.lieu.internal_id),
            codePostaux: Array.from(lieuCandidatAuxChronodoses.reduce((codePostaux, lieu) => {
                if(lieu.lieu.location?.cp) {
                    codePostaux.add(lieu.lieu.location.cp);
                }
                return codePostaux;
            }, new Set<string>()))
        }), 'utf8');
    }
}
