/// <reference path="../../types.d.ts" />
import {mkdir, readdir, readFile, writeFile} from "fs/promises";
import fetch from 'node-fetch';
import cron from 'node-cron'

// const rootUrl = 'https://raw.githubusercontent.com/CovidTrackerFr/vitemadose/data-auto/data/output'

const rootUrl = 'https://vitemadose.gitlab.io/vitemadose'
const outputDir = `../../resultats`

cron.schedule('*/2 * * * *', async () => {
    console.log(`${new Date().toISOString()} => Triggered task`)
    const start = Date.now();
    await refreshStats();
    console.log(`Refresh stats is over, it took ${Date.now()-start}ms`)
});

function lieuxParDepartements() {
    return fetch(`${rootUrl}/departements.json`)
        .then(resp => resp.json())
        .then((depts: Departement[]) => {
            return Promise.all(depts.map(dept => {
                return fetch(`${rootUrl}/${dept.code_departement}.json`)
                    .then(resp => resp.json())
                    .then(data => ({...data, departement: dept}))
            }))
        }).then(([...lieux]: LieuxParDepartementAvecDepartement[]) => lieux as LieuxParDepartementAvecDepartement[]);
}

function statsLieux() {
    return readdir(`${outputDir}/lieux/`, {})
        .then(files => {
            return Promise.all(files.map(file => readFile(`${outputDir}/lieux/${file}`, 'utf8').then(content => JSON.parse(content))))
        }).then(([...statsLieux]: StatsLieu[]) => statsLieux as StatsLieu[]);
}

function refreshStats() {
    return Promise.all([
        lieuxParDepartements(),
        statsLieux()
    ]).then(async ([lieuxParDepartement, statsLieux]: [LieuxParDepartementAvecDepartement[], StatsLieu[]]) => {
        await Promise.all(lieuxParDepartement.map(lieuParDepartementAvecDepartement => {
            const {departement, ...lieuParDepartement} = lieuParDepartementAvecDepartement;
            return Promise.all([
                writeFile(`${outputDir}/departements/${lieuParDepartementAvecDepartement.departement.code_departement}.json`, JSON.stringify(lieuParDepartement), 'utf8'),
                mkdir(`${outputDir}/departements/historique/${lieuParDepartementAvecDepartement.departement.code_departement}/`, {recursive: true})
                    .then(() => writeFile(`${outputDir}/departements/historique/${lieuParDepartementAvecDepartement.departement.code_departement}/${lieuParDepartementAvecDepartement.last_updated}.json`, JSON.stringify(lieuParDepartement), 'utf8'))
            ])
        }));

        const statsLieuxParInternalId = statsLieux.reduce((res, statsLieu) => {
            res.set(statsLieu.lieu.internal_id, statsLieu);
            return res;
        }, new Map<string, StatsLieu>());

        const lieuxInternalIdsAPersister = new Set<string>();
        lieuxParDepartement.forEach(lieuParDepartement => {
            const lieux = lieuParDepartement.centres_disponibles.concat(lieuParDepartement.centres_indisponibles);
            lieux.forEach(lieu => {
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
                        updatedStats = statDifferenceDetected(latestStats, stat) ? statsLieu.stats.concat([stat]) : undefined;
                    }
                } else {
                    updatedStats = [ stat ];
                }

                if(updatedStats) {
                    statsLieuxParInternalId.set(lieu.internal_id, {
                        lieu: lieuInStat,
                        stats: updatedStats
                    })
                    lieuxInternalIdsAPersister.add(lieu.internal_id);
                }
            })
        });

        await Promise.all(Array.from(lieuxInternalIdsAPersister).map(internalId => {
            const statsLieu = statsLieuxParInternalId.get(internalId)!;
            return writeFile(`${outputDir}/lieux/${internalId}.json`, JSON.stringify(statsLieu), 'utf8')
        }));

        console.log(`${lieuxInternalIdsAPersister.size} lieux mis à jour !`);
    })
}

function statDifferenceDetected(latestStats: StatLieu, candidate: StatLieu): boolean {
    if(latestStats.appointment_count !== candidate.appointment_count) {
        return true;
    }

    if(latestStats.chronodose_appointment_count !== latestStats.chronodose_appointment_count) {
        return true;
    }

    return false;
}
